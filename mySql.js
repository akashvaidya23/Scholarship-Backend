const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test-scholarship",
});

connection.connect((err) => {
  if (err) {
    console.log("Error ", err);
  } else {
    console.log("Connected");
  }
});

module.exports = connection;
