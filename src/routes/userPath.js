const express = require('express');
const router = express.Router();
const upload = require("../middlewares/multer.js")
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
const { 
  authenticate,
 } = require('../middlewares/authUser.js');

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
});


//user Routes : 
router.route('/google').post(passport.authenticate('google' , {scope : ['profile' , 'email']}));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }), 
  (req, res) => {
    //generate a token after authentication : 
    const token = (req.user);
    res.cookie('token' , token, {
      httpOnly : true,
      secure : process.env.NODE_ENV === 'production',
      sameSite : true,
      maxAge : 24*60*60*1000
    });

    res.status(200).json({
      success : true,
      token,
    });
  }
);
router.route('/signup').post(upload.single('profilePhoto'), signUp).put(verify);
router.route('/signin').post(signIn);
router.route('/me').get(authenticate, getById);
router.route('/username/forget').get(frogetUsername);
router.route('/password/forget').put(forgetPassword);
router.route('/password/reset').put(resetPassword);
router.route('/products/:id').get(authenticate, myProducts);
router.route('/submitform').post(authenticate, contactForm);
router.route('/delete').delete(authenticate, deleteUser);
router.route('/filter').get(filterProducts);
router.route('/logout').put(authenticate, signOut);
router.route('/me/:id').put(authenticate, update);

module.exports = router;





