//#region Review Routes br30 kart

const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// --- User Routes (Pehle se jo hain) ---
router.post("/add", reviewController.postReview);
router.get("/top10", reviewController.getTopReviews);

// --- Admin Routes (Jo humein ab chahiye) ---

// 1. Saare reviews dekhne ke liye (Admin Panel mein)
router.get("/all", reviewController.getAllReviews);

// 2. Review ko update karne ke liye (Reply dene ya Status change karne ke liye)
router.put("/update/:id", reviewController.updateReview);

// 3. Review ko hide/show karne ke liye (Aap isse status badal sakte ho)
router.patch("/status/:id", reviewController.toggleReviewStatus);

// 4. Review ko permanent delete karne ke liye
router.delete("/delete/:id", reviewController.deleteReview);

// auto replay review
router.post("/auto-reply", reviewController.handleAutoReply);

// review total count inline top reviews
exports.getTotalReviewCount = async (req, res) => {
  try {
    const totalCount = await Review.countDocuments();
    res.status(200).json({ success: true, count: totalCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
module.exports = router;
//#endregion
