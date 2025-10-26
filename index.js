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
let transactionsCollection;
let counterCollection;

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
    transactionsCollection = db.collection("transactions");
    counterCollection = db.collection("counters");

    await counterCollection.updateOne(
      { _id: "bookingId" },
      { $setOnInsert: { seq: 0 } },
      { upsert: true }
    );

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
      return res.status(200).send({
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
    res.status(201).send({
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
app.get("/api/get-all-users", verifyToken, async (req, res) => {
  try {
    const result = await usersCollection.find().toArray();
    res
      .status(200)
      .send({
        success: true,
        message: "Users fetched successfully",
        data: result,
      });
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
      .send({
        success: true,
        message: "User status updated successfully",
        data: result,
      });
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
      .send({
        success: true,
        message: "User deleted successfully",
        data: result,
      });
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
    res.status(200).send({
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
    res.status(200).send({
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
    res.status(200).send({
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
app.get("/api/get-package/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await packagesCollection.findOne({ _id: new ObjectId(id) });
    res.status(200).send({
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
    res.status(200).send({
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
    res.status(200).send({
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
    res.status(200).send({
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

async function getNextBookingId() {
  const doc = await counterCollection.findOne({ _id: "bookingId" });
  let seq;

  if (!doc) {
    seq = 1;
    await counterCollection.insertOne({ _id: "bookingId", seq });
  } else {
    seq = doc.seq + 1;
    await counterCollection.updateOne({ _id: "bookingId" }, { $set: { seq } });
  }

  return "B" + seq.toString().padStart(4, "0");
}

// Book a package
app.post("/api/book_package/", verifyToken, async (req, res) => {
  try {
    const { packageId, ...rest } = req.body;
    // console.log("Booking request body:", req.body);
    if (!packageId || !ObjectId.isValid(packageId)) {
      return res
        .status(400)
        .send({ success: false, message: "Valid package ID is required" });
    }

    const bookingId = await getNextBookingId();

    const newBooking = {
      ...rest,
      packageId: new ObjectId(packageId),
      bookingId,
      createdAt: new Date(),
    };

    await packagesCollection.updateOne(
      { _id: new ObjectId(packageId) },
      { $inc: { bookingCount: 1 } }
    );

    const result = await packageBookingsCollection.insertOne(newBooking);

    res.status(201).send({
      success: true,
      message: "Package booked successfully",
      data: { bookingId, insertedId: result.insertedId },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});


//get booking  status
app.get("/api/get-booking-status", async (req, res) => {
  const email = req.query.email;
  const packageId = req.query.packageId;
  // console.log("Booking status request:", email, packageId);

  try {
    const bookingRes = await packageBookingsCollection.findOne({
      customerEmail: email,
      packageId: new ObjectId(packageId),
    });

    console.log("Booking status response:", bookingRes);

    if (!bookingRes) {
      return res.status(200).json({ status: false });
    } else {
      return res.status(200).json({ status: bookingRes.paymentStatus });
    }
  } catch (err) {
    console.error("Error checking booking status:", err);
    res.status(500).json({ success: false, message: "Server error" });
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
    res.status(200).send({
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
app.get("/api/get-all-bookings",  async (req, res) => {
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

//cancel a package booking

app.put("/api/cancel-booking/:bookingId", verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;


    const booking = await packageBookingsCollection.findOne({ bookingId });
    if (!booking) {
      return res.status(404).send({ success: false, message: "Booking not found" });
    }

    // Update booking status
    const result = await packageBookingsCollection.updateOne(
      { bookingId },
      { $set: { status: "Cancelled" } }
    );


    if (booking.packageId) {
      await packagesCollection.updateOne(
        { _id: new ObjectId(booking.packageId) },
        { $inc: { bookingCount: -1 } }
      );
    }

    //when booking cancel i want to add a field in trasnaction collection reufunded: true
    await transactionsCollection.updateOne(
      { bookingId },
      { $set: { refunded: true } }
    );

    res.status(200).send({
      success: true,
      message: `Booking ${bookingId} cancelled successfully`,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});


// get user bookings

app.get("/api/get-user-bookings",async (req, res) => {
  try {
    const userEmail = req.query.userEmail;

    // Find bookings by the user
    const bookings = await packageBookingsCollection
      .find({ customerEmail: userEmail })
      .toArray();

    // Extract package IDs from bookings
    const packageIds = bookings.map((b) => new ObjectId(b.packageId));

    // Fetch all packages at once
    const packages = await packagesCollection
      .find({ _id: { $in: packageIds } })
      .toArray();

    // Merge package info into each booking
    const enrichedBookings = bookings.map((booking) => {
      const pkg = packages.find((p) => p._id.equals(new ObjectId(booking.packageId)));
      return {
        ...booking,
        packageInfo: pkg ? {
          _id: pkg._id,
          title: pkg.title,
          location: pkg.location,
          price: pkg.price,
          duration: pkg.duration,
          category: pkg.category,
          images: pkg.images[0] || null,
          reviewCount: pkg.reviewCount
        } : null
      };
    });

    res.status(200).send({
      success: true,
      message: "Bookings with package info fetched successfully",
      data: enrichedBookings,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await categoriesCollection.find().toArray();
    res.status(200).send({
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

    // Insert review
    const result = await reviewsCollection.insertOne(newReview);
    if (!result.insertedId) throw new Error("Failed to create review");

    // Fetch all reviews for this package
    const allReviews = await reviewsCollection.find({ packageId }).toArray();

    // Calculate average rating
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    // Update rating & reviewCount in the package
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

//----------------- Payment Routes ----------------- //

// stripe payment creation

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/api/create-payment", verifyToken, async (req, res) => {
  // console.log(req.body);
  const { packageId, packageName, amount, customerEmail } = req.body;

  if (!packageId || !packageName || !amount || !customerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      receipt_email: customerEmail,
      metadata: { packageId, packageName },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Save transaction after success and update status and new date in applicationCollection
app.post("/api/save-transaction", verifyToken, async (req, res) => {
  const { paymentIntentId, email, packageId, bookingId, amount } = req.body;

  if (!paymentIntentId || !email || !packageId || !bookingId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Retrieve payment status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { status, created } = paymentIntent;

    if (status !== "succeeded") {
      return res.status(400).json({ error: "Payment failed" });
    }

    // Save transaction
    const transaction = {
      paymentIntentId,
      email,
      packageId,
      bookingId,
      amount,
      status,
      created,
    };

    await transactionsCollection.insertOne(transaction);

    // Update the booking to mark it as paid
    await packageBookingsCollection.updateOne(
      { bookingId },
      {
        $set: {
          paymentStatus: "succeeded",
          paymentDate: new Date(created * 1000),
        },
      }
    );

    res.json({
      success: true,
      message: "Transaction saved and booking updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// get all transactions
app.get("/api/get-transactions", async (req, res) => {
  try {
    const transactions = await transactionsCollection.find().toArray();
    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (err) {
    // console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


//get user payment history
app.get("/api/get-user-transactions", async (req, res) => {
  const email = req.query.email;
  try {
    const transactions = await transactionsCollection
      .find({ email })
      .toArray();
    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (err) {
    // console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.post("/api/refund-payment/:paymentId", verifyToken, async (req, res) => {
    try {
        const { paymentId } = req.params;

        // Find the transaction
        const payment = await transactionsCollection.findOne({ paymentIntentId: paymentId });
        if (!payment) {
            return res.status(404).send({ success: false, message: "Payment not found" });
        }
            // 3️⃣ Remove the booking
            if (payment.bookingId) {
                await packageBookingsCollection.deleteOne({ bookingId: payment.bookingId });
            }

            return res.send({ success: true, message: "Refund processed and booking removed successfully" });
        } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: error.message });
    }
});

// ------------------- Stats Route ------------------- //
app.get("/api/customer-dashboard",  async (req, res) => {
  try {
    const email = req.query.email;
    if (!email)
      return res.status(400).send({ success: false, message: "Email required" });

    // Fetch user info
    const user = await usersCollection.findOne({ email });
    if (!user)
      return res.status(404).send({ success: false, message: "User not found" });

    const todayStr = new Date().toISOString().split("T")[0]; 

    const upcomingBooking = await packageBookingsCollection
      .find({
        customerEmail: email,
        date: { $gte: todayStr },
        status: "confirmed",
        paymentStatus: "succeeded",
      })
      .sort({ date: 1 }) 
      .limit(1)
      .toArray();

    let upcomingTrip = null;
    if (upcomingBooking.length > 0) {
      const booking = upcomingBooking[0];
      const pkg = await packagesCollection.findOne({ _id: new ObjectId(booking.packageId) });

      upcomingTrip = {
        id: booking.bookingId,
        title: pkg?.title || booking.packageName,
        location: pkg?.location || "Unknown",
        date: booking.date,
        duration: pkg?.duration || null,
        image: pkg?.images?.[0] || null,
      };
    }

    // Stats
    const totalBookings = await packageBookingsCollection.countDocuments({ customerEmail: email });

    const transactions = await transactionsCollection
      .find({ email, status: "succeeded" })
      .toArray();
    const totalPayment = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const stats = [
      { title: "Total Bookings", value: totalBookings.toString(), icon: "FiList" },
      { title: "Total Payment", value: `$${totalPayment.toFixed(2)}`, icon: "FiDollarSign" },
    ];

    // Final response
    const dashboardData = {
      name: user.name || user.email,
      upcomingTrip,
      stats,
    };

    res.status(200).send({
      success: true,
      message: "Customer dashboard data fetched successfully",
      data: dashboardData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: err.message });
  }
});

//admin dashboard stats route
app.get("/api/admin-stats", verifyToken, async (req, res) => {
  try {
    // Calculate stats
    const totalRevenue = await transactionsCollection
      .aggregate([
        { $match: { status: "succeeded" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      .toArray();
      
    const totalRevenueValue = totalRevenue[0]?.total || 0;

    const totalBookings = await packageBookingsCollection.countDocuments();
    const totalPackages = await packagesCollection.countDocuments();
    const totalUsers = await usersCollection.countDocuments();

    const statsData = [
      { title: "Total Revenue", value: `$${totalRevenueValue.toLocaleString()}` },
      { title: "Total Bookings", value: totalBookings.toString() },
      { title: "Total Packages", value: totalPackages.toString() },
      { title: "Total Users", value: totalUsers.toString() },
    ];

    res.status(200).send({
      success: true,
      message: "Admin stats fetched successfully",
      data: statsData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: err.message });
  }
});

//admin booking chart data

app.get("/api/admin-bookings-chart", verifyToken, async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const bookingsByMonth = await packageBookingsCollection.aggregate([

      {
        $match: {
          paymentStatus: "succeeded",
          date: {
            $gte: `${year}-01-01`,
            $lte: `${year}-12-31`
          }
        }
      },

      {
        $group: {
          _id: { $month: { $dateFromString: { dateString: "$date" } } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();


    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const data = months.map((month, index) => {
      const monthData = bookingsByMonth.find(b => b._id === index + 1);
      return { name: month, bookings: monthData ? monthData.bookings : 0 };
    });

    res.status(200).send({
      success: true,
      message: "Monthly bookings data fetched successfully",
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: err.message });
  }
});

