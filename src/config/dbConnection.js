const mongoose = require("mongoose");
require("dotenv").config();

const dbConnnection = async () => {
  try {
    const mongoURI =
      process.env.NODE_ENV === "production"
        ? process.env.MONGODB_PRODUCTION
        : process.env.MONGODB_LOCAL;

    await mongoose.connect(mongoURI, {
      maxPoolSize: 20,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = { dbConnnection };



// .env
// MONGO_URI=mongodb://localhost:27017/restro
// PORT=3005 

// config>db.js

// const mongoose = require('mongoose');
// const connectDB = async()=>{
//     try{
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("Mongodb Connected !!")
//     }
//     catch(error){
//         console.log('mongo failed',error)
//         process.exit(1);
//     }
// }
// module.exports = connectDB;



// server.js 

// require('dotenv').config();
// const app= require('./app')
// const connectDB = require('./config/db')
// connectDB();

// const port = process.env.PORT || 3009

// app.listen(port,()=>{
//     console.log(`server started and running at ${port}`)
// })
