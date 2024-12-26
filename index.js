const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const PORT = 8080;
const User = require("./models/User");
const { connectMongoDB } = require("./mongoose");
const userRouter = require("./routes/userRouter");
const connection = require("./mySql");
const app = express();

// Server Starting
app.listen(PORT, () => {
  console.log(`Server srated at port ${PORT}`);
});

// Middlewares for accessing body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
// connectMongoDB("mongodb://127.0.0.1:27017/students-scholarship")
//   .then(() => {
//     console.log("Mongo Connected successfully");
//   })
//   .catch((err) => {
//     console.log("Mongo Connection failed ", err);
//   });

// Routes for CORS
app.use(
  cors({
    origin: [`http://localhost:5173`, "http://localhost:8080/"],
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080/"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use("/", userRouter);
