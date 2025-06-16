const categories  = require('../models/categoriesschema')

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
}

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
}