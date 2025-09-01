require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1e3hmt0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db(process.env.DB_NAME);
    const packagesCollection = db.collection("packages");
    const categoriesCollection = db.collection("categories");

    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected and pinged MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  } }

run().catch(console.dir);


// create a package

app.post("api/create_package/",async(req,res)=>{
    try{
        const newPackage = {
            ...req.body,
            bookingCount: 0,
            createdAt: new Date()
        };
        const result = await packagesCollection.insertOne(newPackage);
        res.status(201).send({
            success: true,
            message: "Package created successfully",
            data: result
        });
    }catch(error){
        console.error(error);
        res.status(500).send("Something went wrong");
    }
})





app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

