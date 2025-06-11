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
  viewAllCancelRequestedOrders,
  viewAllSuccessPaymentOrders,
  viewAllUnSuccessPaymentOrders,
  removeDiscountOnProduct,
  viewAllPendingOrders,
  setViewinProduct,
  getAllProductsForAdmim,
  getProductByIdForAdmin,
  adminProfileUpdate,
  changePassword,
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
  createProductMatrix,
  updateProductMatrix,
  getProductMatrixById,
  deleteProductMatrix,
} = require('../controllers/productControllers.js');


// ✅✅✅✅✅✅✅✅✅✅✅✅✅ users ✅✅✅✅✅✅✅✅✅✅✅✅✅✅
router.get('/users',authenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);


// ✅✅✅✅✅✅✅✅✅✅✅ products ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.post('/product', authenticate, isAdmin, productmages, createProduct);
router.put('/product/viewin/:id', authenticate, isAdmin, setViewinProduct);
router.get('/allproducts', authenticate, isAdmin, getAllProductsForAdmim);
router.get('/products/filter', authenticate, isAdmin, filterProducts);
router.get('/product/:id', authenticate, isAdmin, getProductByIdForAdmin);
router.patch('/product/:id', authenticate, isAdmin, updateProduct);
router.put('/product/:id', authenticate, isAdmin, productmages, updateImages);
router.delete('/product/:id', authenticate, isAdmin, deleteProduct);

// ✅✅✅✅✅✅✅✅✅✅ Product matrix ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.post('/matrix/:id', authenticate, isAdmin, createProductMatrix);
router.patch('/matrix/:id', authenticate, isAdmin, updateProductMatrix);
router.delete('/matrix/:id', authenticate, isAdmin, getProductMatrixById);
router.get('/matrix/:id', authenticate, isAdmin, deleteProductMatrix);

// ❌❌❌❌❌❌❌❌❌ product publish ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
router.put('/product/publish/:id', authenticate, isAdmin,publishProduct );
router.put('/product/unpublish/:id', authenticate, isAdmin,unPublishProduct);

// ❌❌❌❌❌❌❌❌❌ product discount❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌

router.put('/product/discount/:id', authenticate, isAdmin, setDiscountOnProduct);
router.put('/product/undiscount/:id', authenticate, isAdmin, removeDiscountOnProduct);

// ✅✅✅✅✅✅✅✅✅✅✅✅✅ orders ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.get('/orders/recent', authenticate, isAdmin, viewAllRecentOrders);
router.get('/orders/refund', authenticate, isAdmin, viewAllRefundedOrders);
router.get('/orders/all', authenticate, isAdmin, viewAllUsersOrders);
router.get('/orders/requested/cancel', authenticate, isAdmin, viewAllCancelRequestedOrders);
router.get('/orders/pending', authenticate, isAdmin, viewAllPendingOrders);

// ✅✅✅✅✅✅✅✅✅✅✅✅✅ payments ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.get('/payment/success', authenticate, isAdmin, viewAllSuccessPaymentOrders);
router.get('/payment/pending', authenticate, isAdmin, viewAllUnSuccessPaymentOrders);

//✅✅✅✅✅✅✅✅✅✅✅✅ Admin useres ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.get('/myProducts',authenticate, isAdmin, myProducts);
router.get('/signup',  authenticate, isAdmin, getById);
router.get('/login',  authenticate, isAdmin, getById);
router.patch('/update',  authenticate, isAdmin, adminProfileUpdate);
router.put('/password/update',  authenticate, isAdmin, changePassword);
router.get('/view',  authenticate, isAdmin, getById);

module.exports = router;