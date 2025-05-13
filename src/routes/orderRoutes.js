const express= require('express');
const { authenticate } = require('../middlewares/authUser');
const router = express.Router();
const {
  makeOrder,
  cancelOrder,
  // makeOrderWithoutCart,
  addShippingAddress,
  addbillingAddress,
  viewAllOrders,
  verifyPayment,
  getLastAddress,
} = require('../controllers/ordersControllers.js');

//add cart to the orders : 
//add product to product without
// router.post('/:id', authenticate, makeOrderWithoutCart);
//cancel the order : 
router.post('/verify-payment', authenticate, verifyPayment);
router.put('/cancel/:id', authenticate, cancelOrder);
router.get('/myorders', viewAllOrders);   //this is public access of everyones order : 
// router.get('/myorders', authenticate, viewAllOrders);
router.put('/shipaddress/:id', authenticate, addShippingAddress);
router.put('/billaddress/:id', authenticate, addbillingAddress);
router.get('/lastaddress', authenticate, getLastAddress);
router.post('/:id', authenticate, makeOrder);


// payment routes : 
module.exports = router;