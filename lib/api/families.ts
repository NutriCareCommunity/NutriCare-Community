import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();
router.use(authMiddleware);

const createFamilySchema = z.object({
  name: z.string().min(2).max(100),
});

/**
 * 1. POST /api/families - Create a family group
 */
router.post("/families", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = createFamilySchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({ success: false, error: "Validation failed: " + validation.error.format() });
    }

    const { name } = validation.data;
    const adminId = req.user!.uid;

    const familyRef = adminDb.collection("families").doc();
    const familyData = {
      name,
      adminId,
      members: [adminId], // creator is the first member
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await familyRef.set(familyData);

    // Update user's familyId field in their profile
    const userRef = adminDb.collection("users").doc(adminId);
    await userRef.update({
      familyId: familyRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      success: true,
      data: {
        id: familyRef.id,
        ...familyData,
        createdAt: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error("Error creating family group:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to create family group" });
  }
});

/**
 * 2. GET /api/families/:id - Get family group details
 */
router.get("/families/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.uid;

    const familyRef = adminDb.collection("families").doc(id);
    const familyDoc = await familyRef.get();

    if (!familyDoc.exists) {
      return res.status(404).json({ success: false, error: "Family group not found" });
    }

    const familyData = familyDoc.data()!;
    const membersList = familyData.members || [];

    // Access check: only family members, health_workers or admins may view details
    const hasAccess = membersList.includes(userId) || req.user!.role === "health_worker" || req.user!.role === "admin";
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access Denied: You do not belong to this family group" });
    }

    return res.json({
      success: true,
      data: {
        id: familyDoc.id,
        ...familyData,
        createdAt: familyData.createdAt instanceof admin.firestore.Timestamp ? familyData.createdAt.toDate().toISOString() : familyData.createdAt
      }
    });

  } catch (err: any) {
    console.error("Error fetching family details:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching family details" });
  }
});

/**
 * 3. POST /api/families/:id/members - Add a member to the family group (max 20)
 */
router.post("/families/:id/members", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { memberUid } = req.body;
    const userId = req.user!.uid;

    if (!memberUid) {
      return res.status(400).json({ success: false, error: "memberUid is required" });
    }

    const familyRef = adminDb.collection("families").doc(id);
    const familyDoc = await familyRef.get();

    if (!familyDoc.exists) {
      return res.status(404).json({ success: false, error: "Family group not found" });
    }

    const familyData = familyDoc.data()!;
    
    // Only family admin can add members
    if (familyData.adminId !== userId && req.user!.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access Denied: Only family administrators can add members" });
    }

    const membersList = familyData.members || [];
    if (membersList.length >= 20) {
      return res.status(400).json({ success: false, error: "Strict Limit: Family groups are limited to a maximum of 20 members" });
    }

    if (membersList.includes(memberUid)) {
      return res.status(400).json({ success: false, error: "User is already a member of this family" });
    }

    // Verify user exists in global profiles
    const targetUserRef = adminDb.collection("users").doc(memberUid);
    const targetDoc = await targetUserRef.get();
    if (!targetDoc.exists) {
      return res.status(404).json({ success: false, error: "Target user not found" });
    }

    await familyRef.update({
      members: admin.firestore.FieldValue.arrayUnion(memberUid),
    });

    await targetUserRef.update({
      familyId: id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      message: "Successfully added member to the family group"
    });

  } catch (err: any) {
    console.error("Error adding family member:", err);
    return res.status(500).json({ success: false, error: "Failed to add member to family group" });
  }
});

export default router;
