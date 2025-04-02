const express = require('express');
const app = express();
const Limiter = require('express-rate-limit');
const cors = require('cors');
const passport = require('passport');
const session  = require('express-session');
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const SwaggerDocument = YAML.load('./api.yaml');
const bodyParser = require('body-parser')

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

//usage od limiter : 
const limiter = Limiter({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});
app.use(limiter);
app.use(bodyParser.json());

//enable CORS : 
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['content-type', 'Authorization']
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({
  extended : true,
}))


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