const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = 8080;

// connection to mongoose

mongoose
  .connect("mongodb://127.0.0.1:27017/students-scholarship")
  .then(() => {
    console.log("Mongo connected");
  })
  .catch((err) => {
    console.log("Mongo Error ", err);
  });

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8080"],
  })
);

app.listen(PORT, () => {
  console.log(`Server srated at port ${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobileNo: {
    type: Number,
    required: true,
    unique: true,
    size: 10,
  },
  userName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

// model
const User = mongoose.model("User", UserSchema);

app.get("/", (req, resp) => {
  resp.send("Welcome to Scholarship finder");
});

app
  .route("/api/users")
  .get(async (req, resp) => {
    const users = await User.find({}).lean();
    resp.json(users);
  })
  .post(async (req, resp) => {
    const input = req.body;
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      return resp.status(400).json({
        status: false,
        message: `User with this email already exists having username ${existingUser.userName}`,
      });
    }
    const result = await User.create(input);
    try {
      resp.json({
        status: true,
        userId: result.id,
        message: "User ceated successfully",
      });
    } catch (err) {
      console.log("Error in saving user ", err);
      resp.status(500).json({ status: false, message: "Error in saving user" });
    }
  });
