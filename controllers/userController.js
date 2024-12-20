const User = require("../models/User");
const bcrypt = require("bcrypt");
const connection = require("../mySql");

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Handles GET /api/users
 * Retrieves all users from the database
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */

/******  aa49ec81-c45b-44ec-99e7-5e1a195cefd0  *******/
const handleGetAllUsers = async (req, resp) => {
  let role = req.query.role; // Get the role query parameter
  console.log(role);

  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Transaction start error" });
    }

    // Build the query dynamically based on the presence of the role parameter
    let query = "SELECT * FROM users";
    let queryParams = [];

    if (role) {
      query += " WHERE role = ?";
      queryParams.push(role);
    }
    query += " WHERE role != 'admin'";
    queryParams.push(role);

    connection.query(query, queryParams, (err, result) => {
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

const getUserDetails = async (req, resp) => {
  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Transaction start error" });
    }
    connection.query("SELECT * FROM users where id = ?", id, (err, result) => {
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

/**
 * Handles POST /api/users
 * Creates a new user in the database
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */
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
      connection.query("INSERT INTO users SET ?", data, (err, result) => {
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

        // Fetch the newly registered user data
        connection.query(
          "SELECT * FROM users WHERE id = ?",
          [result.insertId],
          (err, rows) => {
            if (err) {
              return connection.rollback(() => {
                console.log(err);
                return resp.status(500).json({
                  status: false,
                  message: "Error fetching user data",
                });
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
              const { password, ...userData } = rows[0];
              resp.status(201).json({ status: true, user: userData });
            });
          }
        );
      });
    } catch (err) {
      connection.rollback(() => {
        resp
          .status(500)
          .json({ status: false, message: "Error in saving user" });
      });
    }
  });
};

/**
 * Handles POST /api/login
 * Logs in an existing user
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */
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

/**
 * Handles GET /api/user/admin
 * Creates a new admin user in the database
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */
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
  getUserDetails,
};
