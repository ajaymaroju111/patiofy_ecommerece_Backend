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
  getOrderById,
} = require('../controllers/ordersControllers.js');

router.post('/verify-payment', authenticate, verifyPayment);
router.put('/cancel/:id', authenticate, cancelOrder);
router.get('/myorders', authenticate, viewAllOrders); 
router.put('/shipaddress/:id', authenticate, addShippingAddress);
router.put('/billaddress/:id', authenticate, addbillingAddress);
router.get('/lastaddress', authenticate, getLastAddress);
router.post('/:id', authenticate, makeOrder);
router.get('/:id', authenticate, getOrderById);


// payment routes : 
module.exports = router;