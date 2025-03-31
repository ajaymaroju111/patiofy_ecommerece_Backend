const mongoose = require('mongoose');
const users = require('./userschema.js');



const postSchema = new mongoose.Schema({
  userId :  { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users',
  },
  postImages :[
    {
      name : String,
      img : {
        data : Buffer,
        contentType : String,
      }
    }
  ],
  name : {
    type : String,
    required : [true , "product name is required"],
  },
  description : {
    type : String,
    required : [true , "DProduct Description is required "],
  },
  price : {
    type : Number,
    require : [true, "price shouls not be empty for the post"]
  },
} , {timestamps : true});


module.exports = mongoose.model('posts', postSchema);
