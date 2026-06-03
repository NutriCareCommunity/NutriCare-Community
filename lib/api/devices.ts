import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();
router.use(authMiddleware);

const deviceSchema = z.object({
  deviceName: z.string().min(1).max(100),
  deviceType: z.enum(["Watch", "Scale", "BP Monitor", "Glucose Meter"]),
  status: z.enum(["connected", "disconnected", "syncing"]).default("connected"),
  batteryLevel: z.number().min(0).max(100).optional(),
});

/**
 * 1. POST /api/users/:uid/devices - Associate connected device
 */
router.post("/users/:uid/devices", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user!.uid;

    if (uid !== currentUserId && req.user!.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    const rawBody = req.body;
    const validation = deviceSchema.safeParse(rawBody);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: "Validation failed: " + validation.error.format() });
    }

    const { deviceName, deviceType, status, batteryLevel } = validation.data;
    const deviceId = `dev_${Math.floor(Math.random() * 900000) + 100000}`;

    const deviceData = {
      deviceName,
      deviceType,
      status,
      batteryLevel: batteryLevel || 100,
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
    };

    const deviceRef = adminDb.collection("users").doc(uid).collection("devices").doc(deviceId);
    await deviceRef.set(deviceData);

    return res.status(201).json({
      success: true,
      data: {
        id: deviceId,
        ...deviceData,
        lastSync: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error("Error creating associated device:", err);
    return res.status(500).json({ success: false, error: "Failed to connect health device" });
  }
});

/**
 * 2. GET /api/users/:uid/devices - List associated devices
 */
router.get("/users/:uid/devices", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user!.uid;

    if (uid !== currentUserId && req.user!.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access Denied" });
    }

    const snapshot = await adminDb.collection("users").doc(uid).collection("devices").get();
    const devices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastSync: data.lastSync instanceof admin.firestore.Timestamp ? data.lastSync.toDate().toISOString() : data.lastSync
      };
    });

    return res.json({
      success: true,
      data: devices
    });

  } catch (err: any) {
    console.error("Error listing devices:", err);
    return res.status(500).json({ success: false, error: "Internal server error connecting health devices" });
  }
});

export default router;
