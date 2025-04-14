const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId
  },
  userId: {
    type: [mongoose.Schema.Types.ObjectId],
  },
  r5:{
    data:{
      messages : [String],
      count: Number,
    },
  },
  r4:{
    data:{
      messages : [String],
      count: Number,
    },
  },
  r3:{
    data:{
      messages : [String],
      count: Number,
    },
  },
  r2:{
    data:{
      messages : [String],
      count: Number,
    },
  },
  r1:{
    data:{
      messages : [String],
      count: Number,
    },
  },
  finalRating : {
    type: Number,
    default: 0,
  }
  
})

module.exports = mongoose.model('reviews', reviewSchema);