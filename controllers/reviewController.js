//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose");
//  📩 EMAIL TEMPLATE EXPORT | LOGIC: MANAGING SYSTEM-WIDE EMAIL LAYOUTS
const { generateSmartReply } = require("../utils/reviewReply");

// 1. 📝 POST REVIEW | LOGIC: SUBMITTING USER FEEDBACK & RATINGS (UI DISPLAY)
exports.postReview = async (req, res) => {
  try {
    const { rating, comment, userId } = req.body;

    const existingReview = await Review.findOne({ userId: userId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already submitted a review!" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User nahi mila!" });

    const newReview = new Review({
      userId,
      username: user.name,
      rating,
      comment,
    });

    await newReview.save();

    const updatedCount = await Review.countDocuments();

    if (req.app.get("socketio")) {
      req.app.get("socketio").emit("updateReviewCount", updatedCount);
    }

    res.status(201).json({
      message: "Review Saved Successfully! ✅",
      totalCount: updatedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. 👤 FETCH MY REVIEWS | LOGIC: RETRIEVING ALL FEEDBACK SUBMITTED BY THE USER
exports.getTopReviews = async (req, res) => {
  try {
    const totalReviewCount = await Review.countDocuments();

    const reviews = await Review.aggregate([
      {
        $match: {
          $or: [{ status: "approved" }, { status: { $exists: false } }],
        },
      },
      {
        $addFields: {
          userId: { $toObjectId: "$userId" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      totalCount: totalReviewCount || 0,
      reviews: reviews || [],
    });
  } catch (err) {
    console.error("Aggregation Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. 🛡️ ADMIN REVIEW MANAGEMENT | LOGIC: MODERATING & CURATING USER FEEDBACK
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name profilePic")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. 💬 REVIEW INTERACTION | LOGIC: ADMIN REPLIES & REVIEW STATUS UPDATES
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { status, adminReply },
      { new: true },
    );

    if (!updatedReview)
      return res.status(404).json({ message: "Review nahi mila!" });
    res
      .status(200)
      .json({ message: "Review Update Ho Gaya! ✅", updatedReview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. 🗑️ DELETE REVIEW | LOGIC: PERMANENT REMOVAL OF FEEDBACK FROM SYSTEM
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview)
      return res
        .status(404)
        .json({ message: "Review pehle hi delete ho chuka hai!" });
    res.status(200).json({ message: "Review Parmanent Delete Kar Diya! 🗑️" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. 🌓 TOGGLE REVIEW VISIBILITY | LOGIC: HIDING OR SHOWING REVIEWS ON THE FRONTEND
exports.toggleReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review nahi mila!" });

    const newStatus = review.status === "approved" ? "hidden" : "approved";

    review.status = newStatus;
    await review.save();

    res.status(200).json({
      message: `Review ab ${newStatus} ho gaya hai! ✅`,
      status: newStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. 🗄️ DATABASE SYNC | LOGIC: EXECUTING REAL-TIME DATA PERSISTENCE & UPDATES
async function saveReply(reviewId, message) {
  try {
    await Review.findOneAndUpdate(
      { _id: reviewId, adminReply: { $in: ["", null] } },
      {
        adminReply: message,
        replied: true,
      },
    );

    console.log("✅ Reply saved:", reviewId);
  } catch (err) {
    console.error("❌ Error saving reply:", err);
  }
}

// 8. ⚡ AUTO-EXECUTE MODULE | LOGIC: STANDALONE API HANDLER & REUSABLE UTILITY
exports.handleAutoReply = async (req, res) => {
  try {
    const reviews = req.body.reviews;

    for (let review of reviews) {
      if (review.replied) continue;

      const reply = generateSmartReply(review);

      if (!reply) {
        console.log("⚠️ Manual needed:", review._id);
        continue;
      }

      const finalReply = reply + "\n— Team BR30 Trader Academy 🚀";

      await saveReply(review._id, finalReply);
    }

    res.json({ success: true, message: "Auto replies processed 🚀" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
