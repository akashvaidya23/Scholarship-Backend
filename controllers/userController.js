const User = require("../models/User");
const bcrypt = require("bcrypt");
const connection = require("../mySql");

const handleGetAllUsers = async (req, resp) => {
  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Transaction start error" });
    }
    connection.query("SELECT * FROM users", (err, result) => {
      if (err) {
        return connection.rollback(() => {
          return resp.status(500).json({ error: "Query execution error" });
        });
      }
      connection.commit((err) => {
        if (err) {
          return connection.rollback(() => {
            return resp.status(500).json({ error: "Transaction commit error" });
          });
        }
        return resp.status(200).json(result);
      });
    });
  });
};

const handleCreateUser = async (req, resp) => {
  let data = req.body;
  let hashedPassword = await bcrypt.hash(data.password, 10);
  data = { ...data, password: hashedPassword };

  connection.beginTransaction(async (err) => {
    if (err) {
      console.log(err);
      return resp
        .status(500)
        .json({ status: false, message: "Error starting transaction" });
    }

    try {
      connection.query(
        "INSERT INTO users SET ?",
        data,
        (err, result, fields) => {
          if (err) {
            return connection.rollback(() => {
              if (err.code === "ER_DUP_ENTRY") {
                return resp
                  .status(400)
                  .json({ status: false, message: "User already exists" });
              }
              console.log(err);
              return resp
                .status(500)
                .json({ status: false, message: "Error in saving user" });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                console.log(err);
                return resp.status(500).json({
                  status: false,
                  message: "Error committing transaction",
                });
              });
            }
            resp.status(201).json({ status: true, user: result });
          });
        }
      );
    } catch (err) {
      connection.rollback(() => {
        resp
          .status(500)
          .json({ status: false, message: "Error in saving user" });
      });
    }
  });
};

const login = async (req, resp) => {
  const { username, password, role } = req.body;
  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Failed to start transaction" });
    }
    const query = "SELECT * FROM users WHERE username = ? AND role = ?";
    connection.query(query, [username, role], (err, results) => {
      if (err) {
        return connection.rollback(() => {
          return resp.status(500).json({ error: "Database error" });
        });
      }
      if (results.length === 0) {
        return connection.rollback(() => {
          return resp
            .status(401)
            .json({ status: false, message: "User not found" });
        });
      }
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return connection.rollback(() => {
            return resp
              .status(500)
              .json({ status: false, error: "Something went wrong" });
          });
        }

        if (!isMatch) {
          return connection.rollback(() => {
            return resp
              .status(401)
              .json({ status: false, error: "Invalid credentials" });
          });
        }

        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              console.log("Commit failed:", err);
              return resp.status(500).json({ error: "Commit failed" });
            });
          }

          const { password, ...userData } = user;
          return resp.status(200).json({
            status: true,
            user: userData,
          });
        });
      });
    });
  });
};

const createAdminUser = async (req, resp) => {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 10);
    const newInput = {
      name: "Admin",
      email: "admin@gmail.com",
      mobile_no: "1234568753",
      username: "admin",
      role: "admin",
      password: hashedPassword,
    };
    connection.query(
      "INSERT into users SET ?",
      newInput,
      (err, result, fields) => {
        if (err) {
          console.log("Admin error ", err);

          return resp.status(400).json({
            status: false,
            message: "Error in saving admin",
          });
        }
        resp.status(201).json({ status: true, user: result });
      }
    );
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
