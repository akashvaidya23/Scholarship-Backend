const express = require("express");
const User = require("../models/User");

const {
  handleGetAllUsers,
  handleCreateUser,
  login,
  createAdminUser,
  getUserDetails,
  deleteUser,
  updateUser,
} = require("../controllers/userController");

const router = express.Router();

router.route("/").get((req, resp) => {
  resp.send("Welcome to Scholarship finder");
});

router.route("/api/users").get(handleGetAllUsers).post(handleCreateUser);

router.route("/api/login").post(login);

router.route("/api/user/admin").get(createAdminUser);

router
  .route("/api/users/:id")
  .get(getUserDetails)
  .patch(updateUser)
  .delete(deleteUser);
module.exports = router;
