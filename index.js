const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
app.use(
  cors()
);
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.whnyl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // mohanobir shikkha collection start
    const mohanobirShikkhaCollection = client
      .db("MohanobirShikkha")
      .collection("users");
    // mohanobir shikkha colection end

    // All data collections
    const assetsOrbitUsersCollection = client
      .db("AssetOrbit")
      .collection("users");
    const assetsOrbitAssetCollection = client
      .db("AssetOrbit")
      .collection("assets");
    const assetsOrbitRequestCollection = client
      .db("AssetOrbit")
      .collection("assetRequests");
    // Token Related Api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    // mohabir sikkha database from here

    // Root Api
    app.get("/", (req, res) => {
      res.send("Mohanobir Shikkha server is running");
    });
    app.get("/profile/:id", async (req, res) => {
      let id =req.params.id;
      id = id.padStart(3, '0');
       const query = { applicantId: id };
       console.log(query);
      const result = await mohanobirShikkhaCollection.findOne(query);
      if (!result) {
        return res.send({ user: false, message: "User not found" });
      }
      console.log(result);
  
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      
      const lastApplicant = await mohanobirShikkhaCollection
        .find()
        .sort({ applicantId: -1 })
        .limit(1)
        .toArray();

      let newApplicantId = "001"; 
      if (lastApplicant.length > 0) {
       
        let lastId = parseInt(lastApplicant[0].applicantId, 10);
        newApplicantId = (lastId + 1).toString().padStart(3, "0"); 
      }

      
      user.applicantId = newApplicantId;

      const result = await mohanobirShikkhaCollection.insertOne(user);
      if (result.acknowledged) {
        res.send( {message: "User created successfully",
          user: user,});
      }
      console.log(result);
      
    });
    app.patch("/users", async (req, res) => {
      const user = req.body;
      const id = user.id;
      const payment = user.payment;
      const query = { _id: new ObjectId(id) };
      const post = {
        $set: {
          payment,
        },
      };
      const result = await mohanobirShikkhaCollection.updateOne(query, post);
      res.send(result);
    });
    app.post("/find-users", async (req, res) => {
      const { productName, productType, sort, availability } = req.body;
      let query = {};
      let sortOptions = {};
      if (productName) {
        query.productName = { $regex: productName, $options: "i" };
      }
      if (availability === "Available") {
        query.productQuantity = { $gt: 0 };
      } else if (availability === "Out-of-stock") {
        query.productQuantity = { $eq: 0 };
      }
      if (productType) {
        query.productType = productType;
      }
      if (sort === "high") {
        sortOptions.productQuantity = -1;
      } else if (sort === "low") {
        sortOptions.productQuantity = 1;
      }
      const result = await mohanobirShikkhaCollection
        .find(query)
        .sort(sortOptions)
        .toArray();

      res.send(result);
    });

    // mohanobir shikkha end here
    // User Api
    app.get("/users", verifyToken, async (req, res) => {
      const result = await assetsOrbitUsersCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);
      res.send(result);
    });
    app.get("/users/employee/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);
      let isEmployee = false;
      if (result) {
        isEmployee = result.role === "employee";
      }
      res.send({ isEmployee });
    });
    app.get("/users/employee-hr/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);

      res.send(result);
    });
    app.get("/users/hr-wise-company/:hr", verifyToken, async (req, res) => {
      const email = req.query.email;
      const hr = req.params.hr;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: hr };
      const result = await assetsOrbitUsersCollection.findOne(query);
      res.send(result);
    });
    app.get("/team/:hr", async (req, res) => {
      const hr = req.params.hr;
      const query = { approvedBy: hr };
      const result = await assetsOrbitUsersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/employee-profile/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);
      res.send(result);
    });
    app.get("/users/hr/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);
      let isHr = false;
      if (result) {
        isHr = result.role === "hr";
      }
      res.send({ isHr });
    });
    app.get("/users/info/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await assetsOrbitUsersCollection.findOne(query);
      let isHr = false;
      if (result) {
        isHr = result.approvedBy === "hr";
      }
      res.send({ isHr });
    });
    app.get("/users/:role", verifyToken, async (req, res) => {
      const role = req.params.role;
      const email = req.query.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { role: role };
      const result = await assetsOrbitUsersCollection.find(query).toArray();

      return res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await assetsOrbitUsersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await assetsOrbitUsersCollection.insertOne(user);
      res.send(result);
    });
    app.post("/assets", verifyToken, async (req, res) => {
      const post = req.body;
      const result = await assetsOrbitAssetCollection.insertOne(post);
      res.send(result);
    });
    app.post("/find-assets", async (req, res) => {
      const { productName, productType, sort, availability } = req.body;
      let query = {};
      let sortOptions = {};
      if (productName) {
        query.productName = { $regex: productName, $options: "i" };
      }
      if (availability === "Available") {
        query.productQuantity = { $gt: 0 };
      } else if (availability === "Out-of-stock") {
        query.productQuantity = { $eq: 0 };
      }
      if (productType) {
        query.productType = productType;
      }
      if (sort === "high") {
        sortOptions.productQuantity = -1;
      } else if (sort === "low") {
        sortOptions.productQuantity = 1;
      }
      const result = await assetsOrbitAssetCollection
        .find(query)
        .sort(sortOptions)
        .toArray();
      result.forEach((item) => {
        item.availability =
          item.productQuantity > 0 ? "Available" : "Out of Stock";
      });
      res.send(result);
    });
    app.post("/my-assets", async (req, res) => {
      const { productName, productType, availability } = req.body;
      const { userEmail } = req.query;
      let query = {};

      if (userEmail) {
        query.userEmail = userEmail;
      }

      if (productName) {
        query.productName = { $regex: productName, $options: "i" };
      }

      if (availability === "Available") {
        query.productQuantity = { $gt: 0 };
      } else if (availability === "Out-of-stock") {
        query.productQuantity = { $eq: 0 };
      }

      if (productType) {
        query.productType = productType;
      }

      const result = await assetsOrbitRequestCollection.find(query).toArray();

      result.forEach((item) => {
        item.availability =
          item.productQuantity > 0 ? "Available" : "Out of Stock";
      });

      res.send(result);
    });
    app.post("/assets-request", verifyToken, async (req, res) => {
      const {
        assetId,
        assetName,
        assetType,
        requestedBy,
        additionalNotes,
        hr,
        user,
        requestDate,
      } = req.body;
      if (req.decoded.email !== user) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const assetRequest = {
        assetId,
        assetName,
        assetType,
        requestedBy,
        additionalNotes,
        hr,
        status: "Pending",
        requestDate,
      };
      const result = await assetsOrbitRequestCollection.insertOne(assetRequest);

      res.send(result);
    });
    app.get("/my-employee", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { approvedBy: email };
      const result = await assetsOrbitUsersCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/assets-request", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { requestedBy: email };
      const result = await assetsOrbitRequestCollection.find(query).toArray();
      res.send(result);
    });
    // asset-request & for find & sorting requested asset from employee
    app.post("/find-assets-request", verifyToken, async (req, res) => {
      const { userEmail, productName, productType, status, page, limit } =
        req.body;

      if (req.decoded.email !== userEmail) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const perPage = parseInt(page) || 1;
      const perLimit = parseInt(limit) || 10;

      let query = { requestedBy: userEmail };

      if (productName) {
        query.assetName = { $regex: productName, $options: "i" };
      }
      if (status) {
        query.status = status;
      }
      if (productType) {
        query.assetType = productType;
      }

      const totalItems = await assetsOrbitRequestCollection.countDocuments(
        query
      );
      const totalPages = Math.ceil(totalItems / perLimit);

      const result = await assetsOrbitRequestCollection
        .find(query)
        .skip((perPage - 1) * perLimit)
        .limit(perLimit)
        .toArray();

      res.send({
        data: result,
        currentPage: perPage,
        totalPages,
        totalItems,
      });
    });

    app.get("/limited-assets/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { listedBy: email, productQuantity: { $lt: 10 } };
      const result = await assetsOrbitAssetCollection
        .find(query)

        .toArray();
      res.send(result);
    });
    app.get("/assets-pending-request/:email", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      // if (req.decoded.email !== email) {
      //   return res.status(403).send({ message: "Forbidden access" });
      // }
      const query = { requestedBy: email, status: "Pending" };
      const totalItems = await assetsOrbitRequestCollection.countDocuments(
        query
      );

      const result = await assetsOrbitRequestCollection
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      res.send({
        data: result,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      });
    });
    app.get(
      "/hr-assets-pending-request/:email",
      verifyToken,
      async (req, res) => {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        const query = { hr: email, status: "Pending" };

        const result = await assetsOrbitRequestCollection
          .find(query)
          .limit(5)
          .toArray();
        res.send(result);
      }
    );
    app.get("/assets-pending-request/month/:email", async (req, res) => {
      const email = req.params.email;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      // if (req.decoded.email !== email) {
      //   return res.status(403).send({ message: "Forbidden access" });
      // }
      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      const formattedStartOfMonth = startOfMonth.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedEndOfMonth = endOfMonth.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const query = {
        requestedBy: email,
        requestDate: {
          $gte: formattedStartOfMonth,
          $lte: formattedEndOfMonth,
        },
      };
      const totalItems = await assetsOrbitRequestCollection.countDocuments(
        query
      );
      const result = await assetsOrbitRequestCollection
        .find(query)
        .sort({ requestDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      res.send({
        data: result,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      });
    });
    app.patch("/return-asset/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const returnedAsset = req.body;
      const email = returnedAsset.returnBy;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const post = {
        $set: {
          returnStatus: returnedAsset.returnStatus,
          returnBy: returnedAsset.returnBy,
        },
      };
      const result = await assetsOrbitRequestCollection.updateOne(
        query,
        post,
        options
      );
      res.json(result);
    });
    app.get("/assets", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = {
        listedBy: email,
      };
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await assetsOrbitAssetCollection.find(query).toArray();
      res.send(result);
    });
    app.patch("/assets/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedAsset = req.body;
      const email = updatedAsset.updatedBy;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const post = {
        $set: {
          productName: updatedAsset.updateProductName,
          productType: updatedAsset.updateProductType,
          productQuantity: updatedAsset.updateProductQuantity,
        },
      };
      const result = await assetsOrbitAssetCollection.updateOne(
        query,
        post,
        options
      );
      res.json(result);
    });
    app.patch("/users/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const approvedEmployee = req.body;
      const email = approvedEmployee.approvedHr;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const post = {
        $set: {
          approvedBy: approvedEmployee.approvedHr,
        },
      };
      const result = await assetsOrbitUsersCollection.updateOne(
        query,
        post,
        options
      );
      res.json(result);
    });
    app.delete("/assets/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await assetsOrbitAssetCollection.deleteOne(query);
      res.json(result);
    });
    app.delete("/assets-request-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assetsOrbitRequestCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
  }
}
run();

app.listen(port, () => {});
