require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const app = express();



app.use(cors());
app.use(express.json());
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

let packagesCollection;
let categoriesCollection;


async function run() {
  try {
    await client.connect();

    const db = client.db(process.env.DB_NAME);
    packagesCollection = db.collection("packages");
    categoriesCollection = db.collection("categories");


    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected and pinged MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  } }

run().catch(console.dir);


// create a package

app.post("/api/create_package/",async(req,res)=>{
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


// get all packages

app.get('/api/get_all_packages/',async(req,res)=>{
    try{
        const result = await packagesCollection.find().toArray();
        res.status(200).send({
            success: true,
            message: "Packages fetched successfully",
            data: result
        });
    }catch(error){
        console.error(error);
        res.status(500).send("Something went wrong");
    }
})



// get a single package


app.get("/api/get_package/:id",async(req,res)=>{
    try{
        const id = req.params.id;
        const result = await packagesCollection.findOne({ _id: new ObjectId(id) });
        res.status(200).send({
            success: true,
            message: "Package fetched successfully",
            data: result
        });
    }catch(error){
        console.error(error);
        res.status(500).send("Something went wrong");
    }
})


// get user individual packages

app.get("/api/get_user_packages/", async(req,res)=>{
    try{
        const userEmail = req.query.userEmail;
        const result = await packagesCollection.find({ guide_email: userEmail }).toArray();
        res.status(200).send({
            success: true,
            message: "Packages fetched successfully",
            data: result
        });
    }catch(error){
        console.error(error);
        res.status(500).send("Something went wrong");
    }
})


// update a package

app.put("/api/update_package/:id", async (req, res) => {
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
    res.status(500).send("Something went wrong");
  }
});


// delete a package


app.delete("/api/delete_package/:id",async(req,res)=>{
    try{
        const id = req.params.id;
        const result = await packagesCollection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).send({
            success: true,
            message: "Package deleted successfully",
            data: result
        });
    }catch(error){
        console.error(error);
        res.status(500).send("Something went wrong");
    }
})



// get all categories

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await categoriesCollection.find().toArray();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// create user individual package

// app.post("/api/create_user_package/", async(req,res)=>{
//     try{
//         const newPackage = {
//             ...req.body,
//             createdAt: new Date()
//         }
//         const result = await userPackagesCollection.insertOne(newPackage);
//         res.status(201).send({
//             success: true,
//             message: "Package created successfully",
//             data: result
//         });
//     }catch(error){
//         console.error(error);
//         res.status(500).send("Something went wrong");
//     }
// })






app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

