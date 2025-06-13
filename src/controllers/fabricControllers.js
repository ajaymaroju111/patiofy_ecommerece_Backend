const fabrics = require("../models/fabricschema")

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
    const isFabric = await fabrics.find({ fabric_name: fabric});
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
}

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
}