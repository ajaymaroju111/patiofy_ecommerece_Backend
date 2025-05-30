const mongoose = require('mongoose');
require('dotenv').config();

const dbConnnection = async () => {
  try {
    const mongoURI =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_PRODUCTION
        : process.env.MONGODB_LOCAL;

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = { dbConnnection };
