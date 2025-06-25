const mongoose = require('mongoose');

// const reviewSchema = new mongoose.Schema({
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'products', // optional: if you have a products collection
//   },
//   userId: {
//     type: [mongoose.Schema.Types.ObjectId],
//     ref: 'users', // optional: if you have a users collection
//     default: [],
//   },
//   messagees: {
//     type: String,
//   },
//   r5: {
//     data: {
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   r4: {
//     data: {
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   r3: {
//     data: {
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   r2: {
//     data: {
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   r1: {
//     data: {
//       count: {
//         type: Number,
//         default: 0,
//       },
//     },
//   },
//   finalRating: {
//     type: Number,
//     default: 0,
//   },
// },
// { timestamps: true }
// );
const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'products',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  message : {
    type: String,
  },
  rating : {
    type: Number,
    default: 0,
  }
},
{ timestamps: true }
);



module.exports = mongoose.model('reviews', reviewSchema);
