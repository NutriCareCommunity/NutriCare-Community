import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Standardized role set: user, parent, health_worker, ngo_admin, admin (BUG 2)
const userRoles = ["user", "parent", "health_worker", "ngo_admin", "admin"] as const;
const ageGroups = ["child", "teen", "adult", "elderly", "pregnant"] as const;
const languages = ["en", "te", "hi", "ta", "kn"] as const;

// Zod Validation Schemas matching canonical Firestore schema
const createUserSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(userRoles).default("user"),
  ageGroup: z.enum(ageGroups).default("adult"),
  region: z.string().min(1).max(100).optional(),
  language: z.enum(languages).default("en"),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  region: z.string().min(1).max(100).optional(),
  language: z.enum(languages).optional(),
  ageGroup: z.enum(ageGroups).optional(),
  familyId: z.string().max(100).optional(),
  onboarded: z.boolean().optional(),
  nutriScore: z.number().min(0).max(100).optional(),
});

/**
 * 1. POST /api/auth/verify - Verify Firebase ID token & return payload
 */
router.post("/auth/verify", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      uid: req.user?.uid,
      email: req.user?.email,
      role: req.user?.role,
      name: req.user?.name,
    }
  });
});

/**
 * 2. POST /api/users - Create user profile on first login (called post Firebase signup)
 */
router.post("/users", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = createUserSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ") 
      });
    }

    const { displayName, email, role, region, language, ageGroup } = validation.data;
    const uid = req.user!.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ success: false, error: "User profile already exists" });
    }

    // Standard properties
    const profileData = {
      uid,
      displayName,
      email,
      role, // Allowed to select on creation/onboarding
      ageGroup,
      region: region || "Unspecified",
      language,
      nutriScore: 50, // Starts at a base score of 50
      onboarded: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(profileData);

    return res.status(201).json({
      success: true,
      data: {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Error creating user profile:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to create user profile. Please try again." });
  }
});

/**
 * 3. GET /api/users/me - Return current user profile from Firestore (fixed non-standard status code: BUG 6)
 */
router.get("/users/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "User profile not found. Please complete onboarding." });
    }

    return res.json({
      success: true,
      data: userDoc.data()
    });
  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching user profile" });
  }
});

/**
 * 4. PUT /api/users/me - Update profile fields (Fixed BUG 12 - Forbid self role-escalation, Fixed BUG 6 - replaced status 444 with 404)
 */
router.put("/users/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = updateUserSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ") 
      });
    }

    // Role is NOT in updateUserSchema to prevent any attempts at modifying own role (BUG 12)
    if ("role" in rawBody) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Security roles/permissions cannot be self-modified. Contact an administrator."
      });
    }

    const { displayName, region, language, ageGroup, familyId, onboarded, nutriScore } = validation.data;
    const uid = req.user!.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: "User profile not found" }); // BUG 6: status replaced with 404
    }

    const updatePayload: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updatePayload.displayName = displayName;
    if (region !== undefined) updatePayload.region = region;
    if (language !== undefined) updatePayload.language = language;
    if (ageGroup !== undefined) updatePayload.ageGroup = ageGroup;
    if (familyId !== undefined) updatePayload.familyId = familyId;
    if (onboarded !== undefined) updatePayload.onboarded = onboarded;
    if (nutriScore !== undefined) updatePayload.nutriScore = nutriScore;

    await userRef.update(updatePayload);

    // Get updated profile doc
    const updatedDoc = await userRef.get();

    return res.json({
      success: true,
      data: updatedDoc.data()
    });
  } catch (err: any) {
    console.error("Error updating user profile:", err);
    return res.status(500).json({ success: false, error: "Internal server error updating user profile" });
  }
});

export default router;
