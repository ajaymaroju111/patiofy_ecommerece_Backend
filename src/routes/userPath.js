const express = require('express');
const router = express.Router();
const {} = require('../controllers/authroutes.js');
const {authenticate} = require('../middlewares/verification.js');


//user Routes : 
router.route('/register').post(authenticate)


module.exports = router;





