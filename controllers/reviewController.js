const Review = require("../models/Review");
const User = require("../models/User");
const mongoose = require("mongoose");
const { generateSmartReply } = require("../utils/reviewReply");

exports.postReview = async (req, res) => {
  try {
    const { rating, comment, userId } = req.body;

    const existingReview = await Review.findOne({ userId: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review!" });
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

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("userId", "name profilePic").sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(id, { status, adminReply }, { new: true });

    if (!updatedReview) return res.status(404).json({ message: "Review nahi mila!" });
    res.status(200).json({ message: "Review Update Ho Gaya! ✅", updatedReview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) return res.status(404).json({ message: "Review pehle hi delete ho chuka hai!" });
    res.status(200).json({ message: "Review Parmanent Delete Kar Diya! 🗑️" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

const cleanReviewIds = (reviewIds = []) => {
  if (!Array.isArray(reviewIds)) return [];
  return [...new Set(reviewIds)]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

exports.bulkHideReviews = async (req, res) => {
  try {
    const ids = cleanReviewIds(req.body.reviewIds);

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        msg: "Valid review IDs required",
      });
    }

    const result = await Review.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isHidden: true,
          hidden: true,
          updatedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      msg: `${result.modifiedCount || 0} reviews hidden successfully`,
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error("Bulk Hide Reviews Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Bulk hide failed",
      error: err.message,
    });
  }
};

exports.bulkShowReviews = async (req, res) => {
  try {
    const ids = cleanReviewIds(req.body.reviewIds);

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        msg: "Valid review IDs required",
      });
    }

    const result = await Review.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isHidden: false,
          hidden: false,
          updatedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      msg: `${result.modifiedCount || 0} reviews shown successfully`,
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error("Bulk Show Reviews Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Bulk show failed",
      error: err.message,
    });
  }
};

exports.bulkDeleteReviews = async (req, res) => {
  try {
    const ids = cleanReviewIds(req.body.reviewIds);

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        msg: "Valid review IDs required",
      });
    }

    const result = await Review.deleteMany({
      _id: { $in: ids },
    });

    return res.status(200).json({
      success: true,
      msg: `${result.deletedCount || 0} reviews deleted successfully`,
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    console.error("Bulk Delete Reviews Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Bulk delete failed",
      error: err.message,
    });
  }
};

exports.bulkReplyReviews = async (req, res) => {
  try {
    const ids = cleanReviewIds(req.body.reviewIds);
    const reply = String(req.body.reply || "").trim();

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        msg: "Valid review IDs required",
      });
    }

    if (!reply) {
      return res.status(400).json({
        success: false,
        msg: "Reply text required",
      });
    }

    if (reply.length > 1000) {
      return res.status(400).json({
        success: false,
        msg: "Reply too long. Max 1000 characters allowed",
      });
    }

    const result = await Review.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          adminReply: reply,
          reply,
          repliedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return res.status(200).json({
      success: true,
      msg: `${result.modifiedCount || 0} reviews replied successfully`,
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error("Bulk Reply Reviews Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Bulk reply failed",
      error: err.message,
    });
  }
};
