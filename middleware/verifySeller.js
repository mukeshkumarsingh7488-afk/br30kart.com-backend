//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 🔐 SELLER ACCESS CONTROL
 * Logic: Validates Seller/Admin roles and enforces Data Integrity
 * Status: Refactored & Production Ready
 */

module.exports = function verifySeller(req, res, next) {
  try {
    // 🛡️ 1. AUTHENTICATION CHECK: Ensure session exists
    if (!req.user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    // 🛡️ 2. AUTHORIZATION CHECK: Restrict to Sellers and Admins
    const allowedRoles = ["seller", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied: Sellers only" });
    }

    // 🛡️ 3. DATA INTEGRITY: Prevents Seller ID spoofing
    if (req.body.sellerId && req.user.sellerId !== req.body.sellerId) {
      return res
        .status(403)
        .json({ msg: "Security Alert: Seller ID mismatch" });
    }

    // 🛡️ 4. IDENTITY SYNC: Backup email verification
    if (req.body.sellerEmail && req.user.email !== req.body.sellerEmail) {
      return res.status(403).json({ msg: "Security Alert: Email mismatch" });
    }

    next();
  } catch (err) {
    console.error("Seller Check Error:", err.message);
    return res.status(500).json({ msg: "Server Error: Security layer failed" });
  }
};
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
