const express = require('express');
const app = express();
const passport = require('passport');
const session  = require('express-session')
const googleStrategy = require('passport-google-oauth2').Strategy;

//functions : 
const authroutes = require('./src/routes/authroutes.js')
const {dbConnnection} = require('./src/config/dbConnection.js');
dbConnnection();

//middlewares : 
app.use(
  session({
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    keys: [process.env.JWT_SECRET], // Secret key for cookies
  })
);
app.use(passport.initialize());
app.use(passport.session());


//initializing app : 

app.use('/patiofy/user/googleSignup', );
app.use('/patiofy/user/', authroutes);



const port = process.env.PORT;
app.listen(port , () =>{
  console.log(`Server is Running on the port : ${port}`);
})