import { Router, Response } from "express";
import { z } from "zod";
import { adminDb } from "../firebase-admin";
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
 * 1. GET /api/community/posts - Paginated feed (limit, cursor)
 */
router.get("/community/posts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limitVal = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string; // Expecting ISO timestamp raw string

    let postsQuery = adminDb.collection("posts")
      .orderBy("createdAt", "desc")
      .limit(limitVal);

    if (cursor) {
      postsQuery = postsQuery.startAfter(cursor);
    }

    const snapshot = await postsQuery.get();
    
    // Fetch comments count for each post concurrently
    const postsPromises = snapshot.docs.map(async (doc) => {
      const postData = doc.data();
      
      // Get comments count from subcollection
      const commentsSnapshot = await doc.ref.collection("comments").get();
      
      return {
        id: doc.id,
        text: postData.text,
        images: postData.images || [],
        tags: postData.tags || [],
        authorId: postData.authorId,
        authorName: postData.authorName || "Community Member",
        authorRole: postData.authorRole || "Member",
        likes: postData.likes || [],
        likesCount: (postData.likes || []).length,
        commentsCount: commentsSnapshot.size,
        createdAt: postData.createdAt,
      };
    });

    const posts = await Promise.all(postsPromises);

    // Fallback static starter feeds so the app is immediately alive and gorgeous
    if (posts.length === 0 && !cursor) {
      const fallbackPosts = [
        {
          id: "post_initial_1",
          text: "Harvested fresh Moranga (Drumstick) leaves today for dinner. Super rich in iron and vitamin A! Adding this to our traditional dal recipe. 🌿🍲",
          images: [],
          tags: ["IronWellness", "TraditionalGreens", "HealthyEating"],
          authorId: "system_anchor_worker_1",
          authorName: "Asha Devi",
          authorRole: "Health Worker",
          likes: ["user_curator_2"],
          likesCount: 1,
          commentsCount: 2,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "post_initial_2",
          text: "Millet Porridge (Ragi Sankati) is a fantastic breakfast upgrade for growing kids! Packed with calcium, fiber, and extremely low cost. Try this with curd or buttermilk.",
          images: [],
          tags: ["Millets", "ChildNutrition", "Superfoods"],
          authorId: "system_anchor_ngo_1",
          authorName: "Aarohan Foundations",
          authorRole: "NGO/Academy Partner",
          likes: [],
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      return res.json({ success: true, data: fallbackPosts });
    }

    return res.json({
      success: true,
      data: posts,
      nextCursor: posts.length === limitVal ? posts[posts.length - 1].createdAt : null,
    });
  } catch (err: any) {
    console.error("Error fetching community posts:", err);
    return res.status(500).json({ success: false, error: "Internal server error fetching community feed" });
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
      id: postRef.id,
      text,
      images,
      tags,
      authorId,
      authorName,
      authorRole,
      likes: [], // Store standard likedBy UIDs array
      createdAt: new Date().toISOString(),
    };

    await postRef.set(postData);

    return res.status(201).json({
      success: true,
      data: {
        ...postData,
        likesCount: 0,
        commentsCount: 0
      }
    });
  } catch (err: any) {
    console.error("Error creating community post:", err);
    return res.status(500).json({ success: false, error: "Internal server error creating post" });
  }
});

/**
 * 3. POST /api/community/posts/:id/like - Toggle like on post
 */
router.post("/community/posts/:id/like", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.uid;

    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const postData = postDoc.data()!;
    const likesList: string[] = postData.likes || [];
    
    let updatedLikes: string[];
    let isLiked: boolean;

    if (likesList.includes(userId)) {
      // Remove like
      updatedLikes = likesList.filter(id => id !== userId);
      isLiked = false;
    } else {
      // Add like
      updatedLikes = [...likesList, userId];
      isLiked = true;
    }

    await postRef.update({ likes: updatedLikes });

    return res.json({
      success: true,
      data: {
        postId,
        isLiked,
        likesCount: updatedLikes.length
      }
    });
  } catch (err: any) {
    console.error("Error toggling post like:", err);
    return res.status(500).json({ success: false, error: "Internal server error toggling liking activity" });
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
      id: commentRef.id,
      postId,
      userId,
      authorName,
      authorRole,
      text,
      createdAt: new Date().toISOString(),
    };

    await commentRef.set(commentData);

    return res.status(201).json({
      success: true,
      data: commentData
    });
  } catch (err: any) {
    console.error("Error posting comment on post:", err);
    return res.status(500).json({ success: false, error: "Internal server error posting comment" });
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
    const comments = snapshot.docs.map(doc => doc.data());

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
