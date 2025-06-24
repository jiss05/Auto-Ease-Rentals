🚗 AutoEase Rentals
AutoEase Rentals is a full-stack car rental booking system built using Node.js, Express, and MongoDB. It allows users to browse available cars, calculate rental costs with date/time/distance logic, and book rentals with flexible delivery and payment options. The platform also includes admin functionality to manage inventory and bookings.


💻 Tech Stack
Layer	Technology
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Auth	JWT
Date Utils	Native Date API
API Testing	Postman


✨ Key Features

🔐 User registration and authentication (JWT based)

🚘 Car categories and listings (e.g., SUV, Sedan, Hatchback, Luxury)

📅 Availability checking with date/time validation

🛵 Home delivery or self-pickup options with delivery charge logic

💰 Dynamic pricing based on rent/day, quantity, and duration

💳 Booking with partial advance payment (50%) and online/offline options

❌ Holiday and time restrictions (e.g., Sundays blocked, no drop after 9 PM)

🛒 Cart-based booking flow

📦 Admin panel support




🔌 API Endpoints
🧑‍💼 User Routes
Method	Endpoint	Description
POST	/register	Register a new user
POST	/login	Login and receive token
GET	/get-cars	Get available cars list
POST	/check-availability	Check cars' availability and cost
POST	/confirm-booking	Finalize a booking
PUT	/select-payment-method	Choose Online/Offline
GET	/my-bookings	View your booking history



🛒 Cart Routes
Method	Endpoint	Description
POST	/add-to-cart	Add a car with quantity
PUT	/update-cart	Update quantity
DELETE	/remove-from-cart	Remove car from cart
DELETE	/clear-cart	Remove all items
GET	/view-cart	View your cart items





