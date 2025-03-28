const express = require('express');


//imporing : 
const authroutes = require('./src/controllers/authroutes.js')




//initializing app : 
const app = express();

app.use('/patiofy/user/', authroutes);