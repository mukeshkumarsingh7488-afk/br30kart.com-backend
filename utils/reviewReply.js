// germet review replay br30 kart
function generateSmartReply({
  username = "",
  rating,
  comment,
  customReply = "",
}) {
  const text = comment.toLowerCase(); // ✅ yaha fix

  const positiveWords = [
    "good",
    "great",
    "best",
    "amazing",
    "love",
    "excellent",
  ];

  const negativeWords = ["bad", "worst", "scam", "poor", "refund", "not good"];

  const isNegative = negativeWords.some((w) => text.includes(w));
  const userName = username ? ` ${username}` : ""; // ✅ yaha fix

  // 🔥 1. CUSTOM REPLY (highest priority)
  if (customReply && customReply.trim() !== "") {
    return customReply;
  }

  // Positive Reviews (4-5 Stars) - For BR30 Academy
  if (rating >= 4 && !isNegative) {
    const replies = [
      `Thank you ${userName}! 🙏 We're thrilled to be part of your learning journey at BR30 Academy. 🚀`,
      `Great to hear that ${userName}! 😊 Keep learning and growing with BR30.`,
      `Thanks a lot ${userName}! Your success is our mission at BR30 Academy. 💯`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // Neutral Reviews (3 Stars)
  if (rating === 3 && !isNegative) {
    return `Thank you ${userName}! 🙏 We are constantly improving our courses to give you a better experience at BR30 Academy.`;
  }

  // 🔥 4. NEGATIVE AUTO REPLY (1-2 Stars or Negative text)
  if (isNegative || rating <= 2) {
    const replies = [
      `Sorry for the inconvenience ${userName}. 🙏 Please reach out to BR30 Support, we’ll resolve your issue immediately.`,
      `We apologize ${userName}. 😔 Your feedback helps us improve BR30 Academy. We’ll look into this.`,
      `Thanks for the feedback ${userName}. We're committed to fixing this for you ASAP.`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  return null; // negative = manual
}

module.exports = { generateSmartReply };
