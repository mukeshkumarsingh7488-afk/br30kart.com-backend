const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// --- User Routes ---
router.post("/add", reviewController.postReview);
router.get("/top10", reviewController.getTopReviews);

// --- Admin Routes ---

// All Reviews
router.get("/all", reviewController.getAllReviews);

// Update Review / Reply
router.put("/update/:id", reviewController.updateReview);

// Hide / Show Review
router.patch("/status/:id", reviewController.toggleReviewStatus);

// Delete Single Review
router.delete("/delete/:id", reviewController.deleteReview);

// Auto Reply
router.post("/auto-reply", reviewController.handleAutoReply);

// Total Review Count
router.get("/total-count", reviewController.getTotalReviewCount);

// ===============================
// BULK REVIEW ACTION ROUTES
// ===============================

// Bulk Hide
router.put("/bulk-hide", reviewController.bulkHideReviews);

// Bulk Show
router.put("/bulk-show", reviewController.bulkShowReviews);

// Bulk Delete
router.delete("/bulk-delete", reviewController.bulkDeleteReviews);

// Bulk Reply
router.put("/bulk-reply", reviewController.bulkReplyReviews);

module.exports = router;
