# 🔧 ServiceSetu — Hyperlocal Service Marketplace

A production-ready, full-stack web platform connecting customers with local service providers (plumbers, electricians, carpenters, painters, laborers). Built with React + Vite on the frontend and Node.js + Express + MongoDB on the backend.

---

## 🗂️ Project Structure

```
servicesetu/
├── backend/
│   ├── controllers/
│   │   ├── authController.js        # Login, register, profile
│   │   ├── bookingController.js     # Booking CRUD + auto-assign
│   │   ├── serviceController.js     # Service catalog
│   │   ├── workerController.js      # Worker lookup + geo-match
│   │   └── adminController.js       # Analytics + admin management
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT protect + role-based access
│   │   └── errorMiddleware.js       # Global error handler + asyncHandler
│   ├── models/
│   │   ├── User.js                  # Customer + Admin
│   │   ├── Worker.js                # Worker (no login)
│   │   ├── Service.js               # Service catalog
│   │   └── Booking.js               # Booking + status history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── workerRoutes.js
│   │   ├── adminRoutes.js
│   │   └── paymentRoutes.js
│   ├── utils/
│   │   └── notificationService.js   # SMS/IVR abstraction layer (mock)
│   ├── seed/
│   │   └── seedData.js              # Sample data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/              # Navbar, LoadingScreen, StatusBadge, etc.
    │   │   ├── customer/            # ServiceCard, BookingCard
    │   │   └── admin/               # AdminLayout (sidebar)
    │   ├── context/
    │   │   └── AuthContext.jsx      # JWT auth state management
    │   ├── pages/
    │   │   ├── customer/            # HomePage, ServicesPage, BookingPage, Dashboard
    │   │   ├── admin/               # AdminDashboard, AdminBookings, AdminWorkers, AdminCustomers
    │   │   ├── LoginPage.jsx
    │   │   └── RegisterPage.jsx
    │   ├── services/
    │   │   └── api.js               # Axios instance with interceptors
    │   ├── App.jsx                  # Router + route guards
    │   ├── main.jsx
    │   └── index.css                # Tailwind + custom components
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm or yarn

---

### 1. Clone & Set Up

```bash
git clone <your-repo-url>
cd servicesetu
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/servicesetu
JWT_SECRET=change_this_to_a_strong_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
ADMIN_EMAIL=admin@servicesetu.com
ADMIN_PASSWORD=Admin@123
```

**Seed the database** (creates admin, demo customer, 10 services, 10 workers):
```bash
node seed/seedData.js
```

**Start the backend**:
```bash
npm run dev       # Development (with nodemon)
# OR
npm start         # Production
```

Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### 4. Default Login Credentials

| Role     | Email                     | Password   |
|----------|---------------------------|------------|
| Admin    | admin@servicesetu.com     | Admin@123  |
| Customer | priya@example.com         | Demo@123   |

---

## 🔌 API Documentation

All routes are prefixed with `/api`. Auth routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint                    | Access  | Description              |
|--------|-----------------------------|---------|--------------------------|
| POST   | `/auth/register`            | Public  | Register new customer    |
| POST   | `/auth/login`               | Public  | Login (customer/admin)   |
| GET    | `/auth/me`                  | Private | Get current user profile |
| PUT    | `/auth/profile`             | Private | Update profile           |
| PUT    | `/auth/change-password`     | Private | Change password          |

### Services

| Method | Endpoint                    | Access        | Description              |
|--------|-----------------------------|---------------|--------------------------|
| GET    | `/services`                 | Public        | List all services        |
| GET    | `/services/categories`      | Public        | Group by category        |
| GET    | `/services/:slug`           | Public        | Get service by slug      |
| POST   | `/services`                 | Admin         | Create service           |
| PUT    | `/services/:id`             | Admin         | Update service           |

### Bookings

| Method | Endpoint                          | Access         | Description               |
|--------|-----------------------------------|----------------|---------------------------|
| POST   | `/bookings`                       | Customer       | Create booking            |
| GET    | `/bookings`                       | Customer       | List my bookings          |
| GET    | `/bookings/:id`                   | Customer/Admin | Get booking details       |
| PUT    | `/bookings/:id/cancel`            | Customer       | Cancel booking            |
| POST   | `/bookings/:id/rate`              | Customer       | Rate completed booking    |
| POST   | `/bookings/:id/worker-response`   | Public (worker)| Worker accept/reject job  |

### Admin

| Method | Endpoint                                | Access | Description              |
|--------|-----------------------------------------|--------|--------------------------|
| GET    | `/admin/analytics`                      | Admin  | Dashboard stats          |
| GET    | `/admin/bookings`                       | Admin  | All bookings with filters|
| PUT    | `/admin/bookings/:id/assign-worker`     | Admin  | Manually assign worker   |
| PUT    | `/admin/bookings/:id/status`            | Admin  | Update booking status    |
| GET    | `/admin/workers`                        | Admin  | List all workers         |
| POST   | `/admin/workers`                        | Admin  | Register new worker      |
| PUT    | `/admin/workers/:id`                    | Admin  | Update worker            |
| DELETE | `/admin/workers/:id`                    | Admin  | Deactivate worker        |
| GET    | `/admin/customers`                      | Admin  | List all customers       |

### Workers (Public)

| Method | Endpoint                    | Access | Description                        |
|--------|-----------------------------|--------|------------------------------------|
| GET    | `/workers/available`        | Public | Find workers by skill + pincode    |
| GET    | `/workers/:id`              | Public | Worker public profile              |

### Payments

| Method | Endpoint                    | Access   | Description                     |
|--------|-----------------------------|----------|---------------------------------|
| POST   | `/payments/create-order`    | Customer | Create Razorpay order (mock)    |
| POST   | `/payments/verify`          | Customer | Verify payment                  |

---

## 🏗️ Architecture Decisions

### Worker System (No Smartphone)
Workers are managed entirely by admin. When a booking is assigned:
1. System sends an **SMS notification** (mock in dev; replace with MSG91/Twilio in production)
2. Worker can **accept/reject** via: `POST /api/bookings/:id/worker-response` with their phone number
3. This endpoint simulates **IVR callback** (worker presses 1/2 on keypad → webhook calls API)

### Auto-Assignment
When a customer books a service, the system automatically:
1. Queries for available workers matching the service skill in the same pincode
2. Selects the highest-rated available worker
3. Assigns them and sends SMS
4. Falls back to "pending" status if no workers are available

### Role-Based Access
- `customer` — book services, view own bookings, rate workers
- `admin` — full access to all data, worker management, booking assignment

---

## 🔧 Production Deployment

### Environment Changes
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/servicesetu
JWT_SECRET=<cryptographically-strong-32+-char-secret>
```

### SMS Integration (MSG91 example)
In `backend/utils/notificationService.js`, replace the mock block with:
```js
const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
  template_id: process.env.MSG91_TEMPLATE_ID,
  sender: process.env.SMS_SENDER_ID,
  mobiles: `91${phone}`,
  var1: message,
}, { headers: { authkey: process.env.SMS_API_KEY } });
```

### Razorpay Integration
In `backend/routes/paymentRoutes.js`, uncomment the Razorpay code blocks and add:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret
```

### Build Frontend
```bash
cd frontend
npm run build
# Serve /dist with nginx or deploy to Vercel/Netlify
```

---

## 🌟 Features Summary

| Feature                         | Status |
|---------------------------------|--------|
| Customer booking (5-step)       | ✅     |
| Admin dashboard + analytics     | ✅     |
| Worker management (CRUD)        | ✅     |
| Auto-assignment by pincode      | ✅     |
| Manual admin assignment         | ✅     |
| SMS notification (mock)         | ✅     |
| Worker accept/reject (IVR sim.) | ✅     |
| JWT authentication              | ✅     |
| Role-based access control       | ✅     |
| Booking status tracking         | ✅     |
| Rating & review system          | ✅     |
| Razorpay-ready payment          | ✅     |
| Responsive mobile-first UI      | ✅     |
| Error handling + validation     | ✅     |
| Rate limiting + security        | ✅     |
| Database seeding                | ✅     |

---

## 📦 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS        |
| State Mgmt  | React Context API                   |
| Routing     | React Router v6                     |
| HTTP Client | Axios                               |
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB, Mongoose ODM               |
| Auth        | JWT (jsonwebtoken, bcryptjs)        |
| Security    | Helmet, CORS, express-rate-limit    |
| Validation  | express-validator                   |
| SMS (mock)  | Custom abstraction (MSG91/Twilio)   |
| Payments    | Razorpay-ready (mock)               |

---

## 📞 Support

For issues or questions, raise a GitHub issue or contact the development team.

**ServiceSetu** — Connecting communities, one service at a time. 🔧
#   S e r v i c e S e t u - p l a t f o r m  
 #   S e r v i c e S e t u - p l a t f o r m  
 