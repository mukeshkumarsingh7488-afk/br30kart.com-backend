module.exports = function verifySeller(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    const allowedRoles = ["seller", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied: Sellers only" });
    }

    if (req.body.sellerId && req.user.sellerId !== req.body.sellerId) {
      return res
        .status(403)
        .json({ msg: "Security Alert: Seller ID mismatch" });
    }

    if (req.body.sellerEmail && req.user.email !== req.body.sellerEmail) {
      return res.status(403).json({ msg: "Security Alert: Email mismatch" });
    }

    next();
  } catch (err) {
    console.error("Seller Check Error:", err.message);
    return res.status(500).json({ msg: "Server Error: Security layer failed" });
  }
};
