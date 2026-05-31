import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, adminAuth } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Zod Validation Schemas
const createUserSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["Community Member", "Health Worker", "NGO/Academy Partner", "Admin"]).default("Community Member"),
  region: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(10).default("en"),
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  region: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(10).optional(),
  // Strict prevention of self-privilege escalation on standard updates
  role: z.enum(["Community Member", "Health Worker", "NGO/Academy Partner", "Admin"]).optional(),
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

    const { displayName, email, role, region, language } = validation.data;
    const uid = req.user!.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ success: false, error: "User profile already exists" });
    }

    const profileData = {
      uid,
      displayName,
      email,
      role,
      region: region || "Unspecified",
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(profileData);

    // Sync role inside custom claims for high-perf API gateway checks
    await adminAuth.setCustomUserClaims(uid, { role });

    return res.status(201).json({
      success: true,
      data: profileData
    });
  } catch (err: any) {
    console.error("Error creating user profile:", err);
    return res.status(500).json({ success: false, error: "Failed to create user profile. Please try again." });
  }
});

/**
 * 3. GET /api/users/me - Return current user profile from Firestore
 */
router.get("/users/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(444).json({ success: false, error: "User profile not found. Please onboarding." });
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
 * 4. PUT /api/users/me - Update profile fields
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

    const { displayName, region, language, role } = validation.data;
    const uid = req.user!.uid;
    const currentRole = req.user!.role;

    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(444).json({ success: false, error: "User profile not found" });
    }

    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updatePayload.displayName = displayName;
    if (region !== undefined) updatePayload.region = region;
    if (language !== undefined) updatePayload.language = language;

    // Strict role check: Do not let users change their own role unless they are already Admin
    if (role !== undefined && role !== currentRole) {
      if (currentRole !== "Admin") {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You cannot modify your own security roles/permissions"
        });
      }
      updatePayload.role = role;
      // Sync to Firebase Auth custom claims as well
      await adminAuth.setCustomUserClaims(uid, { role });
    }

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
