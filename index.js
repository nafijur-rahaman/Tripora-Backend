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
  }
});



let packagesCollection;
let categoriesCollection;
let packageBookingsCollection;


async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db(process.env.DB_NAME);
    packagesCollection = db.collection("packages");
    categoriesCollection = db.collection("categories");
    packageBookingsCollection = db.collection("package_bookings");

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

// Create a package
app.post("/api/create_package/", verifyToken, async (req, res) => {
  try {
    const newPackage = { ...req.body, bookingCount: 0, createdAt: new Date() };
    const result = await packagesCollection.insertOne(newPackage);
    res.status(201).send({ success: true, message: "Package created successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all packages
app.get("/api/get_all_packages/", async (req, res) => {
  try {
    const result = await packagesCollection.find().toArray();
    res.status(200).send({ success: true, message: "Packages fetched successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get 6 packages
app.get("/api/get_limited_packages/", verifyToken, async (req, res) => {
  try {
    const result = await packagesCollection.find().limit(6).toArray();
    res.status(200).send({ success: true, message: "Packages fetched successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get a single package
app.get("/api/get_package/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await packagesCollection.findOne({ _id: new ObjectId(id) });
    res.status(200).send({ success: true, message: "Package fetched successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get user individual packages
app.get("/api/get_user_packages/", verifyToken, async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    const result = await packagesCollection.find({ guide_email: userEmail }).toArray();
    res.status(200).send({ success: true, message: "Packages fetched successfully", data: result });
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
    const result = await packagesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedPackage });
    res.status(200).send({ success: true, message: "Package updated successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Delete a package
app.delete("/api/delete_package/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await packagesCollection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).send({ success: true, message: "Package deleted successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Book a package
app.post("/api/book_package/", verifyToken, async (req, res) => {
  try {
    const { package_id, ...rest } = req.body;
    if (!package_id || !ObjectId.isValid(package_id)) {
      return res.status(400).send({ success: false, message: "Valid package ID is required" });
    }

    const newBooking = { ...rest, package_id: new ObjectId(package_id), createdAt: new Date() };
    await packagesCollection.updateOne({ _id: new ObjectId(package_id) }, { $inc: { bookingCount: 1 } });
    const result = await packageBookingsCollection.insertOne(newBooking);

    res.status(201).send({ success: true, message: "Package booked successfully", data: { bookingId: result.insertedId } });
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
    const result = await packageBookingsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    res.status(200).send({ success: true, message: "Booking status updated successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Delete booking
app.delete("/api/delete_booking/", verifyToken, async (req, res) => {
  const { booking_id, package_id } = req.body;
  if (!booking_id || !ObjectId.isValid(booking_id)) {
    return res.status(400).send({ success: false, message: "Valid booking ID is required" });
  }
  if (!package_id || !ObjectId.isValid(package_id)) {
    return res.status(400).send({ success: false, message: "Valid package ID is required" });
  }

  try {
    const deleteResult = await packageBookingsCollection.deleteOne({ _id: new ObjectId(booking_id) });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).send({ success: false, message: "Booking not found" });
    }

    await packagesCollection.updateOne({ _id: new ObjectId(package_id) }, { $inc: { bookingCount: -1 } });
    res.status(200).send({ success: true, message: "Booking deleted successfully", data: deleteResult });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all bookings
app.get("/api/get_all_bookings", verifyToken, async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    if (!userEmail) {
      return res.status(400).send({ success: false, message: "User email is required" });
    }

    const result = await packageBookingsCollection.find({ guide_email: userEmail }).toArray();
    res.status(200).send({ success: true, message: "Bookings fetched successfully", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await categoriesCollection.find().toArray();
    res.status(200).send({ success: true, message: "Categories fetched successfully", data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

