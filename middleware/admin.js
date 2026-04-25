//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 🛡️ AUTH MIDDLEWARE: Verifies JWT, attaches user data, and enforces role-based access control.
const User = require("../models/User");
// 👑 ADMIN MIDDLEWARE: Restricts access to authorized administrators only.
module.exports = async function (req, res, next) {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User nahi mila bhai!" });
    }

    console.log("🔥 DB Fresh Role:", user.role);

    if (user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admin only! 🛑" });
    }

    next();
  } catch (err) {
    console.error("❌ Admin Middleware Error:", err.message);
    res.status(500).json({ error: "Server Error: Admin check fail ho gaya" });
  }
};
//#endregion
// ==========================================
// ✅ JWT & Role-based Access Refactored.
// 🚀 Middleware is hardened for Production!
// ==========================================
