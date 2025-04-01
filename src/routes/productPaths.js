const express = require('express');
const router = express.Router();

const {
  createPost,
  updatePost,
  getById,
  deletePost,

} = require('../controllers/postroutes.js');


router.post('/products', createPost);
router.put('/product/edit' , updatePost);
router.get('/products:{id}', getById);
router.delete('/products/delete', deletePost);