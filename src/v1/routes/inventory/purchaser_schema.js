const mongoose = require('mongoose');

const purchaserSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    purchaserCode: { type: String, required: true },
    device: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Device'
    }]
});

module.exports = mongoose.model('Purchaser', purchaserSchema);