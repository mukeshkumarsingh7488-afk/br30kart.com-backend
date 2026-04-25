//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// ⭐ REVIEW MODEL: Stores BR30KART ratings, user feedback, and course testimonials.
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  username: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  status: {
    type: String,
    enum: ["approved", "hidden", "pending"],
    default: "approved",
  },
  adminReply: {
    type: String,
    default: "",
  },

  replied: {
    type: Boolean,
    default: false,
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
