const express = require('express');
const router = express.Router();
const {} = require('../controllers/authroutes.js');
const { authenticate } = require('../middlewares/verification.js');



//OAuth2 authentication  : 
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const users = require('../models/userschema.js');


//using goolge functionality : 
passport.use(
  new GoogleStrategy(
    {
      clientID : process.env.GOOGLE_CLIENT_ID,
      clientSecret : process.env.GOOGLE_SECRET_KEY,
      callbackURL : "/auth/google/callback",
    },
    async (accessToken , refreshToken, profile, done) =>{
      try {
        const User = await users.findOne({ googlrId : profile.id});
        if(!User){
          const User = await users.create({
            googlrId : profile.id,
            username : profile.displayName,
            email : profile.emails[0].value,
            avatar : profile.photos[0].value,
            status : 'active',
          });
        }
        return done(null , User)
      } catch (error) {
        console.log(error);
        return done(error , null);
      }
    }
  )
)

//serialize and deserialize users : 
passport.serializeUser((User , done) =>{
  done(null , User.id);
});

passport.deserializeUser(async(id, done) =>{
  const User = await users.findById(id);
  done(null, User);
})


//user Routes : 
router('/register' , );
router(
  '/google',
  passport.authenticate('google' , {failureRedirect : '/Patiofy/auth/register'}),
  (ewq , res) =>{
    return res.status(200).json({
      success : true,
      message : "user authenticated using google"
    })
  }
)



module.exports = router;





