const express= require('express');
const { authenticate } = require('../middlewares/authUser');
const router = express.Router();
const {
  makeOrder,
  cancelOrder,
  makeOrderWithoutCart
} = require('../controllers/ordersControllers.js');

//add cart to the orders : 
router.post('/cart/:id', authenticate, makeOrder);
//add product to product without
router.post('/:id', authenticate, makeOrderWithoutCart);

//cancel the order : 
router.put('/cancel/:id', authenticate, cancelOrder);

module.exports = router;