const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendEmail.js");
const { conformSignup } = require('../utils/emailTemplates.js');

const userschema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    profileUrl: { 
      type: String, 
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: [true, "email is already taken"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
      minlength: [8, "Password should be at least 8 characters long"],
      trim: true,
      validate: {
        validator: function (value) {
          // Skip validation if password is already hashed
          if (value.startsWith("$2b$")) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    phone : {
      type: Number,
    },
    Address: {
      type: String,
    },
    status: {
      type: String,
      enum: ["inactive", "active", "Blocked"],
      default: "inactive",
      trim: true,
    },
    verify_expiry: {
      type: Date,
    },
    isTermsAndConditions : {
      type : Boolean,
      default: false
    },
    accountType: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    password_attempts: {
      type: Number,
      default: 3,
    }
  },
  { timestamps: true }
);

//compare the password  :
userschema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

//send the verification mail every time when email get updated :
userschema.pre("save", async function (next) {
  if(this.googleId === undefined){
    if (this.isModified("email")) {
      const encodedId = Buffer.from(this._id.toString(), "utf-8").toString("base64");
      this.verify_expiry = Date.now() + 30 * 60 * 1000;
      this.status = 'inactive';
      const fullname = this.firstname + this.lastname
      await sendEmail({
        to: this.email,
        subject: "Account verification",
        text: conformSignup(fullname, encodedId),
      });
    }
  }
  next();
});

//hash all in comming password Strings :
userschema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("users", userschema);
