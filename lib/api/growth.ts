import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();
router.use(authMiddleware);

const growthRecordSchema = z.object({
  height: z.number().min(20).max(300).optional(),
  weight: z.number().min(0.5).max(500).optional(),
  muac: z.number().min(5).max(50).optional(), // Mid-Upper Arm Circumference, critical indicator for child wasting
  headCircumference: z.number().min(10).max(100).optional(),
});

/**
 * 1. POST /api/users/:uid/growth - Log physical growth metric
 */
router.post("/users/:uid/growth", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user!.uid;

    const hasAccess = uid === currentUserId || req.user!.role === "health_worker" || req.user!.role === "admin";
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    const rawBody = req.body;
    const validation = growthRecordSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: "Validation failed: " + validation.error.format() });
    }

    const { height, weight, muac, headCircumference } = validation.data;
    const recordRef = adminDb.collection("users").doc(uid).collection("growth").doc();

    const recordData = {
      height,
      weight,
      muac,
      headCircumference,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await recordRef.set(recordData);

    return res.status(201).json({
      success: true,
      data: {
        id: recordRef.id,
        ...recordData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error("Error creating growth record:", err);
    return res.status(500).json({ success: false, error: "Failed to record growth tracking metrics" });
  }
});

/**
 * 2. GET /api/users/:uid/growth - Fetch growth records
 */
router.get("/users/:uid/growth", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user!.uid;

    const hasAccess = uid === currentUserId || req.user!.role === "health_worker" || req.user!.role === "admin";
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    const snapshot = await adminDb.collection("users").doc(uid).collection("growth").orderBy("timestamp", "desc").get();
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp instanceof admin.firestore.Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
      };
    });

    return res.json({
      success: true,
      data: records
    });

  } catch (err: any) {
    console.error("Error loading growth charts:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching growth metrics" });
  }
});

export default router;
