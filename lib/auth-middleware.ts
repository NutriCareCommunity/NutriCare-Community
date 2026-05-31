import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "./firebase-admin";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: string;
    name?: string;
  };
}

/**
 * Express middleware to verify Firebase ID tokens on protected routes.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid authorization token" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    let role = decodedToken.role as string;
    
    // If role is not in the custom claims, look it up in Firestore profile
    if (!role) {
      try {
        const userRef = adminDb.collection("users").doc(decodedToken.uid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          role = userDoc.data()?.role || "Community Member";
        } else {
          role = "Community Member";
        }
      } catch (dbErr) {
        console.error("Failed to fetch user role from db, defaulting to Community Member:", dbErr);
        role = "Community Member";
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: role,
      name: decodedToken.name || "",
    };

    next();
  } catch (error: any) {
    console.error("Token verification failed:", error.message || error);
    return res.status(401).json({ success: false, error: "Invalid or expired authorization token" });
  }
}

/**
 * Express route guard for role-based authorization.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthenticated" });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ 
        success: false, 
        error: `Access Denied: Required one of roles [${allowedRoles.join(", ")}], but got [${req.user.role}]` 
      });
    }

    next();
  };
}
