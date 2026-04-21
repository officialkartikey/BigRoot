const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      maxlength: 2000,
    },

    links: [String],

  media: [
  {
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video", "pdf"],
      required: true
    }
  }
],
likes: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
],

comments: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
],

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);