import { Router, Response } from "express";
import { z } from "zod";
import { adminDb, admin } from "../firebase-admin";
import { authMiddleware, AuthenticatedRequest } from "../auth-middleware";

const router = Router();

// Zod Validation Schemas
const createPostSchema = z.object({
  text: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(5).default([]),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
});

/**
 * 1. GET /api/community/posts - Paginated feed (with standard DocumentSnapshot cursor: BUG 9)
 */
router.get("/community/posts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limitVal = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string; // Expecting Document ID as cursor (BUG 9)
    const userId = req.user!.uid;

    let postsQuery = adminDb.collection("posts")
      .orderBy("createdAt", "desc")
      .limit(limitVal);

    if (cursor) {
      const cursorDoc = await adminDb.collection("posts").doc(cursor).get();
      if (cursorDoc.exists) {
        postsQuery = postsQuery.startAfter(cursorDoc);
      }
    }

    const snapshot = await postsQuery.get();
    
    // Process matching post fields, concurrent checks for liked status and comments
    const postsPromises = snapshot.docs.map(async (doc) => {
      const postData = doc.data();
      
      // Get comment count
      const commentsSnapshot = await doc.ref.collection("comments").get();
      
      // Get whether current user liked the post from the likes subcollection (BUG 8 pattern)
      const userLikeRef = doc.ref.collection("likes").doc(userId);
      const userLikeDoc = await userLikeRef.get();
      
      return {
        id: doc.id,
        text: postData.text,
        images: postData.images || [],
        tags: postData.tags || [],
        authorId: postData.authorId,
        authorName: postData.authorName || "Community Member",
        authorRole: postData.authorRole || "user",
        likesCount: postData.likesCount || 0,
        isLiked: userLikeDoc.exists,
        commentsCount: commentsSnapshot.size,
        createdAt: postData.createdAt instanceof admin.firestore.Timestamp ? postData.createdAt.toDate().toISOString() : postData.createdAt,
      };
    });

    const posts = await Promise.all(postsPromises);

    // BUG 4 Fix: Fallback only in development when table is totally empty
    if (posts.length === 0 && !cursor && process.env.NODE_ENV !== "production") {
      const fallbackPosts = [
        {
          id: "post_initial_1",
          text: "Harvested fresh Drumstick (Moringa) leaves today. Super rich in iron and vitamin A! Adding this to dal. 🌿🍲",
          images: [],
          tags: ["IronWellness", "TraditionalGreens", "HealthyEating"],
          authorId: "system_anchor_worker_1",
          authorName: "Asha Devi",
          authorRole: "health_worker",
          likesCount: 1,
          isLiked: true,
          commentsCount: 2,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "post_initial_2",
          text: "Ragi Sankati is a fantastic breakfast upgrade for kids. Fun, easy to digest and extremely affordable. Try with curd!",
          images: [],
          tags: ["Millets", "ChildNutrition", "Superfoods"],
          authorId: "system_anchor_ngo_1",
          authorName: "Aarohan Foundations",
          authorRole: "ngo_admin",
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      return res.json({ success: true, data: fallbackPosts });
    }

    return res.json({
      success: true,
      data: posts,
      nextCursor: posts.length === limitVal ? posts[posts.length - 1].id : null, // Document ID cursor (BUG 9)
    });
  } catch (err: any) {
    console.error("Error fetching community posts:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error fetching community feed" });
  }
});

/**
 * 2. POST /api/community/posts - Create a post
 */
router.post("/community/posts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    const validation = createPostSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { text, images, tags } = validation.data;
    const authorId = req.user!.uid;
    const authorRole = req.user!.role;
    const authorName = req.user!.name || req.user!.email?.split("@")[0] || "Community Member";

    const postRef = adminDb.collection("posts").doc();
    const postData = {
      text,
      images,
      tags,
      authorId,
      authorName,
      authorRole,
      likesCount: 0, // Standalone integer field updated atomically (BUG 8)
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await postRef.set(postData);

    return res.status(201).json({
      success: true,
      data: {
        id: postRef.id,
        ...postData,
        createdAt: new Date().toISOString(),
        commentsCount: 0,
        isLiked: false
      }
    });
  } catch (err: any) {
    console.error("Error creating community post:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error creating post" });
  }
});

/**
 * 3. POST /api/community/posts/:id/like - Toggle like on post using transaction for infinite scale (BUG 8)
 */
router.post("/community/posts/:id/like", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.uid;

    const postRef = adminDb.collection("posts").doc(postId);
    const likeRef = postRef.collection("likes").doc(userId); // Subdocument per like (BUG 8 pattern)

    const result = await adminDb.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error("Post not found");
      }

      const likeDoc = await transaction.get(likeRef);
      const isLiked = likeDoc.exists;
      const currentLikesCount = postDoc.data()?.likesCount || 0;

      if (isLiked) {
        // Remove like doc and decrement count atomically
        transaction.delete(likeRef);
        const nextCount = Math.max(0, currentLikesCount - 1);
        transaction.update(postRef, { likesCount: nextCount });
        return { isLiked: false, likesCount: nextCount };
      } else {
        // Add like doc and increment count atomically
        transaction.set(likeRef, { likedAt: admin.firestore.FieldValue.serverTimestamp() });
        const nextCount = currentLikesCount + 1;
        transaction.update(postRef, { likesCount: nextCount });
        return { isLiked: true, likesCount: nextCount };
      }
    });

    return res.json({
      success: true,
      data: {
        postId,
        isLiked: result.isLiked,
        likesCount: result.likesCount
      }
    });
  } catch (err: any) {
    console.error("Error toggling post like:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error toggling liking activity" });
  }
});

/**
 * 4. POST /api/community/posts/:id/comments - Add a comment
 */
router.post("/community/posts/:id/comments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.uid;
    const authorName = req.user!.name || req.user!.email?.split("@")[0] || "Community Member";
    const authorRole = req.user!.role;

    const rawBody = req.body;
    const validation = createCommentSchema.safeParse(rawBody);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")
      });
    }

    const { text } = validation.data;

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Add comment to comments subcollection
    const commentRef = postRef.collection("comments").doc();
    const commentData = {
      userId,
      authorName,
      authorRole,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await commentRef.set(commentData);

    return res.status(201).json({
      success: true,
      data: {
        id: commentRef.id,
        postId,
        ...commentData,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Error posting comment on post:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error posting comment" });
  }
});

/**
 * 5. GET /api/community/posts/:id/comments - Fetch comments for a specific post
 */
router.get("/community/posts/:id/comments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
       return res.status(404).json({ success: false, error: "Post not found" });
    }

    const snapshot = await postRef.collection("comments").orderBy("createdAt", "asc").get();
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof admin.firestore.Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });

    return res.json({
      success: true,
      data: comments
    });
  } catch (err: any) {
    console.error("Error fetching comments:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching comment thread" });
  }
});

export default router;
