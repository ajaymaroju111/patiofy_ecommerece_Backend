const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const productmages = upload.array('images', 10);
const {
  setDiscountOnProduct,
  setUserInactive,
  viewAllUsers,
  viewUser,
  publishProduct,
  unPublishProduct,
  viewAllRecentOrders,
  viewAllRefundedOrders,
  viewAllUsersOrders,
  viewAllCompletedOrders,
  viewAllSuccessPaymentOrders,
  viewAllUnSuccessPaymentOrders,
  removeDiscountOnProduct,
  viewAllPendingOrders,
  setViewinProduct,
  getAllProductsForAdmim,
  getProductByIdForAdmin,
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
  updateProduct,
  deleteProduct,
  filterProducts,
  updateImages,
} = require('../controllers/productControllers.js');



//Users Management : 
router.get('/users',authenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);


//products Management :  
router.post('/product', authenticate, isAdmin, productmages, createProduct);
router.put('/product/viewin/:id', authenticate, isAdmin, setViewinProduct);
router.get('/allproducts', authenticate, isAdmin, getAllProductsForAdmim);
router.get('/products/filter', authenticate, isAdmin, filterProducts);
router.get('/product/:id', authenticate, isAdmin, getProductByIdForAdmin);
router.patch('/product/:id', authenticate, isAdmin, updateProduct);
router.put('/product/:id', authenticate, isAdmin, productmages, updateImages);
router.delete('/product/:id', authenticate, isAdmin, deleteProduct);

//set publish and unpublish the users : 
router.put('/product/publish/:id', authenticate, isAdmin,publishProduct );
router.put('/product/unpublish/:id', authenticate, isAdmin,unPublishProduct);

//discount Management:
router.put('/product/discount/:id', authenticate, isAdmin, setDiscountOnProduct);
router.put('/product/undiscount/:id', authenticate, isAdmin, removeDiscountOnProduct);

//orders Management: 
router.get('/orders/recent', authenticate, isAdmin, viewAllRecentOrders);
router.get('/orders/refund', authenticate, isAdmin, viewAllRefundedOrders);
router.get('/orders/all', authenticate, isAdmin, viewAllUsersOrders);
router.get('/orders/success', authenticate, isAdmin, viewAllCompletedOrders);
router.get('/orders/pending', authenticate, isAdmin, viewAllPendingOrders);

//Payment Management : 
router.get('/payment/success', authenticate, isAdmin, viewAllSuccessPaymentOrders);
router.get('/payment/pending', authenticate, isAdmin, viewAllUnSuccessPaymentOrders);

//admin account Management : 
router.get('/myProducts',authenticate, isAdmin, myProducts);
router.get('/:id',  authenticate, isAdmin, getById);

module.exports = router;