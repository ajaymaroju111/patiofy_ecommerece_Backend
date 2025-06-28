const { default: mongoose } = require('mongoose');
const categories  = require('../models/categoriesschema');
const products = require('../models/productschema');
//create a category : 
exports.createCategory = async(req, res) => {
  try {
    const { category } = req.body;
    if(!category){
      return res.status(401).json({
        success: false,
        message: "Category filed is required",
        error: "Bad Request"
      })
    }
    const isCategory = await categories.findOne({ categery_name: category });
    if(isCategory){
      return res.status(401).json({
        success: false,
        message: `${category} category is already exist`,
        error: "Bad Request",
      })
    }

    const newCategory = await categories.create({
      categery_name: category
    })
    return res.status(200).json({
      success: true,
      message: "category created successfully",
      newCategory,
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
};

//get all the categories : 
exports.getAllCategories = async(req, res) =>{
  try {
    const allCategories = await categories.find();
    if(!allCategories || allCategories.length === 0){
      return res.status(404).json({
        success: false,
        message: 'categories are empty',
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "categories retrieved successfully",
      allCategories,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error.message,
    })
  }
};

exports.updateCategory = async(req, res) => {
  try {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success: false,
        statuscode: 1,
        message: "invalid ID",
        error: "Bad Request"
      })
    }
    const { category } = req.body;
    if(!category){
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "category name is required",
        error: "Bad Request"
      })
    }
    const category_response = await categories.findById(id);
    if(!category_response){
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "category does not exist",
        error: "Not Found"
      })
    }
    const previous_category = category_response.categery_name;
    if(!previous_category){
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "category not found",
        error: "Not Found"
      })
    }
    category_response.categery_name = category;
    await category_response.save();
    const update_response = await products.updateMany(
      {category: previous_category},
      {
        $set: {category: category},
      },
    );

    if(update_response.modifiedCount === 0) {
      return res.status(402).json({
        success: false,
        statuscode: 5,
        message: "prducts updation failed",
        error: "Database error"
      })
    }

    return res.status(200).json({
      success: false,
      statuscode: 6,
      message: "category updated successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      statuscode: 500,
      message: "Internal Server Error",
      error: error.message,
    })
  }
}

