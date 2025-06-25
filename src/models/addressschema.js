const mongoose = require("mongoose");

const addressSchaema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    country: {
      type: String,
      required: [true, "country name is required"],
      default: "India",
    },
    firstname: {
      type: String,
      required: [true, "firstname is required"],
    },
    lastname: {
      type: String,
      required: [true, "lastname is required"],
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    pincode: {
      type: Number,
      required: [true, "pincode is required"],
    },
    house_number: {
      type: String,
      required: [true, "House number details are required"],

    },
    city: {
      type: String,
      required: [true, "city name is required"],
    },
    state: {
      type: String,
      required: [true, "state is required"],
    },
    landmark : {
      type: String,
      required: [true, "landmark is required"]
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isBilling: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("userAddresses", addressSchaema);
