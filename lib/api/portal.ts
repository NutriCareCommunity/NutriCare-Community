import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, requireRole, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Zod Validation Schemas
const createProgramSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  targetRegion: z.string().min(1).max(100),
  goals: z.array(z.string().min(2).max(150)).min(1).max(20),
});

/**
 * 1. GET /api/portal/reports - Fetch aggregated health reports by region (standardized roles: BUG 2)
 */
router.get(
  "/portal/reports",
  authMiddleware,
  requireRole(["ngo_admin", "admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Aggregate data across registrations to map region demographic vulnerability indicators
      const usersSnapshot = await adminDb.collection("users").get();
      const regionDistribution: Record<string, {
        region: string;
        communityMemberCount: number;
        healthWorkerCount: number;
        avgNutriScoreSum: number;
        userWithScoreCount: number;
      }> = {};

      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();
        const region = user.region || "Rural General";
        const role = user.role;
        const nutriScore = user.nutriScore || 75; // Default score if none is set

        if (!regionDistribution[region]) {
          regionDistribution[region] = {
            region,
            communityMemberCount: 0,
            healthWorkerCount: 0,
            avgNutriScoreSum: 0,
            userWithScoreCount: 0,
          };
        }

        if (role === "user" || role === "parent") {
          regionDistribution[region].communityMemberCount += 1;
          regionDistribution[region].avgNutriScoreSum += nutriScore;
          regionDistribution[region].userWithScoreCount += 1;
        } else if (role === "health_worker") {
          regionDistribution[region].healthWorkerCount += 1;
        }
      });

      const reportCards = Object.values(regionDistribution).map(rec => {
        const userCount = rec.userWithScoreCount || 1;
        const scoreRating = Math.round(rec.avgNutriScoreSum / userCount);
        
        let regionalAlert: string;
        let riskCategory: "Low" | "Medium" | "High";

        if (scoreRating < 60) {
          regionalAlert = "Immediate iron-deficiency screening recommended.";
          riskCategory = "High";
        } else if (scoreRating < 80) {
          regionalAlert = "Focus on micro-nutrient dietary inclusions (millet/dal).";
          riskCategory = "Medium";
        } else {
          regionalAlert = "Maintain current nutritional education outreach.";
          riskCategory = "Low";
        }

        return {
          region: rec.region,
          registeredUsers: rec.communityMemberCount,
          activeHealthWorkers: rec.healthWorkerCount,
          regionalNutritionScore: scoreRating,
          criticalAlert: regionalAlert,
          riskLevel: riskCategory,
          processedAt: new Date().toISOString()
        };
      });

      // BUG 4 Fix: Wrap fallbacks in node environment check
      if (reportCards.length === 0 && process.env.NODE_ENV !== "production") {
        reportCards.push(
          {
            region: "Nalgonda_North",
            registeredUsers: 240,
            activeHealthWorkers: 4,
            regionalNutritionScore: 58,
            criticalAlert: "Anemia risk alerts identified. Distribute drumstick/beetroot supplements.",
            riskLevel: "High",
            processedAt: new Date().toISOString()
          },
          {
            region: "Gadwal_West",
            registeredUsers: 410,
            activeHealthWorkers: 6,
            regionalNutritionScore: 76,
            criticalAlert: "Mild calcium-deficiency warnings. Encourage ragi inclusion.",
            riskLevel: "Medium",
            processedAt: new Date().toISOString()
          },
          {
            region: "Wanaparthy_East",
            registeredUsers: 190,
            activeHealthWorkers: 3,
            regionalNutritionScore: 88,
            criticalAlert: "Zero active nutritional alerts. General wellness remains strong.",
            riskLevel: "Low",
            processedAt: new Date().toISOString()
          }
        );
      }

      return res.json({
        success: true,
        data: reportCards
      });
    } catch (err: any) {
      console.error("Error creating portal regional report:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error creating NGO diagnostics reports" });
    }
  }
);

/**
 * 2. POST /api/portal/programs - Create nutrition program
 */
router.post(
  "/portal/programs",
  authMiddleware,
  requireRole(["ngo_admin", "admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawBody = req.body;
      const validation = createProgramSchema.safeParse(rawBody);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
        });
      }

      const { name, description, targetRegion, goals } = validation.data;
      const createdBy = req.user!.uid;

      const programRef = adminDb.collection("programs").doc();
      const programData = {
        name,
        description,
        targetRegion,
        goals,
        createdBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await programRef.set(programData);

      return res.status(201).json({
        success: true,
        data: {
          id: programRef.id,
          ...programData,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error("Error creating nutrition program:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error creating active program campaign" });
    }
  }
);

/**
 * 3. GET /api/portal/programs - List programs (filter by region)
 */
router.get(
  "/portal/programs",
  authMiddleware,
  requireRole(["ngo_admin", "admin", "health_worker", "user", "parent"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filterRegion = req.query.region as string;
      
      let queryRef: FirebaseFirestore.Query = adminDb.collection("programs");
      if (filterRegion) {
        queryRef = queryRef.where("targetRegion", "==", filterRegion);
      }

      const snapshot = await queryRef.get();
      const programs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        };
      });

      // BUG 4 Fix: Wrap fallbacks in node environment check
      if (programs.length === 0 && process.env.NODE_ENV !== "production") {
        const fallbackPrograms = [
          {
            id: "program_fallback_1",
            name: "Millet Mission: Poshan Abhiyaan",
            description: "An intensive dietary education and ragi distribution campaign targeting pregnant mothers and early child development.",
            targetRegion: "Nalgonda_North",
            goals: ["Distribute 10kg ragi packs to 100 families", "Conduct weekly iron absorption workshops", "Track BMI improvements over 90 days"],
            createdBy: "system_anchor_ngo_1",
            createdAt: new Date().toISOString()
          },
          {
            id: "program_fallback_2",
            name: "Asha Iron Support Initiative",
            description: "Community health worker training to execute local anemia screening drives and educate school kids on drumstick tree inclusion.",
            targetRegion: "Gadwal_West",
            goals: ["Screen 350 community youngsters", "Deliver drumstick seeds for home gardening", "Conduct protein supplement distributions"],
            createdBy: "system_anchor_ngo_1",
            createdAt: new Date().toISOString()
          }
        ];

        if (filterRegion) {
          return res.json({
            success: true,
            data: fallbackPrograms.filter(p => p.targetRegion === filterRegion)
          });
        }
        return res.json({ success: true, data: fallbackPrograms });
      }

      return res.json({
        success: true,
        data: programs
      });
    } catch (err: any) {
      console.error("Error listing programs:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error fetching program campaigns list" });
    }
  }
);

export default router;
