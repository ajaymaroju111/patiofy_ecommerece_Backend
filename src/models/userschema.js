const mongoose = require('mongoose');
const bcrypt = require('bcrypt')




const userschema = new mongoose.Schema({
  googlrId : {
    type : String,
  },
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
    minlength: [4 , "user name should be greater than 4 characters"],
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
  phone : {
    type : String,
    required : [true , "phone number is required"],
    maxlength : 10,
    minlength : 10,
  },
  password: {
    type: String,
    select: false,
    required: [true, "Password is required"],
    minlength: [8, "Password should be at least 8 characters long"],
    trim: true,
    validate: {
      validator: function (value) {
        // Skip validation if password is already hashed
        if (value.startsWith("$2b$")) return true;
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      },
      message: "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
    }
  },  
  status : {
    type : String,
    enum : ['inactive', 'active'],
    default : 'inactive',
    trim : true,
  },
  accessToken : {
    type : String,

  },
  refreshToken : {
    type: String,
    
  },
  expirytime : {
    type : Date,
    default : (Date.now() + 30*60*1000),
  },
  jwtExpiry : {
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