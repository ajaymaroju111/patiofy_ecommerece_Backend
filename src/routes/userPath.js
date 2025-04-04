const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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
  addAddress,
  updateAddress,
  getAddress,
  deleteAddress,
  viewAllAddresses,
  contactUs,
  resend
  
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
      callbackURL : 'http://localhost:3001/auth/google/callback', //this should be redirected from the google console : 
    },
    async (accessToken , refreshToken, profile, done) =>{
      try {
        const User = await users.findOne({ googlrId : profile.id});
        if(!User){
          const User = await users.create({
            googleId : profile.id,
            username : profile.displayName,
            email : profile.emails[0].value,
            avatar : profile.photos[0].value,
            status : 'active',
            accessToken,
            refreshToken,
          });
        }
        //generate a jwt token : 
        const token = jwt.sign(
          {id : User._id, email: User.email},
          process.env.JWT_SECRET,
          {expiresIn: '1d'}
        )

        return done(null, {User, token});
      } catch (error) {
        console.log("OAuth Error", error);
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
router.route('/google').get(passport.authenticate('google' , {scope : ['profile' , 'email']}));
router.route('/google/callback').get(passport.authenticate('google', { failureRedirect: '/' }), 
  (req, res) => {
    //generate a token after authentication : 
    const token = (req.user);
    res.cookie('token' , token, {
      httpOnly : true,
      secure : true,
      sameSite : true,
      maxAge : 24*60*60*1000
    });
    res.status(200).json({
      success : true,
      token,
    });
  }
);
router.route('/signup').post(upload.single('profilePhoto'), signUp).get(verify);
router.route('/resend').post(resend);
router.route('/signin').post(signIn);
router.route('/me/:id').get(authenticate, getById);
router.route('/username/forget').get(frogetUsername);
router.route('/password/forget').put(forgetPassword);
router.route('/password/reset').put(resetPassword);
router.route('/products/:id').put(authenticate, upload.single("avatar"), update).get(authenticate, myProducts);
router.route('/submitform').post(authenticate, contactForm);
router.route('/delete').delete(authenticate, deleteUser);
router.route('/filter').get(filterProducts);
router.route('/logout').put(authenticate, signOut);
//address form : 
router.route('/address').post(authenticate, addAddress)
router.route('/address/:id').put(authenticate, updateAddress).get(authenticate, getAddress).delete(authenticate, deleteAddress);
router.route('/adress/list').get(authenticate, viewAllAddresses);

//Contact _ Us 
router.route('/feedback').post(authenticate, contactUs);
module.exports = router;





