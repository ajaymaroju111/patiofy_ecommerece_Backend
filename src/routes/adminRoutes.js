const express = require('express');
const router = express.Router();
const {
  setDiscountOnProduct,

  setUserInactive,
  viewAllUsers,
  viewUser,
} = require('../controllers/adminControllers.js')
const {
  authenticate,
  isAdmin,
} = require('../middlewares/authUser.js');
const {

} = require('../controllers/userControllers.js');
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,

} = require('../controllers/productControllers.js');



//Users Management: 
router.post('/users',authenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);
router.post('/user',authenticate, isAdmin,  )

//products Management: 
router.post('/product', authenticate, isAdmin, createProduct);
router.get('/product', authenticate, isAdmin, getAllProducts);
router.put('/product/:id', authenticate, isAdmin, updateProduct);
router.delete('/product/:id', authenticate, isAdmin, deleteProduct);

//discount Management:
router.put('/product/discount/:id', setDiscountOnProduct)


module.exports = router;