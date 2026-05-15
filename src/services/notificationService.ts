import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface HealthNudge {
  id: string;
  category: "nutrition" | "activity" | "medical_alert" | "tip";
  content: string;
  isRead: boolean;
  timestamp: any;
}

export class NotificationEngine {
  /**
   * Real-time listener for enterprise AI health nudges
   */
  static subscribeToNudges(userId: string, callback: (nudges: HealthNudge[]) => void) {
    const q = query(
      collection(db, `users/${userId}/ai_insights`),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snapshot) => {
      const nudges = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as HealthNudge[];
      callback(nudges);
    });
  }

  static async markAsRead(userId: string, nudgeId: string) {
    const nudgeRef = doc(db, `users/${userId}/ai_insights`, nudgeId);
    await updateDoc(nudgeRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
  }
}
