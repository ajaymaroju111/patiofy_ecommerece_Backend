const express = require('express');
const router = express.Router();
const { 
  authenticate,
  authenticateifNeeded,
} = require('../middlewares/authUser.js');

const {
  getAllProducts,
  getProductById,
  addToCart,
  getCartById,
  updateCart,
  deleteCart,
  getRatingById,
  ratingProduct,
  filterProducts,
  viewAllCarts,
  newCollections,
  findBestSellerProducts,
  viewProductsStock,
  getFilterNames,
  searchProducts,
  trendingCollections,
  createReview,
  getReviewsByProduct,
  getallReviewsByProduct,
} = require('../controllers/productControllers.js');
const { getallfilternames } = require('../controllers/userControllers.js');

// product Routes : 
router.get('/filternames', getallfilternames);
router.get("/filter", filterProducts); 
router.get("/search", searchProducts);
// router.get("/filternames", getFilterNames); 
router.get("/stock", viewProductsStock);
router.get('/bestsellers', findBestSellerProducts);       
router.get('/trending', trendingCollections);       
router.get('/latest', newCollections);
router.get('/', authenticateifNeeded, getAllProducts);       
router.get('/:id', getProductById);

// Cart Routes : 
router.get('/carts/mycarts', authenticate, viewAllCarts);
router.post('/cart/:id', authenticate, addToCart);
router.get('/cart/:id', authenticate, getCartById);
router.put('/cart/:id', authenticate, updateCart);
router.delete('/cart/:id', authenticate, deleteCart);

// Rating Routes : 
router.get("/reviews/all/:id", getallReviewsByProduct);
router.get("/review/:id", getReviewsByProduct);
router.post("/review/:id", authenticate, createReview);

module.exports = router;