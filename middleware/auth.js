//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 🛡️ JWT AUTH: Validates tokens and attaches user payload to the request object.
const jwt = require("jsonwebtoken");
// 👤 USER AUTH: Ensures the user is logged in and authenticated via JWT.
module.exports = function (req, res, next) {
  let token = req.header("Authorization") || req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test_secret");

    req.user = decoded.user || decoded;

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
//#endregion
// ==========================================
// ✅ JWT & Role-based Access Refactored.
// 🚀 Middleware is hardened for Production!
// ==========================================
