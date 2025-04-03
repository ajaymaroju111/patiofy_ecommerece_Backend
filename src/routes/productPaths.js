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

router.route('/create').post(multipleUploads, authenticate, createPost);
router.route('/:id').get(getById).delete(authenticate, deletePost).put(authenticate, updatePost);
router.route('/cart').post(authenticate, addToCart);
router.route('/cart/:id').get(authenticate, getCartById).put(authenticate, updateCart).delete(authenticate, deleteCart);

module.exports = router;