const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'posts', // optional: if you have a posts collection
  },
  userId: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: 'users', // optional: if you have a users collection
    default: [],
  },
  r5: {
    data: {
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  r4: {
    data: {
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  r3: {
    data: {
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  r2: {
    data: {
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  r1: {
    data: {
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  finalRating: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('reviews', reviewSchema);
