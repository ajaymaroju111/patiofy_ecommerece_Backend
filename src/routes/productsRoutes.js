const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const multipleUploads = upload.array('images' , 10);
const { 
  authenticate,
 } = require('../middlewares/authUser.js');

const {
  createProduct,
  updateProduct,
  getById,
  deleteProduct,
  addToCart,
  getCartById,
  updateCart,
  deleteCart,
  getRatingById
  
} = require('../controllers/productsAuth.js');

router.post('/create', authenticate, multipleUploads, createProduct);
router.get('/:id', getById)
router.delete('/:id', authenticate, deleteProduct)
router.put('/:id', authenticate, updateProduct);
router.post('/cart', authenticate, addToCart);
router.get('/cart/:id', authenticate, getCartById)
router.put('/cart/:id', authenticate, updateCart)
router.delete('/cart/:id', authenticate, deleteCart);
router.get("/review/:id", authenticate, getRatingById);

module.exports = router;