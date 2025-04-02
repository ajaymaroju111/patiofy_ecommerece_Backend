const mongoose = require('mongoose');
require('dotenv').config();


exports.dbConnnection = async() =>{
  try {
    await mongoose.connect(process.env.MONGODB_URL,
    {
      maxPoolSize : 500,
    })
    console.log("MongoDB Connected Successfully")
  } catch (error) {
    console.log("mongodb connection error" , error);
    process.exit(1);
  }
}