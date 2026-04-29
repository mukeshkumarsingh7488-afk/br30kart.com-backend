const cron = require("node-cron");
const Product = require("../models/Product"); // अपना मॉडल पाथ चेक कर लेना

const startDiscountCleanup = () => {
  // हर मिनट चेक करेगा (* * * * *)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // उन प्रोडक्ट्स को ढूंढो जिनका समय खत्म हो गया (5 मिनट वाला लॉजिक)
      // ⚡ लाइव होने पर 5 * 60 * 1000 को (7 * 24 * 60 * 60 * 1000) कर देना
      const expiryThreshold = 5 * 60 * 1000;

      // MongoDB Query: जिनका discount > 0 है और जो एक्सपायर हो चुके हैं
      const expiredProducts = await Product.updateMany(
        {
          discount: { $gt: 0 },
          $expr: {
            $gt: [
              {
                $subtract: [
                  now,
                  { $ifNull: ["$couponCreatedAt", "$createdAt"] },
                ],
              },
              expiryThreshold,
            ],
          },
        },
        { $set: { discount: 0 } },
      );

      if (expiredProducts.modifiedCount > 0) {
        console.log(
          `✅ DB Cleanup: ${expiredProducts.modifiedCount} products ka discount 0 kiya gaya.`,
        );
      }
    } catch (err) {
      console.error("❌ Cron Job Error:", err);
    }
  });
};

module.exports = startDiscountCleanup;
