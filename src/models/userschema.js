const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendEmail.js");
const { conformSignup } = require('../utils/emailTemplates.js');
const crypto = require('crypto');

const userschema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    avatar: {
      name: String,
      img: {
        data: Buffer,
        contentType: String,
        hash : String,
      },
    },
    firstname: {
      type: String,
      required: [true, "firstname is Mandatory"],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, "lastname is required"],
      trim: true,
    },
    username: {
      type: String,
      minlength: [4, "user name should be greater than 4 characters"],
      required: [true, "username is required"],
      trim: true,
      unique: [true, "username is already taken"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      unique: [true, "email is already taken"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      // required: [true, "phone number is required"],
      // maxlength: 10,
      // minlength: 10,
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
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value
          );
        },
        message:
          "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.",
      },
    },
    status: {
      type: String,
      enum: ["inactive", "active"],
      default: "inactive",
      trim: true,
    },
    expirytime: {
      type: Date,
    },
    jwtExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
);

//compare the password  :
userschema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

//Hash all the incomming images :


userschema.pre("save", async function (next) {
  if (this.isModified("avatar") && this.avatar?.img?.data) {
    const hash = crypto
      .createHash("sha256")
      .update(this.avatar.img.data)
      .digest("hex");

    // Store the hash alongside the image data (or however you want)
    this.avatar.img.hash = hash;
  }
  next();
});


//send the verification mail every time when email get updated :
userschema.pre("save", async function (next) {
  if(this.googleId === undefined){
    if (this.isModified("email")) {
      const encodedId = Buffer.from(this._id.toString(), "utf-8").toString("base64");
      this.expirytime = Date.now() + 30 * 60 * 1000;
      this.status = 'inactive';
      await sendEmail({
        to: this.email,
        subject: "Account verification",
        text: conformSignup(this.username, encodedId),
      });
      console.log('Email updated in the DB, EncodedID : ', encodedId);
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
