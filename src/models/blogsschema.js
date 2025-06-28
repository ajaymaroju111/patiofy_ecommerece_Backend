const mongoose = require('mongoose');

const blogsSchema = new mongoose.Schema({
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  blogimage : {
    type : String,
    required: true,
  },
  heading : {
    type: String,
    required: true,
  },
  content: {
    type : String,
    required: true,
  }
},{timestamps: true});

module.exports = mongoose.model('blogs', blogsSchema);