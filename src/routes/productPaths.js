const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const multipleUploads = upload.array('images' , 10);
const { 
  authenticate,
 } = require('../middlewares/authUser.js');

const {
  createPost,
  updatePost,
  getById,
  deletePost,
  addToCart,
  getCartById,
  updateCart,
  deleteCart,
  
} = require('../controllers/postroutes.js');

router.post('/create', authenticate, multipleUploads, createPost);
router.get('/:id', getById)
router.delete('/:id', authenticate, deletePost)
router.put('/:id', authenticate, updatePost);
router.post('/cart', authenticate, addToCart);
router.get('/cart/:id', authenticate, getCartById)
router.put('/cart/:id', authenticate, updateCart)
router.delete('/cart/:id', authenticate, deleteCart);

module.exports = router;