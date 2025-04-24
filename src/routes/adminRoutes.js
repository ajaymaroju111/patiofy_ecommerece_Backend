const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const productmages = upload.array('images' , 10);
const {
  setDiscountOnProduct,
  setUserInactive,
  viewAllUsers,
  viewUser,
  publishProduct,
  unPublishProduct,

  viewAllInProgressOrders,
  viewAllRefundedOrders,
  viewAllCancelledOrders,
  viewAllCompletedOrders,
  viewAllSuccessPaymentOrders,
  viewAllUnSuccessPaymentOrders,
  removeDiscountOnProduct,
  viewAllPendingOrders,
  findBestSellerProducts
} = require('../controllers/adminControllers.js')
const {
  authenticate,
  isAdmin,
} = require('../middlewares/authUser.js');
const {
  myProducts,
  getById,

} = require('../controllers/userControllers.js');
const {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  filterProducts,
} = require('../controllers/productControllers.js');



//Users Management : 
router.post('/users',authenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);


//products Management :  
router.post('/product', authenticate, isAdmin, productmages, createProduct);
router.get('/allproducts', authenticate, isAdmin, getAllProducts);
router.get('/products/filter', authenticate, isAdmin, filterProducts);
router.get('/product/:id', authenticate, isAdmin, getProductById);
router.put('/product/:id', authenticate, isAdmin, updateProduct);
router.delete('/product/:id', authenticate, isAdmin, deleteProduct);

//set publish and unpublish the users : 
router.put('/product/publish/:id', authenticate, isAdmin,publishProduct );
router.put('/product/unpublish/:id', authenticate, isAdmin,unPublishProduct);

//discount Management:
router.put('/product/discount/:id', authenticate, isAdmin, setDiscountOnProduct);
router.put('/product/undiscount/:id', authenticate, isAdmin, removeDiscountOnProduct);

//orders Management: 
router.get('/orders/inprogress', authenticate, isAdmin, viewAllInProgressOrders );
router.get('/orders/refund', authenticate, isAdmin, viewAllRefundedOrders);
router.get('/orders/cancelled', authenticate, isAdmin, viewAllCancelledOrders);
router.get('/orders/success', authenticate, isAdmin, viewAllCompletedOrders);
router.get('/orders/pending', authenticate, isAdmin, viewAllPendingOrders);

//Payment Management : 
router.get('/payment/success', authenticate, isAdmin, viewAllSuccessPaymentOrders);
router.get('/payment/pending', authenticate, isAdmin, viewAllUnSuccessPaymentOrders);

// /admin account Management : 
router.get('/myProducts',authenticate, isAdmin, myProducts);
router.get('/:id',  authenticate, isAdmin, getById);

module.exports = router;