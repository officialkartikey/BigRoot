const Post = require("../models/Post");
const Notification = require("../models/Notification");

exports.createPost = async (req, res) => {
  try {
    const { text, links, tags } = req.body;

    // 🔥 DO THIS
    delete req.body.media;

    // links
    let parsedLinks = Array.isArray(links) ? links : links ? [links] : [];

    // tags
    let parsedTags = Array.isArray(tags) ? tags : tags ? [tags] : [];

    // files → media
    const media = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        let type = "image";

        if (file.mimetype.startsWith("video")) type = "video";
        if (file.mimetype === "application/pdf") type = "pdf";

        media.push({
          url: file.path,
          type,
        });
      });
    }

   console.log("FINAL MEDIA TYPE:", typeof media);
   console.log("FINAL MEDIA VALUE:", media);
   console.log("MODEL MEDIA TYPE:", Post.schema.path("media").instance);
const safeMedia = Array.isArray(media)
  ? media
  : JSON.parse(media);
    const post = await Post.create({
      author: req.user._id,
      text,
      links: parsedLinks,
      tags: parsedTags,
       media: safeMedia // ✅ only this
    });
    

    res.status(201).json({
      msg: "Post created successfully",
      post,
    });

  } catch (error) {
    // console.log("ERROR:", error); 
    
    // keep this
    res.status(500).json({ msg: error.message });
  }
};



exports.getFeed = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ✅ total count
    const total = await Post.countDocuments();

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name profilePhoto role")
      .populate("tags", "name profilePhoto")
      .populate("comments.user", "name profilePhoto");

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      text: post.text,
      links: post.links,
      media: post.media,
      author: post.author,
      tags: post.tags,

      likesCount: post.likes.length,

      // ✅ isLiked
      isLiked: post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),

      commentsCount: post.comments.length,

      // ✅ limited comments
      comments: post.comments.slice(0, 2),

      createdAt: post.createdAt,
    }));

    res.json({
      page,
      total, // ✅ include this
      count: formattedPosts.length,
      posts: formattedPosts,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      // ❌ Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // ❤️ Like
      post.likes.push(userId);

      // 🔔 Notification
      if (post.author.toString() !== userId.toString()) {
        await Notification.create({
          user: post.author,
          message: `${req.user.name} liked your post`,
        });
      }
    }

    await post.save();

    res.json({
      msg: alreadyLiked ? "Post unliked" : "Post liked",
      likesCount: post.likes.length,

      // ✅ correct isLiked
      isLiked: post.likes.some(
        (id) => id.toString() === userId.toString()
      ),
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.addComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text } = req.body;
    const postId = req.params.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ msg: "Comment cannot be empty" });
    }

    const post = await Post.findById(postId).populate(
      "comments.user",
      "name profilePhoto"
    );

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const newComment = {
      user: userId,
      text,
    };

    post.comments.unshift(newComment); // latest first
    await post.save();

    // 🔔 Notify post owner
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        user: post.author,
        message: `${req.user.name} commented on your post`,
      });
    }

    res.status(201).json({
      msg: "Comment added",
      comment: {
        // _id: post.comments._id,
        user: {
          _id: req.user._id,
          name: req.user.name,
          profilePhoto: req.user.profilePhoto,
        },
        
        text,
        createdAt: new Date(),
      },
      commentsCount: post.comments.length,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    let { page = 1, limit = 5 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const post = await Post.findById(postId).populate(
      "comments.user",
      "name profilePhoto"
    );

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    const comments = post.comments.slice(start, end);

    res.json({
      totalComments: post.comments.length,
      page,
      comments,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // find comment
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // 🔒 Authorization check
    const isCommentOwner =
      comment.user.toString() === userId.toString();

    const isPostOwner =
      post.author.toString() === userId.toString();

    const isAdmin = req.user.role === "admin";

    if (!isCommentOwner && !isPostOwner && !isAdmin) {
      return res.status(403).json({
        msg: "Not authorized to delete this comment",
      });
    }

    // ❌ remove comment
    comment.deleteOne();

    await post.save();

    res.json({
      msg: "Comment deleted successfully",
      commentsCount: post.comments.length,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 Run count + fetch in parallel (better performance)
    const [total, posts] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Post.find({ author: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name profilePhoto role")
        .populate("tags", "name profilePhoto"),
    ]);

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      text: post.text,
      media: post.media,
      links: post.links,
      author: post.author,
      tags: post.tags,

      likesCount: post.likes.length,
      commentsCount: post.comments.length,

      isLiked: post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),

      createdAt: post.createdAt,
    }));

    res.json({
      page,
      total, // ✅ total posts
      totalPages: Math.ceil(total / limit), // ✅ for frontend pagination
      count: formattedPosts.length, // current page count
      posts: formattedPosts,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};



exports.editPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const { text, links } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // 🔒 Authorization
    const isOwner = post.author.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        msg: "Not authorized to edit this post",
      });
    }

    // ✏️ Update fields
    if (text) post.text = text;

    if (links) {
      post.links = Array.isArray(links) ? links : [links];
    }

    // 📸 Add new media if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        let type = "image";

        if (file.mimetype.startsWith("video")) type = "video";
        if (file.mimetype === "application/pdf") type = "pdf";

        post.media.push({
          url: file.path,
          type,
        });
      });
    }

    await post.save();

    res.json({
      msg: "Post updated successfully",
      post,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // 🔒 Authorization
    const isOwner = post.author.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        msg: "Not authorized to delete this post",
      });
    }

    await post.deleteOne();

    res.json({
      msg: "Post deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};