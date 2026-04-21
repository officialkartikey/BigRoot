const express = require("express");
const router = express.Router();

const { createPost } = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");
const { getFeed } = require("../controllers/postController");
const { toggleLike } = require("../controllers/postController");
const { addComment, getComments } = require("../controllers/postController");
const { deleteComment } = require("../controllers/postController");
const { getUserPosts } = require("../controllers/postController");
const { editPost, deletePost } = require("../controllers/postController");


// ✏️ Edit
router.put(
  "/:id",
  protect,
  upload.array("media", 10),
  editPost
);

// ❌ Delete
router.delete("/:id", protect, deletePost);

// 🔹 current logged-in user posts
router.get("/my-posts", protect, getUserPosts);

// 🔹 any user profile posts
router.get("/user/:userId", protect, getUserPosts);

router.delete(
  "/:postId/comment/:commentId",
  protect,
  deleteComment
);

router.post("/:id/comment", protect, addComment);
router.get("/:id/comments", protect, getComments);

router.post("/:id/like", protect, toggleLike);
router.get("/feed", protect, getFeed);
router.post(
  "/create",
  protect,
  upload.array("media", 10), // ✅ must match key name
  createPost
);

module.exports = router;