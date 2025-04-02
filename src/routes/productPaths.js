const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const multipleUploads = upload.array('images' , 10);

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

router.route('/create').post(multipleUploads, createPost);
router.route('/:id').get(getById).delete(deletePost).put(updatePost);
router.route('/cart').post(addToCart);
router.route('/cart/:id').get(getCartById).put(updateCart).delete(deleteCart);

module.exports = router;