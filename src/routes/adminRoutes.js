const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.js');
const images = upload.array('images' , 10);
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
  myProducts,
  getById,

} = require('../controllers/userControllers.js');
const {
  publishProduct,
  unPublishProduct,
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  filterProducts,
} = require('../controllers/productControllers.js');


//admin account Management : 
router.get('/:id',  authenticate, isAdmin, getById);
router.get('/myProducts',authenticate, isAdmin, myProducts);

//Users Management : 
router.post('/users',authenticate, isAdmin, viewAllUsers);
router.put('/user/:id',authenticate, isAdmin, setUserInactive);
router.get('/user/:id',authenticate, isAdmin, viewUser);


//products Management :  
router.post('/product', authenticate, isAdmin, images, createProduct);
router.get('/products', authenticate, isAdmin, getAllProducts);
router.get('/products/filter', authenticate, isAdmin, filterProducts);
router.get('/product/:id', authenticate, isAdmin, getProductById);
router.put('/product/:id', authenticate, isAdmin, updateProduct);
router.delete('/product/:id', authenticate, isAdmin, deleteProduct);

//set publish and unpublish the users : 
router.get('/product/publish/:id', authenticate, isAdmin,publishProduct );
router.put('/product/unpublish/:id', authenticate, isAdmin,unPublishProduct);

//discount Management:
router.put('/product/discount/:id', setDiscountOnProduct);

module.exports = router;