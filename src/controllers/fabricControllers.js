const { default: mongoose } = require("mongoose");
const fabrics = require("../models/fabricschema");
const products = require('../models/productschema');
//create a new fabric : 
exports.createFabric = async(req, res) => {
  try {
    const {fabric} = req.body;
    if(!fabric){
      return res.status(401).json({
        success: false,
        message: "fabric field not Found",
        error: "Bad Request"
      })
    }
    const isFabric = await fabrics.findOne({ fabric_name: fabric});
    if(isFabric){
      return res.status(400).json({
        success: false,
        message: "fabric already exist",
        error: "Already Exist"
      })
    }
    const newFabric = await fabrics.create({
      fabric_name: fabric,
    })
    return res.status(200).json({
      success: true,
      message: "fabric added successfully",
      data: newFabric
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error.message
    })
  }
};

//display all fabrics : 
exports.getallFabrices = async(req, res) => {
  try {
    const allfabrics = await fabrics.find();
    if(!allfabrics || allfabrics.length === 0){
      return res.status(404).json({
        success: false,
        message: "fabrics are empty",
        error: "Not Found"
      })
    }
    return res.status(200).json({
      success: true,
      message: "all fabrics retrieved successfully",
      data: allfabrics
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Intenal Server Error",
      error: error.message
    })
  }
};

exports.updateFabrics = async(req, res) => {
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
    const { fabric } = req.body;
    if(!fabric){
      return res.status(400).json({
        success: false,
        statuscode: 2,
        message: "fabric name is required",
        error: "Bad Request"
      })
    }
    const fabric_response = await fabrics.findById(id);
    if(!fabric_response){
      return res.status(404).json({
        success: false,
        statuscode: 3,
        message: "Fabric does not exist",
        error: "Not Found"
      })
    }
    const previous_fabric = fabric_response.fabric_name;
    if(!previous_fabric){
      return res.status(404).json({
        success: false,
        statuscode: 4,
        message: "fabric not found",
        error: "Not Found"
      })
    }
    fabric_response.fabric_name = fabric;
    await fabric_response.save();
    const update_response = await products.updateMany(
      {fabric: previous_fabric},
      {
        $set: {fabric: fabric}
      },
    );

    if(update_response.modifiedCount === 0) {
      return res.status(402).json({
        success: false,
        statuscode: 4,
        message: "prducts updation failed",
        error: "Database error"
      })
    }

    return res.status(200).json({
      success: false,
      statuscode: 5,
      message: "fabric updated successfully"
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
