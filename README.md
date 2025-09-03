
# Tripora – Travel Package Management API

A Node.js + Express + MongoDB + Firebase backend for managing travel packages, categories, and bookings with secure authentication.


## 🚀 Features


- User Authentication – Secure token verification using Firebase Admin SDK
- Package Management – Create, update, delete, and fetch travel packages
- Booking Management – Book, update, delete, and fetch package bookings
- Category Management – Manage and retrieve travel categories
- Secure APIs – Token-protected routes for sensitive operations
- Scalable Architecture – Ready for production deployment








## 🛠️ Tech Stack

**Server:** Node.js, Express.js  

| Layer                  | Technology                         |
|------------------------|-------------------------------------|
| **Backend**            | Node.js, Express.js                |
| **Database**           | MongoDB Atlas                      |
| **Authentication**     | Firebase Admin SDK                 |
| **Environment**        | dotenv                              |
| **Security & Middleware** | CORS, JWT-based Token Verification |

## Installation
### Follow these steps to get the project up and running:

1. **Clone the repository**

```bash
git clone https://github.com/nafijur-rahaman/tripora-backend.git
cd tripora-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Run The Project**

```bash
npm start
```

> Make sure you have Node.js and npm installed on your system.


4. **Create .env file**

```bash
PORT=5000
DB_USER=your_mongodb_user
DB_PASS=your_mongodb_password
DB_NAME=triporaDB

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

```
## API Endpoints

### Public Routes


| Method | Endpoint    | Description                |
| :-------- | :------- | :------------------------- |
| `GET` | `/` | **check for the server** |
| `GET` | `/api/get_all_packages/` | **Fetch all travel packages** |
| `GET` | `/api/categories` | **Fetch all travel categories** |


### Protected Routes (require Firebase token in Authorization header)



##  API Endpoints

| Method | Endpoint | Description | Parameters |
|--------|---------|-------------|------------|
| POST   | `/api/create_package/` | Create a new package | N/A |
| GET    | `/api/get_limited_packages/` | Fetch 6 packages | N/A |
| GET    | `/api/get_package/:id` | Fetch a single package by ID | `id` **string** - **Required**. ID of the package to fetch |
| GET    | `/api/get_user_packages/` | Get all packages created by a user | N/A |
| PUT    | `/api/update_package/:id` | Update a package by ID | `id` **string** - **Required**. ID of the package to update |
| DELETE | `/api/delete_package/:id` | Delete a package by ID | `id` **string** - **Required**. ID of the package to delete |
| POST   | `/api/book_package/` | Book a package | N/A |
| PUT    | `/api/update_booking/:id` | Update booking status to completed | `id` **string** - **Required**. ID of the booking to update |
| DELETE | `/api/delete_booking/` | Delete a booking | `id` **string** - **Required**. ID of the booking to delete |
| GET    | `/api/get_all_bookings` | Get all bookings for a guide | N/A |



## Authors

- [@Nafijur Rahaman](https://www.github.com/nafijur-rahaman)

