const mongoose = require('mongoose');
const bcrypt = require('bcrypt')




const userschema = new mongoose.Schema({
  avatar : {
    name : String,
    img :{
      data : Buffer,
      contentType : String,
    },
  },
  firstname : {
    type : String,
    required : [true , "firstname is Mandatory"],
    trim : true,
  },
  lastname : {
    type : String,
    required : [true , "lastname is required"],
    trim : true
  },
  username : {
    type : String,
    required : [true , "username is required"],
    trim : true,
    unique : [true , "username is already taken"],
  },
  email : {
    type : String,
    required : [true , "email is required"],
    trim : true,
    unique : [true , "email is already taken"],
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  password : {
    type : String,
    select : false,
    required : [true , "password is required"],
    minlength: [8 , "password should be atleast 8 characters"],
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.'
    ]
  },
  status : {
    type : String,
    enum : ['inactive', 'active'],
    default : 'inactive',
    trim : true,
  },
  expirytime : {
    type : Date,
  }
} , {timestamps : true});


//compare the password  : 
userschema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password)
};


//hash all in comming password Strings : 
userschema.pre('save' , async function (next) {
  if(this.isModified('password')){
    this.password = await bcrypt.hash(this.password , 10);
  }
  next();
});

module.exports = mongoose.model('users' , userschema);