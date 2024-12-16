const User = require("../models/User");
const bcrypt = require("bcrypt");

const handleGetAllUsers = async (req, resp) => {
  const users = await User.find({}).lean();
  resp.json(users);
};

const handleCreateUser = async (req, resp) => {
  const input = req.body;
  const existingUser = await User.findOne({
    $or: [
      { email: input.email },
      { mobileNo: input.mobileNo },
      { userName: input.userName },
    ],
  });
  if (existingUser) {
    if (existingUser.role === input.role) {
      return resp.status(400).json({
        status: false,
        message: `User already exists with the same email, mobile number, or username and role ${existingUser.role}.`,
      });
    }
    let message = "User  already exists with: ";
    if (existingUser.email == input.email) {
      message += `email ${existingUser.email}, `;
    }
    if (existingUser.mobileNo == input.mobileNo) {
      message += `mobile number ${existingUser.mobileNo}, `;
    }
    if (existingUser.userName == input.userName) {
      message += `username ${existingUser.userName}`;
    }
    message = message.replace(/, $/, "");

    return resp.status(400).json({
      status: false,
      message: message,
    });
  }
  const hashedPassword = await bcrypt.hash(input.password, 10);
  const newInput = { ...input, password: hashedPassword };
  const result = await User.create(newInput);
  const { password, ...userData } = result.toObject();
  try {
    resp.status(201).json({
      status: true,
      user: userData,
      message: "User ceated successfully",
    });
  } catch (err) {
    console.log("Error in saving user ", err);
    resp.status(500).json({ status: false, message: "Error in saving user" });
  }
};

const login = async (req, resp) => {
  const input = req.body;
  console.log(input);

  const user = await User.findOne({
    userName: input.username,
    role: input.role,
  });
  if (!user) {
    return resp.json({ status: false, message: "User not found" });
  }
  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    return resp.json({ status: false, message: "Invalid password" });
  }
  const { password, ...userData } = user.toObject();
  return resp.json({ status: true, user: userData });
};

const createAdminUser = async (req, resp) => {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const newInput = {
      name: "Admin",
      email: "admin@gmail.com",
      mobileNo: "1234568753",
      userName: "admin",
      role: "admin",
      password: hashedPassword,
    };
    const result = await User.create(newInput);
    const { password, ...userData } = result.toObject();
    return resp.json({ status: true, user: userData });
  } catch (err) {
    console.log(err);
    resp.status(500).json({ status: false, message: "Error in saving admin" });
  }
};

module.exports = {
  handleGetAllUsers,
  handleCreateUser,
  login,
  createAdminUser,
};
