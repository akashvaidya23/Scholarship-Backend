const User = require("../models/User");
const bcrypt = require("bcryptjs");
const connection = require("../mySql");

/**
 * Handles GET /api/users
 * Retrieves all users from the database
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */

/**
 * Handles GET /api/users
 * Retrieves all users from the database based on the given role
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */
const handleGetAllUsers = async (req, resp) => {
  let role = req.query.role;

  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Transaction start error" });
    }

    let query = "SELECT * FROM users";
    let queryParams = [];

    if (role) {
      query += " WHERE role = ?";
      queryParams.push(role);
    }

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

/**
 * Handles GET /api/users/details/:id
 * Retrieves a user's details given the ID
 * @param {Object} req - Express request object
 * @param {Object} resp - Express response object
 * @returns {Promise<void>}
 */

const getUserDetails = async (req, resp) => {
  const id = req.params.id;
  connection.beginTransaction((err) => {
    if (err) {
      return resp.status(500).json({ error: "Transaction start error" });
    }
    connection.query(
      "SELECT id, name, aadhar, pan, email, mobile_no, username, role, department, year, gpa, skills, interests, achievements, created_at, updated_at FROM users where id = ?",
      id,
      (err, result) => {
        if (err) {
          return connection.rollback(() => {
            return resp.status(500).json({ error: "Query execution error" });
          });
        }
        connection.commit((err) => {
          if (err) {
            return connection.rollback(() => {
              return resp
                .status(500)
                .json({ error: "Transaction commit error" });
            });
          }
          return resp.status(200).json(result);
        });
      }
    );
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
  try {
    const query = "SELECT * FROM users WHERE username = ? AND role = ?";
    connection.query(query, [username, role], async (err, results) => {
      if (err) {
        return resp
          .status(500)
          .json({ status: false, error: "Database error" });
      }

      if (results.length === 0) {
        return resp
          .status(401)
          .json({ status: false, message: "User not found" });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return resp
          .status(401)
          .json({ status: false, message: "Invalid credentials" });
      }

      let { password: _password, ...userData } = user;
      console.log("results ", userData);
      return resp.status(200).json({
        status: true,
        user: userData,
      });
    });
  } catch (error) {
    console.error("error ", error.message);
    return resp
      .status(500)
      .json({ status: false, error: "Something went wrong" });
  }
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

const updateUser = async (req, resp) => {
  const { id } = req.params;
  console.log(req.params, id);
  const { password, ...otherFields } = req.body;
  let updatedData = { ...otherFields };

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData = { ...updatedData, password: hashedPassword };
    }
    console.log("updatedData ", updatedData, id);

    connection.beginTransaction(async (err) => {
      if (err) {
        console.log(err);
        return resp
          .status(500)
          .json({ status: false, message: "Error starting transaction" });
      }

      try {
        connection.query(
          "UPDATE users SET ? WHERE id = ?",
          [updatedData, id],
          (updateErr, result) => {
            if (updateErr) {
              return connection.rollback(() => {
                if (updateErr.code === "ER_DUP_ENTRY") {
                  return resp
                    .status(400)
                    .json({ status: false, message: "User already exists" });
                }
                console.log(updateErr);
                return resp
                  .status(500)
                  .json({ status: false, message: "Error updating user" });
              });
            }

            console.log("result ", result);

            if (result.affectedRows === 0) {
              return connection.rollback(() => {
                resp.status(400).json({
                  status: false,
                  message: "User not found",
                });
              });
            }

            // Fetch the updated user
            connection.query(
              "SELECT * FROM users WHERE id = ?",
              [id],
              (selectErr, rows) => {
                if (selectErr) {
                  return connection.rollback(() => {
                    console.log(selectErr);
                    return resp.status(500).json({
                      status: false,
                      message: "Error fetching user data",
                    });
                  });
                }

                connection.commit((commitErr) => {
                  if (commitErr) {
                    return connection.rollback(() => {
                      console.log(commitErr);
                      return resp.status(500).json({
                        status: false,
                        message: "Error committing transaction",
                      });
                    });
                  }

                  const { password, ...userData } = rows[0]; // Exclude the password from response
                  resp.status(200).json({ status: true, user: userData });
                });
              }
            );
          }
        );
      } catch (innerErr) {
        console.log(innerErr);
        connection.rollback(() => {
          resp.status(500).json({
            status: false,
            message: "Error updating user",
          });
        });
      }
    });
  } catch (err) {
    console.log(err);
    resp.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

const deleteUser = async (req, resp) => {
  const { id } = req.params;
  if (!id) {
    return resp
      .status(400)
      .json({ status: false, message: "User ID is required" });
  }

  try {
    connection.beginTransaction((err) => {
      if (err) {
        console.log(err);
        return resp
          .status(500)
          .json({ status: false, message: "Error starting transaction" });
      }

      connection.query(
        "SELECT * FROM users WHERE id = ?",
        [id],
        (selectErr, rows) => {
          if (selectErr) {
            return connection.rollback(() => {
              console.log(selectErr);
              return resp.status(500).json({
                status: false,
                message: "Error checking user existence",
              });
            });
          }

          if (rows.length === 0) {
            return connection.rollback(() => {
              resp
                .status(404)
                .json({ status: false, message: "User not found" });
            });
          }

          connection.query(
            "DELETE FROM users WHERE id = ?",
            [id],
            (deleteErr, result) => {
              if (deleteErr) {
                return connection.rollback(() => {
                  console.log(deleteErr);
                  return resp
                    .status(500)
                    .json({ status: false, message: "Error deleting user" });
                });
              }

              if (result.affectedRows === 0) {
                return connection.rollback(() => {
                  resp
                    .status(404)
                    .json({ status: false, message: "User not found" });
                });
              }

              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    console.log(commitErr);
                    return resp.status(500).json({
                      status: false,
                      message: "Error committing transaction",
                    });
                  });
                }

                resp.status(200).json({
                  status: true,
                  message: "User deleted successfully",
                });
              });
            }
          );
        }
      );
    });
  } catch (err) {
    console.log(err);
    resp.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

module.exports = {
  handleGetAllUsers,
  handleCreateUser,
  login,
  createAdminUser,
  getUserDetails,
  updateUser,
  deleteUser,
};
