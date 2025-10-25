require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const admin = require("./firebaseAdmin");
const { verifyToken } = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1e3hmt0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB client setup

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let packagesCollection;
let categoriesCollection;
let packageBookingsCollection;
let usersCollection;
let reviewsCollection;

// Connect to MongoDB

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db(process.env.DB_NAME);
    packagesCollection = db.collection("packages");
    categoriesCollection = db.collection("categories");
    packageBookingsCollection = db.collection("package_bookings");
    usersCollection = db.collection("users");
    reviewsCollection = db.collection("reviews");



    console.log(`Connected to MongoDB: ${process.env.DB_NAME}`);

    // Start server only after DB is ready
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
}

run().catch(console.dir);

// ---------------- Routes ---------------- //

app.get("/", (req, res) => {
  res.send("Hello, I am Tripora");
});

//-------------------Auth Routes-------------------//

//create user

app.post("/api/create_user/", async (req, res) => {
  try {
    const userData = req.body;
    const existingUser = await usersCollection.findOne({
      email: userData.email,
    });

    if (existingUser) {
      return res
        .status(200)
        .send({
          success: true,
          message: "User already exists",
          data: existingUser,
        });
    }
    const userDataWithRole = {
      ...userData,
      role: "customer",
      status: "active",
      createdAt: new Date(),
    };
    const user = { ...userDataWithRole };

    const result = await usersCollection.insertOne(user);
    res
      .status(201)
      .send({
        success: true,
        message: "User created successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});


//Get all users
app.get("/api/get-all-users",verifyToken,  async (req, res) => {
  try {
    const result = await usersCollection.find().toArray();
    res
      .status(200)
      .send({ success: true, message: "Users fetched successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});


//change user status
app.put("/api/update-user-status/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const status = "banned";
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );
    res
      .status(200)
      .send({ success: true, message: "User status updated successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

//delete user

app.delete("/api/delete-user/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    res
      .status(200)
      .send({ success: true, message: "User deleted successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

//get user info

app.get("/api/user-info", async (req, res) => {
  try {
    const email = req.query.email;
    const user = await usersCollection.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .send({
        success: true,
        message: "User info fetched successfully",
        data: user,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

//---------------- Package Routes ---------------- //

// Create a package
app.post("/api/add-packages", verifyToken, async (req, res) => {
  try {
    const { title, price, location } = req.body;

    // Basic validation
    if (!title || !price || !location) {
      return res.status(400).send({
        success: false,
        message: "Title, price, and location are required fields.",
      });
    }

    const newPackage = {
      ...req.body,
      bookingCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    };

    const result = await packagesCollection.insertOne(newPackage);

    if (!result.insertedId) {
      throw new Error("Failed to create package");
    }

    res.status(201).send({
      success: true,
      message: "Package created successfully",
      data: { ...newPackage, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Get all packages
app.get("/api/get-all-packages/", async (req, res) => {
  try {
    const result = await packagesCollection.find().toArray();
    res
      .status(200)
      .send({
        success: true,
        message: "Packages fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get 6 packages
app.get("/api/get_limited_packages/", async (req, res) => {
  try {
    const result = await packagesCollection.find().limit(6).toArray();
    res
      .status(200)
      .send({
        success: true,
        message: "Packages fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get a single package
app.get("/api/get-package/:id",  async (req, res) => {
  try {
    const id = req.params.id;
    const result = await packagesCollection.findOne({ _id: new ObjectId(id) });
    res
      .status(200)
      .send({
        success: true,
        message: "Package fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get user individual packages
app.get("/api/get_user_packages/", verifyToken, async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const result = await packagesCollection
      .find({ guide_email: userEmail })
      .toArray();
    res
      .status(200)
      .send({
        success: true,
        message: "Packages fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Update a package
app.put("/api/update_package/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const updatedPackage = { ...req.body };
    delete updatedPackage._id;
    const result = await packagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedPackage }
    );
    res
      .status(200)
      .send({
        success: true,
        message: "Package updated successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Delete a package
app.delete("/api/delete-package/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await packagesCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res
      .status(200)
      .send({
        success: true,
        message: "Package deleted successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});




//---------------- Package Booking Routes ---------------- //


// Book a package
app.post("/api/book_package/", verifyToken, async (req, res) => {
  try {
    const { package_id, ...rest } = req.body;
    if (!package_id || !ObjectId.isValid(package_id)) {
      return res
        .status(400)
        .send({ success: false, message: "Valid package ID is required" });
    }

    const newBooking = {
      ...rest,
      package_id: new ObjectId(package_id),
      createdAt: new Date(),
    };
    await packagesCollection.updateOne(
      { _id: new ObjectId(package_id) },
      { $inc: { bookingCount: 1 } }
    );
    const result = await packageBookingsCollection.insertOne(newBooking);

    res
      .status(201)
      .send({
        success: true,
        message: "Package booked successfully",
        data: { bookingId: result.insertedId },
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Update booking status
app.put("/api/update_booking/:id", verifyToken, async (req, res) => {
  try {
    const status = "completed";
    const id = req.params.id;
    const result = await packageBookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    res
      .status(200)
      .send({
        success: true,
        message: "Booking status updated successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Delete booking
app.delete("/api/delete_booking/", verifyToken, async (req, res) => {
  const { booking_id, package_id } = req.body;
  if (!booking_id || !ObjectId.isValid(booking_id)) {
    return res
      .status(400)
      .send({ success: false, message: "Valid booking ID is required" });
  }
  if (!package_id || !ObjectId.isValid(package_id)) {
    return res
      .status(400)
      .send({ success: false, message: "Valid package ID is required" });
  }

  try {
    const deleteResult = await packageBookingsCollection.deleteOne({
      _id: new ObjectId(booking_id),
    });
    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Booking not found" });
    }

    await packagesCollection.updateOne(
      { _id: new ObjectId(package_id) },
      { $inc: { bookingCount: -1 } }
    );
    res
      .status(200)
      .send({
        success: true,
        message: "Booking deleted successfully",
        data: deleteResult,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all bookings
app.get("/api/get-all-bookings", verifyToken, async (req, res) => {
  try {
    const result = await packageBookingsCollection.find().toArray();
    res.status(200).send({
        success: true,
        message: "Bookings fetched successfully",
        data: result,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await categoriesCollection.find().toArray();
    res
      .status(200)
      .send({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
      });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});


//---------------- Review Routes ---------------- //

// Create a review and update package rating & reviewCount
app.post("/api/add-review", verifyToken, async (req, res) => {
  try {
    const { packageId, rating, comment } = req.body;
    const userEmail = req.user?.email;

    if (!packageId || !rating) {
      return res.status(400).send({
        success: false,
        message: "Package ID and rating are required.",
      });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).send({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    const newReview = {
      packageId,
      rating,
      comment: comment || "",
      userEmail,
      createdAt: new Date(),
    };

    // 1️⃣ Insert review
    const result = await reviewsCollection.insertOne(newReview);
    if (!result.insertedId) throw new Error("Failed to create review");

    // 2️⃣ Fetch all reviews for this package
    const allReviews = await reviewsCollection.find({ packageId }).toArray();

    // 3️⃣ Calculate average rating
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    // 4️⃣ Update rating & reviewCount in the package
    await packagesCollection.updateOne(
      { _id: new ObjectId(packageId) },
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: allReviews.length,
        },
      }
    );

    res.status(201).send({
      success: true,
      message: "Review added, rating & review count updated",
      data: { ...newReview, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});



// Get all reviews for a specific package
app.get("/api/reviews/:packageId", async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return res.status(400).send({
        success: false,
        message: "Package ID is required.",
      });
    }

    // Fetch all reviews for this package
    const reviews = await reviewsCollection
      .find({ packageId })
      .sort({ createdAt: -1 }) // newest first
      .toArray();

    res.status(200).send({
      success: true,
      message: "Reviews fetched successfully",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});
