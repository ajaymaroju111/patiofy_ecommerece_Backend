const express = require('express');
const app = express();
const Limiter = require('express-rate-limit');
const cors = require('cors');
const passport = require('passport');
const session  = require('express-session');
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const SwaggerDocument = YAML.load('./api.yaml');

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

//enable CORS : 
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['content-type', 'Authorization']
}));
app.use(passport.initialize());
app.use(passport.session());


//initializing app : 
app.use('/patiofy/auth/user', authroutes);
app.use('/patiofy/auth/products', postroutes);


//usage of swagger eith yaml code : 
app.use('/api-docs', swaggerUI.serve , swaggerUI.setup(SwaggerDocument));




const port = process.env.PORT;
app.listen(port , () =>{
  console.log(`Server is Running on the port : ${port}`);
  console.log(`Swagger - Docs are running on http://localhost:${port}/api-docs`);
})