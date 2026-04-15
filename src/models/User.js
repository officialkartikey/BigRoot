const mongoose = require("mongoose");
const { COLLEGES } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // Common
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student", "faculty"],
      required: true,
    },
    collegeName: {
      type: String,
      enum: COLLEGES,
      required: true,
    },

    // STUDENT FIELDS
    branch: String,
   section: {
  type: String,
  match: /^[a-zA-Z0-9 ]+$/
    },
    year: Number,
    collegeId: { type: String, unique: true, sparse: true }, // student no
    universityRollNo: String,

    // FACULTY FIELDS
    designation: String,
    department: String,
    qualification: String,
    email: { type: String, unique: true, sparse: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);