import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "te", "hi", "ta", "kn"] as const;
export const USER_ROLES = ["user", "parent", "health_worker", "ngo_admin", "admin"] as const;
export const AGE_GROUPS = ["child", "teen", "adult", "elderly", "pregnant"] as const;
export const HABIT_TYPES = ["water", "meal", "exercise", "junk"] as const;
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const DEVICE_TYPES = ["Watch", "Scale", "BP Monitor", "Glucose Meter"] as const;

export const createUserSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(USER_ROLES).default("user"),
  ageGroup: z.enum(AGE_GROUPS).default("adult"),
  region: z.string().min(1).max(100).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  region: z.string().min(1).max(100).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  ageGroup: z.enum(AGE_GROUPS).optional(),
  familyId: z.string().max(100).optional(),
  onboarded: z.boolean().optional(),
  nutriScore: z.number().min(0).max(100).optional(),
});

export const nutrientSchema = z.object({
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
});

export const logMealSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  foods: z.array(z.string().min(1)).min(1),
  calories: z.number().min(0),
  nutrients: nutrientSchema.optional(),
  mealType: z.enum(MEAL_TYPES).default("breakfast"),
});

export const createPostSchema = z.object({
  text: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(5).default([]),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

export const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
});

export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "ai", "model", "assistant"]),
      content: z.string().min(1).max(5000),
    })
  ).min(1),
});

export const mealPlanRequestSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  budget: z.number().min(1).max(100000).default(200),
  healthGoal: z.string().min(2).max(200),
  appMode: z.enum(AGE_GROUPS).default("adult"),
});

export const analyzeImageSchema = z.object({
  base64Image: z.string().min(100),
});

export const createProgramSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  targetRegion: z.string().min(1).max(100),
  goals: z.array(z.string().min(2).max(150)).min(1).max(20),
});
