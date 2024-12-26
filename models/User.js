const { default: mongoose } = require("mongoose");

// schema
const UserSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

UserSchema.index(
  { email: 1, mobileNo: 1, userName: 1, role: 1 },
  { unique: true }
);

// model
const User = mongoose.model("User", UserSchema);

module.exports = User;
