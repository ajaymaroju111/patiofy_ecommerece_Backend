const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  categery_name : {
    type: String,
    unique: true,
  }
}, {timestamps: true});

module.exports = mongoose.model('categories', CategorySchema);