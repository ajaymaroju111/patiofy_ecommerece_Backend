const mongoose = require("mongoose");
require("dotenv").config();

exports.dbConnnection = async () => {
  try {
    const dbURI =
      process.env.NODE_ENV === "production"
        ? process.env.MONGODB_PRODUCTION
        : process.env.MONGODB_LOCAL;

    await mongoose.connect(dbURI, {
      maxPoolSize: 500,
    });
    console.log("MongoDB Connected Successfully ✅");
  } catch (error) {
    console.log("mongodb connection error ❌", error);
    process.exit(1);
  }
};
