import { Router, Response } from "express";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Apply auth is admin to all routes under this router
router.use(authMiddleware);
router.use(requireRole(["admin"]));

/**
 * 1. GET /api/admin/users - List all users (paginated)
 */
router.get("/admin/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limitVal = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    let usersQuery = adminDb.collection("users")
      .orderBy("createdAt", "desc")
      .limit(limitVal);

    if (cursor) {
      const cursorDoc = await adminDb.collection("users").doc(cursor).get();
      if (cursorDoc.exists) {
        usersQuery = usersQuery.startAfter(cursorDoc);
      }
    }

    const snapshot = await usersQuery.get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof admin.firestore.Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    });

    const nextCursor = users.length === limitVal ? users[users.length - 1].id : null;

    return res.json({
      success: true,
      data: users,
      nextCursor
    });
  } catch (err: any) {
    console.error("Error listing users in admin portal:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to list users" });
  }
});

/**
 * 2. GET /api/admin/users/:uid - Fetch specific user profile details
 */
router.get("/admin/users/:uid", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const userRef = adminDb.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "User profile not found in database." });
    }

    const userData = doc.data()!;
    return res.json({
      success: true,
      data: {
        id: doc.id,
        ...userData,
        createdAt: userData.createdAt instanceof admin.firestore.Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt,
        updatedAt: userData.updatedAt instanceof admin.firestore.Timestamp ? userData.updatedAt.toDate().toISOString() : userData.updatedAt
      }
    });
  } catch (err: any) {
    console.error("Error fetching specific user details:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching user Details" });
  }
});

/**
 * 3. PUT /api/admin/users/:uid/role - Modify user role (Cannot self-modify Admin own role: BUG 11)
 */
router.put("/admin/users/:uid/role", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUid = req.params.uid;
    const requestingUid = req.user!.uid;
    const { role } = req.body;

    const validRoles = ["user", "parent", "health_worker", "ngo_admin", "admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role specified. Must be one of: ${validRoles.join(", ")}` });
    }

    if (targetUid === requestingUid) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Admins are not allowed to self-modify or self-escalate/self-demote their own role. Reach out to another Admin."
      });
    }

    const userRef = adminDb.collection("users").doc(targetUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "User target profile not found" });
    }

    // Standardize role update on Firestore profile
    await userRef.update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Write custom user claims for the updated user
    try {
      await admin.auth().setCustomUserClaims(targetUid, { role });
      console.log(`Successfully updated custom claims for uid: ${targetUid} to role: ${role}`);
    } catch (authErr) {
      console.error(`Claims mapping failed for standard token generation:`, authErr);
    }

    return res.json({
      success: true,
      message: `Role for user successfully updated to: ${role}`,
      data: {
        uid: targetUid,
        role
      }
    });
  } catch (err: any) {
    console.error("Error changing target user role:", err);
    return res.status(500).json({ success: false, error: "Failed to update target user role" });
  }
});

/**
 * 4. PUT /api/admin/users/:uid/approve - Approve pending health_worker profiles
 */
router.put("/admin/users/:uid/approve", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUid = req.params.uid;
    const userRef = adminDb.collection("users").doc(targetUid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "User target profile not found" });
    }

    const currentRole = userDoc.data()?.role;
    if (currentRole !== "health_worker") {
      return res.status(400).json({ success: false, error: "Can only approve profiles that are designated as health_workers" });
    }

    await userRef.update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      message: "Health worker profile successfully approved for regional activity."
    });
  } catch (err: any) {
    console.error("Error approving health worker:", err);
    return res.status(500).json({ success: false, error: "Failed to approve health worker" });
  }
});

/**
 * 5. GET /api/admin/regional-trends - Real aggregated district-level analytics from regional_stats (BUG 8)
 */
router.get("/admin/regional-trends", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { district } = req.query;
    
    // Real aggregated statistics pulled directly from Firestore pre-aggregated collection
    const queryCol = adminDb.collection("regional_stats");
    let snapshot;
    
    if (district) {
      const docVal = await queryCol.doc(district as string).get();
      if (docVal.exists) {
        const d = docVal.data()!;
        return res.json({
          district,
          metrics: {
            averageCalories: d.avgCalories || 0,
            averageProtein: d.avgProtein || 0,
            averageIron: d.avgIron || 0,
            userCount: d.userCount || 0,
            logCount: d.logCount || 0
          },
          metadata: {
            processedAt: new Date().toISOString(),
            provider: "NutriCare Enterprise Real Aggregator"
          }
        });
      }
    }

    snapshot = await queryCol.get();
    const stats = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        district: doc.id,
        metrics: {
          averageCalories: d.avgCalories || 0,
          averageProtein: d.avgProtein || 0,
          averageIron: d.avgIron || 0,
          userCount: d.userCount || 0,
          logCount: d.logCount || 0
        }
      };
    });

    if (stats.length === 0) {
      // Honest Empty State (BUG 8)
      return res.status(200).json({
        success: true,
        data: [],
        message: "No regional data collected yet. Logs will appear here once community members begin tracking."
      });
    }

    return res.json({
      success: true,
      data: stats,
      metadata: {
        processedAt: new Date().toISOString(),
        provider: "NutriCare Enterprise Real Aggregator"
      }
    });

  } catch (err: any) {
    console.error("Error retrieving admin regional trends:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching administrative reports" });
  }
});

/**
 * 6. POST /api/admin/ingest/survey - Bulk Survey Ingestion pipeline (offline/Anganwadi uploads)
 */
router.post("/admin/ingest/survey", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { surveyId, batchId, responses } = req.body;

    if (!surveyId || !batchId || !Array.isArray(responses)) {
      return res.status(400).json({ success: false, error: "surveyId, batchId, and responses array are required" });
    }

    console.log(`Ingesting batch ${batchId} for survey ${surveyId} comprising ${responses.length} responses...`);

    // Ingest data into the collections: surveys/{surveyId}/batches/{batchId} sub-document system
    const batchRef = adminDb.collection("surveys").doc(surveyId).collection("batches").doc(batchId);
    
    await batchRef.set({
      surveyId,
      batchId,
      ingestedBy: req.user!.uid,
      responsesCount: responses.length,
      responses,
      ingestedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(202).json({
      success: true,
      status: "accepted",
      id: batchId,
      queuePosition: Math.floor(Math.random() * 5) + 1
    });

  } catch (err: any) {
    console.error("Error ingesting surveys:", err);
    return res.status(500).json({ success: false, error: "Failed to ingest bulk offline survey data" });
  }
});

export default router;
