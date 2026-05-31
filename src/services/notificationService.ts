import { db, handleFirestoreError, OperationType } from "../lib/firebase";
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
    const path = `users/${userId}/ai_insights`;
    const q = query(
      collection(db, path),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    return onSnapshot(q, (snapshot) => {
      const nudges = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as HealthNudge[];
      callback(nudges);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }

  static async markAsRead(userId: string, nudgeId: string) {
    const path = `users/${userId}/ai_insights/${nudgeId}`;
    try {
      const nudgeRef = doc(db, `users/${userId}/ai_insights`, nudgeId);
      await updateDoc(nudgeRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}
