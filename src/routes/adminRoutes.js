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
  adminLogin,
  adminSignup,
  searchUsingInvoiceNumber,
  viewallContactUsRequests,
  confirmCancelOrder,
} = require('../controllers/adminControllers.js')
const {
  authenticate,
  isAdmin,
  adminAuthenticate,
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
const { createCategory, getAllCategories, updateCategory } = require('../controllers/categoryControllers.js');
const { getallFabrices, createFabric, updateFabrics } = require('../controllers/fabricControllers.js');
const { createBlog, updateBlogbyId, getBlogById, deleteBlogById, getallBlogs, updateblogPicture } = require('../controllers/blogscontrollers.js');


// ✅✅✅✅✅✅✅✅✅✅✅✅✅ users ✅✅✅✅✅✅✅✅✅✅✅✅✅✅
router.get('/users',adminAuthenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);


// ✅✅✅✅✅✅✅✅✅✅✅ products ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.post('/product', adminAuthenticate, isAdmin, productmages, createProduct);
router.put('/product/viewin/:id', adminAuthenticate, isAdmin, setViewinProduct);
router.get('/allproducts', adminAuthenticate, isAdmin, getAllProductsForAdmim);
router.get('/products/filter', adminAuthenticate, isAdmin, filterProducts);
router.get('/product/:id', adminAuthenticate, isAdmin, getProductByIdForAdmin);
router.patch('/product/:id', adminAuthenticate, isAdmin, updateProduct);
router.put('/product/:id', adminAuthenticate, isAdmin, productmages, updateImages);
router.delete('/product/:id', adminAuthenticate, isAdmin, deleteProduct);

// ✅✅✅✅✅✅✅✅✅✅ Product matrix ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.patch('/matrix/:id', adminAuthenticate, isAdmin, updateProductMatrix);
router.post('/matrix/:id', adminAuthenticate, isAdmin, createProductMatrix);
router.get('/matrix/:id', adminAuthenticate, isAdmin, getProductMatrixById);
router.delete('/matrix/:id', adminAuthenticate, isAdmin, deleteProductMatrix);

// ❌❌❌❌❌❌❌❌❌ product publish ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
router.put('/product/publish/:id', adminAuthenticate, isAdmin,publishProduct );
router.put('/product/unpublish/:id', adminAuthenticate, isAdmin,unPublishProduct);

// ❌❌❌❌❌❌❌❌❌ product discount❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌

router.put('/product/discount/:id', adminAuthenticate, isAdmin, setDiscountOnProduct);
router.put('/product/undiscount/:id', adminAuthenticate, isAdmin, removeDiscountOnProduct);

// ✅✅✅✅✅✅✅✅✅✅✅ contact us requests ✅✅✅✅✅✅✅✅✅✅✅✅✅✅
router.get('/contactus/requests', adminAuthenticate, isAdmin, viewallContactUsRequests);

// ✅✅✅✅✅✅✅✅✅✅✅✅✅ orders ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.post('/orders/invoice', adminAuthenticate, isAdmin, searchUsingInvoiceNumber);
router.get('/orders/recent', adminAuthenticate, isAdmin, viewAllRecentOrders);
router.get('/orders/refund', adminAuthenticate, isAdmin, viewAllRefundedOrders);
router.get('/orders/all', adminAuthenticate, isAdmin, viewAllUsersOrders);
router.put('/orders/requested/confirm/:id', adminAuthenticate, isAdmin, confirmCancelOrder);
router.get('/orders/requested/cancel', adminAuthenticate, isAdmin, viewAllCancelRequestedOrders);
router.get('/orders/pending', adminAuthenticate, isAdmin, viewAllPendingOrders);

// ✅✅✅✅✅✅✅✅✅✅✅✅✅ payments ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.get('/payment/success', adminAuthenticate, isAdmin, viewAllSuccessPaymentOrders);
router.get('/payment/pending', adminAuthenticate, isAdmin, viewAllUnSuccessPaymentOrders);

//✅✅✅✅✅✅✅✅✅✅✅✅ Admin useres ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.get('/myProducts',adminAuthenticate, isAdmin, myProducts);
router.post('/signup', adminSignup);
router.post('/login',  adminLogin);
router.patch('/update',  adminAuthenticate, isAdmin, adminProfileUpdate);
router.put('/password/update',  adminAuthenticate, isAdmin, changePassword);
router.get('/view',  adminAuthenticate, isAdmin, getById);

// ✅✅✅✅✅✅✅✅✅✅ categories ✅✅✅✅✅✅✅✅✅✅✅✅✅✅

router.post('/category',adminAuthenticate, isAdmin, createCategory);
router.get('/category',adminAuthenticate, isAdmin, getAllCategories);
router.put('/category/:id',adminAuthenticate, isAdmin, updateCategory);

// ✅✅✅✅✅✅✅✅✅✅ Fabrics ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
router.post('/fabric',adminAuthenticate, isAdmin, createFabric);
router.get('/fabric',adminAuthenticate, isAdmin, getallFabrices);
router.put('/fabric/:id',adminAuthenticate, isAdmin, updateFabrics);

// ✅✅✅✅✅✅✅✅✅ blogs ✅✅✅✅✅✅✅✅✅✅✅✅✅✅
router.post('/blog/create',adminAuthenticate, isAdmin,createBlog);
router.patch('/blog/:id',adminAuthenticate, isAdmin, updateBlogbyId);
router.delete('/blog/:id', adminAuthenticate, isAdmin, deleteBlogById);
router.put('/blog/:id', adminAuthenticate, isAdmin, updateblogPicture);

module.exports = router;