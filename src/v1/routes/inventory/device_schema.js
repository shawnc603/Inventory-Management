const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    product: { type: String },
    version: { type: String },
    lotNumber: { type: String },
    serialNumber: { type: String },
    purchaser: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Purchaser'
    }
});

module.exports = mongoose.model('Device', deviceSchema);