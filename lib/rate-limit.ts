import { adminDb } from "./firebase-admin";

/**
 * Firestore-backed rate limiter.
 * This completely solves multi-instance serverless rate limit synchronization (BUG 3).
 * Runs inside a transaction to prevent race conditions.
 * 
 * @param userId - The authenticated user's ID
 * @param limit - Maximum requests allowed in the window (default: 15)
 * @param windowMs - Time window in milliseconds (default: 60,000 / 1 minute)
 * @returns Object indicating success or warning status
 */
export async function checkRateLimit(
  userId: string,
  limit: number = 15,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const ref = adminDb.collection("rate_limits").doc(userId);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const now = Date.now();

      if (!doc.exists) {
        const resetTime = now + windowMs;
        tx.set(ref, { count: 1, resetTime });
        return { allowed: true, remaining: limit - 1 };
      }

      const data = doc.data()!;
      const resetTime = data.resetTime;

      // If the window has expired, reset count
      if (now > resetTime) {
        const nextResetTime = now + windowMs;
        tx.set(ref, { count: 1, resetTime: nextResetTime });
        return { allowed: true, remaining: limit - 1 };
      }

      // If limits are exceeded
      if (data.count >= limit) {
        return { allowed: false, remaining: 0 };
      }

      // Increment count within existing window
      const count = data.count + 1;
      tx.update(ref, { count });
      return { allowed: true, remaining: limit - count };
    });

    return result;
  } catch (err) {
    console.error("Rate limiter transaction exception or abort:", err);
    // Graceful fallback to allow request when DB has errors, avoiding locking out users
    return { allowed: true, remaining: 1 };
  }
}
