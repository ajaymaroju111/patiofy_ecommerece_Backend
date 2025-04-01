const express = require('express');
const router = express.Router();

const {
  createPost,
  updatePost,
  getById,
  deletePost,

} = require('../controllers/postroutes.js');

router.route('/create').post(createPost).put(updatePost);
router.route('/:id').get(getById).delete(deletePost);
router.route().post();
router.route().post();
router.route().post();
router.route().post();
router.route().post();