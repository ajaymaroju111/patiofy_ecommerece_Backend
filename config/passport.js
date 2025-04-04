const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const users = require("../src/models/userschema.js");
const jwt = require('jsonwebtoken');

// Google OAuth Strategy : 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_KEY,
      callbackURL: process.env.CALLBACK_URL, // Redirect URL set in Google Console
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let User = await users.findOne({ googleId: profile.id }); //

        if (!User) {
          User = await users.create({
            googleId: profile.id, //  must exist in db
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            status: "active",
            accessToken, // Optional: Storing tokens in DB is not recommended
            refreshToken,
          });
        }

        // Generate a JWT token
        const token = jwt.sign(
          { id: User._id, email: User.email },
          process.env.JWT_SECRET,
          { expiresIn: "1d" },
        );

        return done(null, { User, token }); //  Ensure correct return format
      } catch (error) {
        console.log("OAuth Error", error);
        return done(error, null);
      }
    }
  )
);

//serialize and deserialize users :
passport.serializeUser((User, done) => {
  done(null, User.id);
});

passport.deserializeUser(async (id, done) => {
  const User = await users.findById(id);
  done(null, User);
});
