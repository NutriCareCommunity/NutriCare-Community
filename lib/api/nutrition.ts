import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Zod Validation Schemas
const nutrientSchema = z.object({
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
});

const logMealSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  foods: z.array(z.string().min(1)).min(1),
  calories: z.number().min(0),
  nutrients: nutrientSchema.optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("breakfast"),
});

/**
 * 1. POST /api/nutrition/log - Log a meal
 */
router.post("/nutrition/log", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = logMealSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { userId, date, foods, calories, nutrients, mealType } = validation.data;
    const currentUserId = req.user!.uid;
    const currentUserRole = req.user!.role;

    // Zero Trust check: standard users can only record meals for themselves or family. Health Workers & Admins can write for any user.
    let hasAccess = userId === currentUserId || currentUserRole === "health_worker" || currentUserRole === "admin";
    
    if (!hasAccess) {
      // Check if family member (using custom claims or db lookup)
      try {
        const userRef = adminDb.collection("users").doc(currentUserId);
        const userDoc = await userRef.get();
        const targetRef = adminDb.collection("users").doc(userId);
        const targetDoc = await targetRef.get();
        if (userDoc.exists && targetDoc.exists) {
          const myFamilyId = userDoc.data()?.familyId;
          const targetFamilyId = targetDoc.data()?.familyId;
          if (myFamilyId && myFamilyId === targetFamilyId) {
            hasAccess = true;
          }
        }
      } catch (e) {
        console.error("Family access check error in nutrition log creation:", e);
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access Denied: You do not have permission to log nutrition for other community members."
      });
    }

    // Store log in a top-level nutrition_logs collection
    const logRef = adminDb.collection("nutrition_logs").doc();
    const logData = {
      userId,
      date,
      foods,
      calories,
      nutrients: nutrients || { protein: 0, carbs: 0, fat: 0, iron: 0 },
      mealType,
      loggedBy: currentUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // BUG-FREE SERVER TIMESTAMP (PART 3 Key Rules)
    };

    await logRef.set(logData);

    // BUG 13 Fix: Daily scoring model. Only update once per day.
    try {
      const userRef = adminDb.collection("users").doc(userId);
      await adminDb.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);
        if (userDoc.exists) {
          const userData = userDoc.data();
          const lastScoreDate = userData?.lastScoreDate || "";
          
          if (lastScoreDate !== date) {
            const currentNutriScore = userData?.nutriScore || 50;
            // Balance calculation (e.g. higher score if healthy components such as sprouts/millets are logged)
            const healthyVariety = foods.some(f => 
              f.toLowerCase().includes("millet") || 
              f.toLowerCase().includes("sprout") || 
              f.toLowerCase().includes("dal") || 
              f.toLowerCase().includes("pulse") || 
              f.toLowerCase().includes("green") || 
              f.toLowerCase().includes("fruit")
            );
            const increment = healthyVariety ? 5 : 3;
            const updatedScore = Math.min(100, currentNutriScore + increment);
            
            tx.update(userRef, {
              nutriScore: updatedScore,
              lastScoreDate: date,
              lastLoggedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      });
    } catch (cacheErr) {
      console.warn("Failed to safely recompute user profile cached score in daily model:", cacheErr);
    }

    // BUG 7 Fix: Maintain regional pre-aggregated stats incrementally in transaction, avoiding collection scans (O(n) reads)
    try {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const userRegion = userDoc.exists ? (userDoc.data()?.region || "Rural General") : "Rural General";
      const statsRef = adminDb.collection("regional_stats").doc(userRegion);

      await adminDb.runTransaction(async (tx) => {
        const statsDoc = await tx.get(statsRef);
        const logWeight = 1;
        const proteinVal = nutrients?.protein || 0;
        const ironVal = nutrients?.iron || 0;

        if (!statsDoc.exists) {
          tx.set(statsRef, {
            avgCalories: calories,
            avgProtein: proteinVal,
            avgIron: ironVal,
            userCount: 1,
            logCount: 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          const sData = statsDoc.data()!;
          const newLogCount = (sData.logCount || 0) + 1;
          const newAvgCal = Math.round(((sData.avgCalories || 0) * (sData.logCount || 0) + calories) / newLogCount);
          const newAvgProt = Math.round((((sData.avgProtein || 0) * (sData.logCount || 0) + proteinVal) / newLogCount) * 10) / 10;
          const newAvgIron = Math.round((((sData.avgIron || 0) * (sData.logCount || 0) + ironVal) / newLogCount) * 10) / 10;
          
          tx.update(statsRef, {
            avgCalories: newAvgCal,
            avgProtein: newAvgProt,
            avgIron: newAvgIron,
            logCount: newLogCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    } catch (statsErr) {
      console.warn("Failed to incrementally pre-aggregate regional statistics doc:", statsErr);
    }

    return res.status(201).json({
      success: true,
      data: {
        ...logData,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Error logging nutrition:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error logging nutrition event" });
  }
});

/**
 * 2. GET /api/nutrition/log - Fetch logs for a user and date
 */
router.get("/nutrition/log", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryUserId = (req.query.userId as string) || req.user!.uid;
    const queryDate = req.query.date as string;
    const currentUserId = req.user!.uid;
    const currentUserRole = req.user!.role;

    // Zero Trust: Only the own user, family members, Health Workers, or Admins can fetch these logs
    let hasAccess = queryUserId === currentUserId || currentUserRole === "health_worker" || currentUserRole === "admin";
    
    if (!hasAccess) {
      try {
        const userRef = adminDb.collection("users").doc(currentUserId);
        const userDoc = await userRef.get();
        const targetRef = adminDb.collection("users").doc(queryUserId);
        const targetDoc = await targetRef.get();
        if (userDoc.exists && targetDoc.exists) {
          const myFamilyId = userDoc.data()?.familyId;
          const targetFamilyId = targetDoc.data()?.familyId;
          if (myFamilyId && myFamilyId === targetFamilyId) {
            hasAccess = true;
          }
        }
      } catch (e) {
        console.error("Family access query check error:", e);
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access Denied: You cannot view nutrition history for other users."
      });
    }

    let logsQuery = adminDb.collection("nutrition_logs").where("userId", "==", queryUserId);
    if (queryDate) {
      logsQuery = logsQuery.where("date", "==", queryDate);
    }

    const snapshot = await logsQuery.get();
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    return res.json({
      success: true,
      data: logs
    });
  } catch (err: any) {
    console.error("Error fetching nutrition logs:", err);
    return res.status(500).json({ success: false, error: "Internal server error querying nutrition records" });
  }
});

/**
 * 3. GET /api/nutrition/regional-summary - Fetches pre-aggregated statistics from regional_stats collection (BUG 7)
 */
router.get(
  "/nutrition/regional-summary",
  authMiddleware,
  requireRole(["health_worker", "ngo_admin", "admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Query from canonical pre-aggregated regional_stats collection (BUG 7)
      const cachedSnapshot = await adminDb.collection("regional_stats").get();
      const results: any[] = [];

      cachedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        results.push({
          region: doc.id,
          totalLogsCount: data.logCount || 0,
          userCount: data.userCount || 0,
          averageCalories: data.avgCalories || 0,
          averageProtein: data.avgProtein || 0,
          averageIron: data.avgIron || 0,
        });
      });

      // BUG 4 Fix: Fallback only in development or if DB has no regional logs yet
      if (results.length === 0 && process.env.NODE_ENV !== "production") {
        results.push(
          { region: "Nalgonda_North", totalLogsCount: 24, userCount: 15, averageCalories: 1820, averageProtein: 48.5, averageIron: 6.2 },
          { region: "Gadwal_West", totalLogsCount: 42, userCount: 22, averageCalories: 1950, averageProtein: 52.4, averageIron: 8.4 },
          { region: "Wanaparthy_East", totalLogsCount: 18, userCount: 10, averageCalories: 1650, averageProtein: 41.2, averageIron: 5.1 }
        );
      }

      return res.json({
        success: true,
        data: results
      });
    } catch (err: any) {
      console.error("Error creating regional nutrition summary:", err);
      return res.status(500).json({ success: false, error: "Internal server error creating regional reports" });
    }
  }
);

export default router;
