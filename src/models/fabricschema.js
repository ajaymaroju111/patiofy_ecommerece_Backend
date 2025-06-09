const mongoose = require('mongoose');

const FabricSchema = new mongoose.Schema({
  fabric_name : {
    type: String,
    unique: true,
  }
}, {timestamps: true});

module.exports = mongoose.model('fabrics', FabricSchema);