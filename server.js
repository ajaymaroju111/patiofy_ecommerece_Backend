const express = require('express');
const app = express();
const passport = require('passport');
const session  = require('express-session');


//functions : 
const authroutes = require('./src/routes/userPath.js');
const postroutes = require('./src/routes/productPaths.js');
const {dbConnnection} = require('./src/config/dbConnection.js');
dbConnnection();

app.use(
  session({
    secret: process.env.JWT_SECRET, // Secret key for signing the session ID cookie
    resave: false, // Don't save session if it wasn't modified during the request
    saveUninitialized: false, // Don't save uninitialized sessions (good for login scenarios)
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Set cookie expiration time (1 day)
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());


//initializing app : 
app.use('/patiofy/auth/user', authroutes);
app.use('/patiofy/auth/products', postroutes);




const port = process.env.PORT;
app.listen(port , () =>{
  console.log(`Server is Running on the port : ${port}`);
})