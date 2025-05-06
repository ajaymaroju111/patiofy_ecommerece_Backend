const express = require('express');
const router = express.Router();
const { 
  authenticate,
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
} = require('../controllers/productControllers.js');

// product Routes : 
router.get("/filter", filterProducts); 
router.get("/search", searchProducts);
router.get("/filternames", getFilterNames); 
router.get("/stock", viewProductsStock);
router.get('/bestsellers', findBestSellerProducts);       
router.get('/trending', trendingCollections);       
router.get('/latest', newCollections);
router.get('/', getAllProducts);       
router.get('/:id', getProductById);

// Cart Routes : 
router.get('/carts/mycarts', authenticate, viewAllCarts);
router.post('/cart/:id', authenticate, addToCart);
router.get('/cart/:id', authenticate, getCartById);
router.put('/cart/:id', authenticate, updateCart);
router.delete('/cart/:id', authenticate, deleteCart);

// Rating Routes : 
router.get("/review/:id", authenticate, getRatingById);
router.post("/review/:id", authenticate, ratingProduct);

module.exports = router;