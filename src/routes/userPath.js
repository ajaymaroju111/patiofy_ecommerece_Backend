const express = require('express');
const router = express.Router();
const { signUp,
  verify,
  signIn,
  getById,
  frogetUsername,
  forgetPassword,
  resetPassword,
  update,
  myProducts,
  contactForm,
  signOut,
  deleteUser,
  filterProducts,

} = require('../controllers/authroutes.js');
const { authenticate } = require('../middlewares/authUser.js');

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
            accessToken,
            refreshToken
          });
          User.accessToken = accessToken;
          User.refreshToken = refreshToken;
        }
        return done(null, User);
      } catch (error) {
        console.log(error);
        return done(error, null);
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
router.post('/user/signup' , signUp);
router.post(
  '/google',
  passport.authenticate('google' , {failureRedirect : '/Patiofy/auth/register'}),
  (req , res) =>{
    return res.status(200).json({
      success : true,
      message : "user authenticated using google"
    })
  }
)
router.post('/user/verification', verify);
router.post('/user/signin', signIn);
router.get('/user/:id', getById);
router.put('/user/forgetusername',frogetUsername);
router.put('/user/forgetPassword', forgetPassword);
router.put('/user/resetpassword', resetPassword);
router.put('/user/{update}' , update);
router.get('/user/products' , myProducts);
router.post('/submitform', contactForm);
router.delete('/user/delete', deleteUser);
router.get('/user/filter', filterProducts);
router.put('/user/logout', signOut);



module.exports = router;





