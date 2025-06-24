# 🚗 AutoEase Rentals

AutoEase Rentals is a full-stack car rental booking system built using **Node.js**, **Express**, and **MongoDB**. It allows users to browse available cars, calculate rental costs with date/time/distance logic, and book rentals with flexible delivery and payment options. The platform also includes admin functionality to manage inventory and bookings.

---

## 🚀 Features

- 🔐 **User registration and authentication** (JWT based)
- 🚘 **Car categories and listings** (e.g., SUV, Sedan, Hatchback, Luxury)
- 📅 **Availability checking** with date/time validation
- 🏠 **Home delivery** or **self-pickup** options with delivery charge logic
- 💰 **Dynamic pricing** based on rent/day, quantity, and duration
- 💳 **Booking with partial advance payment** (50%) and online/offline payment options
- ❌ **Holiday and time restrictions** (e.g., Sundays blocked, no drop after 9 PM)
- 🛒 **Cart-based booking flow**
- 🛠️ **Admin panel support**

---

## 🧱 Tech Stack

- **Backend**: Node.js, Express.js  
- **Database**: MongoDB (via Mongoose ODM)  
- **Authentication**: JSON Web Token (JWT)  
- **Date Utilities**: Native Date API  
- **API Testing**: Postman  

---

## 📦 API Endpoints

### 👤 User Routes

| Method | Endpoint             | Description                         |
|--------|----------------------|-------------------------------------|
| POST   | `/register`          | Register a new user                 |
| POST   | `/login`             | Login and receive JWT token         |
| GET    | `/get-cars`          | Get available car listings          |
| POST   | `/check-availability`| Check car availability & rent cost  |
| POST   | `/confirm-booking`   | Finalize booking after availability |
| PUT    | `/select-payment-method` | Choose payment method (Online/Offline) |
| GET    | `/my-bookings`       | View booking history                |

### 🛒 Cart Routes

| Method | Endpoint             | Description                         |
|--------|----------------------|-------------------------------------|
| POST   | `/add-to-cart`       | Add a car to cart with quantity     |
| PUT    | `/update-cart`       | Update car quantity in cart         |
| DELETE | `/remove-from-cart`  | Remove a specific car from cart     |
| DELETE | `/clear-cart`        | Clear all cart items                |
| GET    | `/view-cart`         | View all items in cart              |

---
