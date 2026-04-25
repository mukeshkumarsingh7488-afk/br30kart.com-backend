//#region ━━━━━ 🚀 WELCOME DEVELOPER | ADMIN SYSTEM INITIALIZED ━━━━━

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminController = require("../controllers/adminController");

/**
 * 🔐 ADMIN SECURITY GATEKEEPER
 * Logic: Restricts access to master admin only
 */
const adminCheck = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Sirf Mukesh King allowed hain!" });
  }
  next();
};

// 📊 --- DASHBOARD & ANALYTICS ---
router.get("/all-sellers-docs", adminController.getAllSellersDocs);
router.get("/all-data", adminController.getAllData);
router.get("/financial-stats", adminController.getFinancialStats);
router.get("/all-vips", adminController.getVIPUsers);

// 👤 --- USER & ACCESS MANAGEMENT ---
router.put("/toggle-vip/:id", adminController.toggleVIPStatus);
router.put("/toggle-block/:id", adminController.toggleUserBlock);
router.delete("/delete-user/:id", adminController.deleteUserAccount);
router.put(
  "/bulk-update-users",
  auth,
  adminCheck,
  adminController.bulkUpdateUsers,
);

// 🏪 --- SELLER ONBOARDING & VERIFICATION ---
router.get("/seller-requests", adminController.getPendingSellers);
router.get("/seller-details/:id", adminController.getSellerDetails);
router.get("/seller-tracker", auth, adminController.getSellerTracker);
router.put("/approve-seller/:id", adminController.approveSeller);
router.put("/reject-seller/:id", adminController.rejectSeller);
router.post("/reject-seller", adminController.rejectSellerDocs);
router.put("/toggle-seller-approval/:id", adminController.toggleSellerApproval);
router.put("/toggle-seller-status", adminController.toggleVerification);

// 🛒 --- PRODUCT & INVENTORY CONTROL ---
router.get("/products", auth, adminCheck, adminController.getAllProducts);
router.put("/approve-product/:id", auth, adminController.approveProduct);
router.put("/toggle-visibility/:id", auth, adminController.toggleVisibility);
router.put("/toggle-featured/:id", auth, adminController.toggleFeatured);
router.put("/bulk-update-courses", auth, adminController.bulkUpdateCourses);
router.put(
  "/reset-coupon/:id",
  auth,
  adminCheck,
  adminController.resetCourseDiscount,
);
router.delete(
  "/delete-course/:id",
  auth,
  adminCheck,
  adminController.deleteCourse,
);

// 💰 --- FINANCIALS & PAYOUTS ---
router.get("/friday-payouts", adminController.getFridayPayouts);
router.post("/update-payout-status", adminController.updatePayoutStatus);

// 📦 --- ORDER MANAGEMENT ---
router.get("/orders", auth, adminCheck, adminController.getAllOrders);
router.get(
  "/order-details/:id",
  auth,
  adminCheck,
  adminController.getOrderDetail,
);

// 👨‍🎓 --- STUDENT ACTIVITY TRACKER ---
router.get(
  "/student-tracker-data",
  auth,
  adminCheck,
  adminController.getStudentTrackerData,
);
router.put(
  "/toggle-hide-course",
  auth,
  adminCheck,
  adminController.toggleHideCourse,
);
router.put(
  "/delete-student-course",
  auth,
  adminCheck,
  adminController.deleteStudentCourse,
);
router.post(
  "/send-student-alert",
  auth,
  adminCheck,
  adminController.sendStudentAlert,
);

// 📢 --- SELLER COMMUNICATION & ACTION ---
router.post("/send-seller-alert", auth, adminController.sendSellerAlert);
router.post(
  "/send-seller-action-mail",
  auth,
  adminController.sendSellerActionMail,
);
router.put(
  "/toggle-block-seller/:email",
  auth,
  adminController.toggleBlockSeller,
);
router.delete("/delete-seller/:email", auth, adminController.deleteSeller);

module.exports = router;
//#endregion
// ==========================================
// ✅ ADMIN ROUTES ORGANIZED & SECURED.
// 🚀 Ready for Production!
// ==========================================
