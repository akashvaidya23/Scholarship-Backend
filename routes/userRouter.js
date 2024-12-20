const express = require("express");
const User = require("../models/User");

const {
  handleGetAllUsers,
  handleCreateUser,
  login,
  createAdminUser,
  getUserDetails,
} = require("../controllers/userController");

const router = express.Router();

router.route("/").get((req, resp) => {
  resp.send("Welcome to Scholarship finder");
});

router.route("/api/users").get(handleGetAllUsers).post(handleCreateUser);

router.route("/api/login").post(login);

router.route("/api/user/admin").get(createAdminUser);

router.route("/api/users/details/:id").get(getUserDetails);
module.exports = router;
