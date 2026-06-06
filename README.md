# BR30 Kart Backend

🚀 **BR30 Kart Backend** is the server-side API for the BR30 Kart digital marketplace platform.  
It manages users, sellers, products, purchases, KYC, reviews, payouts, admin controls, authentication and email notifications.

> BR30 Kart is focused on digital content only — trading courses, educational content, PDFs, certificates and creator-based learning products.

---

## 🌐 Live API

```text
https://YOUR-RENDER-BACKEND-URL.onrender.com
```

---

## 🌐 Frontend Website

[🚀 Visit BR30 Kart](https://br-30-kart.vercel.app/)

---

## 🌟 Features

- User Registration & Login
- OTP Verification System
- JWT Authentication
- Forgot & Reset Password
- Seller Registration
- Seller Profile Management
- Seller Approval / Rejection System
- KYC Verification System
- Product Upload APIs
- Digital Course Management
- Product Approval System
- Course Purchase System
- My Courses Access
- Review & Rating System
- Admin Reply To Reviews
- Admin Dashboard APIs
- User Blocking System
- Seller Dashboard APIs
- Seller Sales Reports
- Weekly Payout Management
- Payment Order Creation
- Payment Verification
- Email Notification System
- MongoDB Database Integration
- Secure Environment Variable Setup

---

## 🛠️ Tech Stack

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)

---

### Authentication & Security

![JWT](https://img.shields.io/badge/JWT_Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Bcrypt.js](https://img.shields.io/badge/Bcrypt.js-FF6B35?style=for-the-badge&logo=securityscorecard&logoColor=white)
![CORS](https://img.shields.io/badge/CORS-0052CC?style=for-the-badge&logo=cors&logoColor=white)
![Dotenv](https://img.shields.io/badge/Dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)

---

### Email & Notifications

![Brevo](https://img.shields.io/badge/Brevo_SMTP-0099FF?style=for-the-badge)
![Nodemailer](https://img.shields.io/badge/Nodemailer-34A853?style=for-the-badge&logo=gmail&logoColor=white)

---

### Payments

![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)

---

### Media & File Handling

![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-FF9800?style=for-the-badge)

---

### Deployment

![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=white)

---

### Development Tools

![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

## 📁 Project Structure

```bash
BR30KART.COM-B
│
├── certificates/
│
├── config/
│   ├── cloudinary.js
│   ├── db.js
│   └── mail.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── courseController.js
│   ├── pementController.js
│   ├── productController.js
│   ├── reviewController.js
│   └── sellerController.js
│
├── images/
│
├── middleware/
│   ├── admin.js
│   ├── auth.js
│   ├── multerCloudinary.js
│   ├── sellerUpload.js
│   ├── upload.js
│   └── verifySeller.js
│
├── models/
│   ├── certificate.js
│   ├── coupon.js
│   ├── Notification.js
│   ├── order.js
│   ├── Product.js
│   ├── Review.js
│   ├── Seller.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── pementRoutes.js
│   ├── productRoutes.js
│   ├── reviewRoutes.js
│   └── sellerRoutes.js
│
├── utils/
│   ├── cronJobs.js
│   ├── emailTemplate.js
│   ├── generateProfessionalCert.js
│   ├── reviewReply.js
│   └── sendEmail.js
│
├── node_modules/
│
├── .env
├── .gitignore
├── autoReview.js
├── package-lock.json
├── package.json
└── server.js
```

---

## 🔐 Environment Variables

Create a `.env` file in the root folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

FRONTEND_URL=https://br-30-kart.vercel.app

EMAIL_USER=your_email
EMAIL_PASS=your_email_password_or_smtp_key
BREVO_API_KEY=your_brevo_api_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

⚠️ Never push `.env` to GitHub.

---

## 🚀 Installation & Setup

```bash
npm install
```

---

## ▶️ Run Locally

```bash
npm start
```

or

```bash
node server.js
```

---

## 📌 Main API Modules

### Auth APIs

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### User APIs

```text
GET  /api/users
GET  /api/users/:id
PUT  /api/users/:id
```

### Seller APIs

```text
POST /api/seller/register
GET  /api/seller/profile/:email
PUT  /api/seller/profile/:email
GET  /api/seller/report/:email
```

### Product APIs

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/purchase/:id
GET    /api/products/my-courses
```

### Review APIs

```text
GET    /api/reviews
POST   /api/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

### Payment APIs

```text
POST /api/payment/create-order
POST /api/payment/verify
```

### Admin APIs

```text
GET  /api/admin/users
PUT  /api/admin/users/block/:id
PUT  /api/admin/seller/approve/:id
PUT  /api/admin/seller/reject/:id
PUT  /api/admin/products/approve/:id
PUT  /api/admin/products/hide/:id
```

### Payout APIs

```text
GET  /api/payouts
POST /api/payouts/process
GET  /api/payouts/seller/:email
```

---

## 🚀 Deployment

Backend deployed on:

```text
Render
```

Frontend deployed on:

```text
Vercel
```

Frontend URL:

```text
https://br-30-kart.vercel.app/
```

---

## 🔒 Security Notes

- `.env` is ignored using `.gitignore`
- API keys are stored in Render environment variables
- JWT is used for protected routes
- Passwords are encrypted before storing
- Payment verification is handled securely
- Seller and admin routes are protected

---

## 👨‍💻 Developed By

**Mukesh Raj**  
Founder — **BR30 Group**

---

## 📬 Contact

- [LinkedIn](https://www.linkedin.com/in/mukeshraj-br30/)
- [GitHub](https://github.com/mukeshkumarsingh7488-afk)
- [Instagram](https://www.instagram.com/br30Traderofficial)
- [YouTube](https://www.youtube.com/@br30traderofficial)

---

## 📌 Project Status

BR30 Kart Backend is actively maintained and improved for marketplace features, seller tools, payment flow, payout automation, admin systems and platform security.

---

### Build • Sell • Learn • Grow 🚀
