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
} = require('../controllers/ordersControllers.js');

//add cart to the orders : 
//add product to product without
// router.post('/:id', authenticate, makeOrderWithoutCart);
//cancel the order : 
router.put('/cancel/:id', authenticate, cancelOrder);
router.get('/myorders', authenticate, viewAllOrders);
router.put('/shipaddress/:id', authenticate, addShippingAddress);
router.put('/billaddress/:id', authenticate, addbillingAddress);
router.post('/:id', authenticate, makeOrder);

module.exports = router;