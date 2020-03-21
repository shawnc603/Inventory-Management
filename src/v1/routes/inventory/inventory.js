/**
 * (c) copyright 2011-2019. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:schaudhry@tablesafe.com">Shawn Chaudhry</a>
 * @author <a href="mailto:mweaver@tablesafe.com">Michael Weaver</a>
 * 
 */

var request     = require('request');
const config    = require('service-lib-node').config;
var debug       = require('debug')(`${config.serviceName}:inventory_controller`);
const InventoryBase  = require('../../lib/InventoryBase');
const tv4 = require('tv4');
const _ = require('underscore');
const Device =  require('./device_schema');
const Purchaser =  require('./purchaser_schema');
const mongoose = require('mongoose');



class Inventory extends InventoryBase  { 

    constructor(req){
        super(req, "Inventory");
    }

    createPurchaser(req, res, callback){ 
        if(!req.body) {
            return callback(400 ,{
                message: "Body cannot be empty"
            });
        }
        const  purchaser = new Purchaser({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            purchaserCode : req.body.purchaserCode
        });

        const purchaserCode = req.body.purchaserCode;
        Purchaser
        .find( { purchaserCode: purchaserCode } ) 
        .exec()
        .then(purchaserItem => {
            if (purchaserItem.length > 0) {
                return callback(404, {
                    result: {
                        message: "Purchaser already registered!"
                    }
                });
            } else {
                purchaser
                    .save()
                    .then(result => {
                            console.log(result);
                            return callback(201, {
                                result: {
                                    message: "Purchaser registered successfully!",
                                    purchaser: result
                                }
                            });
                    }).catch(err => {
                        console.log(err);
                        return callback(500 ,{
                            error: err
                        });
                    });
            }
        });
    }


    getDevicesbyPurchaser(Item, callback) {
           Device
             .findById(Item) 
             .exec()
             .then(deviceItem => {         
                    return callback(null, deviceItem);
             });

    }

    getPurchaserDeviceItems(Item, callback) {  
            Device
                .findById(Item) 
                .exec()
                .then(deviceItem => {         
                    return callback(200,{           
                        deviceItem: deviceItem             
                    });
                })
                .catch(err => {
                    console.log(err);
                    return callback(500 ,{
                      error: err
                    });
                });
    }

    getPurchaserDevices(req,callback) {
        const purchaserId = req.body.purchaserId;
        Purchaser
          .findById(purchaserId)
          .exec()
          .then(purchaserItem => {

            if(purchaserItem == null){
                console.log('Purchasers not found!');
                return callback(404,{
                    result: {
                        message: 'Purchaser not found'
                    }
                });
            } else {
                return callback(200 ,{
                    result: {
                        purchaserDeviceItems: purchaserItem.device
                    }
                  });
    
            }

        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        });
        
    }

    getAllPurchasers(req, res, callback) {
        Purchaser
         .find() 
         .exec()
         .then(purchaserItems => {
            if(purchaserItems.length < 1){
                console.log('Purchasers not found!');
                return callback(404,{
                    result: {
                        message: 'Purchasers not found'
                    }
                });
            } else {
                return callback(200,{
                    result: {
                        message: purchaserItems.length + ' Purchasers found! ',
                        purchaser: purchaserItems
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        });
    }

    getPurchaser(req, res, callback){
        const purchaserCode = req.params.purchaserCode;
        Purchaser
        .find( { purchaserCode: purchaserCode } ) 
         .exec()
         .then(purchaser => {
            if(purchaser.length < 1){
                console.log('Purchaser not found!');
                return callback(404,{
                    result: {
                        message: 'Purchaser not found!',
                        status: false
                    }
                });
            } else {
                return callback(200,{
                    result: {
                        message: 'Purchaser found!',
                        status: true,
                        purchaser: purchaser
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        }); 
    }

    deletePurchaser(req, res, callback){
        const purchaserCode = req.params.purchaserCode;
        Purchaser.remove({ purchaserCode: purchaserCode })
            .exec()
            .then(result => {
                if(result.n === 0){
                    console.log('purchaser not found!');
                    return callback(404,{
                        result: {
                            message: 'Purchaser not found so could not be deleted!!',
                            status: false
                        }
                    });
                } else {
                    return callback(200, {
                            result: {
                                message: "Device with Purchaser Code: " +  purchaserCode + " deleted successfully!"
                            }
                        });
                }
                })
                .catch(err => {
                    return callback(500, {
                    error: err
                });
            });
    }

    LinkDevice(req, res, callback){
        if(!req.body) {
            return callback(400 ,{
                message: "Body cannot be empty"
            });
        }

        //get purchaser
        const purchaserId = req.body.purchaserId;
        const deviceId = req.body.deviceId;
        Purchaser
           .findById(purchaserId) 
           .exec()
           .then(purchaserItem => {
               if(purchaserItem === null){ 
                        console.log('Purchaser not found!');
                        return callback(404, {
                            result: {
                                message: 'Purchaser not found!'
                            }
                        });
                } else {
                    Device
                        .findById(deviceId) 
                        .exec()
                        .then(deviceItem => {
                        if(deviceItem.length < 1){
                            return callback(404, {
                                    message: 'Device not found!',
                                    status: false
                            });
                        } else {
                                purchaserItem.device.push(deviceItem._id);
                                purchaserItem
                                 .save()
                                 .then(result => {
                                        console.log('device added:: ' + result);
                                        return callback(201, {
                                            result: {
                                                message: "Device linked successfully!",
                                                purchaser: result
                                            }
                                        });
                                }).catch(err => {
                                    console.log(err);
                                    return callback(500 ,{
                                        error: err
                                    });
                                });
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        return callback(500 ,{
                            error: err
                        });
                    });
                    }
            });
    }

    LinkDeviceParms(req, res, callback){
        if(!req.body) {
            return callback(400 ,{
                message: "Body cannot be empty"
            });
        }
        //get purchaser
        const purchaserId = req.params.purchaserId;

        Purchaser
           .findById(purchaserId) 
           .exec()
           .then(purchaserItem => {
               if(purchaserItem === null){ 
                        console.log('Purchaser not found!');
                        return callback(404, {
                            result: {
                                message: 'Purchaser not found!'
                            }
                        });
                } else {

                    //create a new device
                    const  device = new Device({
                        _id: new mongoose.Types.ObjectId(),
                        product: req.body.product,
                        version: req.body.version,
                        lotNumber: req.body.lotNumber,
                        serialNumber: req.body.serialNumber
                    });
                    

                    //check if device exists
                    this.doesDeviceExist(device.serialNumber, function(err, resp) {
                        if(!resp.status){ 
                            device.purchaser = purchaserItem;               
                            device
                                .save()
                                .then(deviceItem => {
                                        console.log('device added:: ' + deviceItem);
                                        purchaserItem.device.push(deviceItem);
                                        purchaserItem
                                        .save()
                                        .then(result => {
                                                console.log(result);
                                                return callback(201, {
                                                    result: {
                                                        message: "Device registered successfully!",
                                                        purchaser: result
                                                    }
                                                });
                                        }).catch(err => {
                                            console.log(err);
                                            return callback(500 ,{
                                                error: err
                                            });
                                        });

                                }).catch(err => {
                                        console.log(err);
                                        return callback(500 ,{
                                            error: err
                                        });
                                });

                        }
                        else {
                            return callback(409, {
                                result: {
                                    message: "Device Already Exists!"
                                }
                            });
                        }
                    });
                }
          });

    }

    LinkDeviceBody(req, res, callback){ 
        if(!req.body) {
            return callback(400 ,{
                message: "Body cannot be empty"
            });
        }
        //find purchaser
        const purchaserId = req.body.purchaser;

            Purchaser
            .findById(purchaserId) 
            .exec()
            .then(purchaserItem => {
                    if(purchaserItem === null){ 
                        console.log('Purchaser not found!');
                        return callback(404,{
                            message: 'Purchaser not found! Cannot associate to device!'
                        });
                    } 
                    else {
                            //create a new device
                            const  device = new Device({
                                _id: new mongoose.Types.ObjectId(),
                                product: req.body.product,
                                version: req.body.version,
                                lotNumber: req.body.lotNumber,
                                serialNumber: req.body.serialNumber
                            });
                            //check if device exists
                            this.doesDeviceExist(device.serialNumber, function(err, resp) {
                                if(!resp.status){ 
                                    device.purchaser = purchaserItem;
                                    device
                                        .save()
                                        .then(deviceItem => {
                                            console.log(deviceItem);
                                                //add device to purchaser
                                                purchaserItem.device.push(deviceItem);
                                                purchaserItem
                                                .save()
                                                .then(result => {
                                                        console.log(result);
                                                        return callback(201, {
                                                            result: {
                                                                message: "Device registered successfully!",
                                                                purchaser: result
                                                            }
                                                        });
                                                }).catch(err => {
                                                    console.log(err);
                                                    return callback(500 ,{
                                                        error: err
                                                    });
                                                });

                                    }).catch(err => {
                                        console.log(err);
                                        return callback(500 ,{
                                            error: err
                                        });
                                    }); 

                                }
                                else {
                                    return callback(409, {
                                        result: {
                                            message: "Device does not exist, please create a device!"
                                        }
                                    });
                                }
                            });
                    }

            });
    }

    doesDeviceExist(serialNumber, callback){
        Device
         .find( { serialNumber: serialNumber } ) 
         .exec()
         .then(device => {
            if(device.length < 1){
                return callback(404, {
                        message: 'Device not found!',
                        status: false
                });
            } else {
                return callback(200, {
                        message: 'Device found',
                        status: true
                });
            }
        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        });
    }


    createDevice(req, res, callback){ 
        if(!req.body) {
            return callback(400 ,{
                message: "Body cannot be empty"
            });
        }
        const  deviceItem = new Device({
            _id: new mongoose.Types.ObjectId(),
            product: req.body.product,
            version: req.body.version,
            lotNumber: req.body.lotNumber,
            serialNumber: req.body.serialNumber,
        }); 
        const serialNumber = req.body.serialNumber;
        Device
         .find( { serialNumber: serialNumber } ) 
         .exec()
         .then(device => {
            if (device.length > 0) {
                return callback(200, {
                    result: {
                        message: "Device already registered!",
                        deviceItem: deviceItem
                    }
                });
            } else {
                deviceItem
                .save()
                .then(result => {
                        console.log(result);
                        return callback(201, {
                            result: {
                                message: "Device registered successfully!",
                                deviceItem: deviceItem
                            }
                        });
                }).catch(err => {
                    console.log(err);
                    return callback(500 ,{
                        error: err
                    });
                });

            }
         });

    }

    getDevice(req, res, callback) {
        const serialNumber = req.params.serialNumber;
        Device
         .find( { serialNumber: serialNumber } ) 
         .exec()
         .then(device => {
            if(device.length < 1){
                console.log('not found!');
                return callback(404,{
                    result: {
                        message: 'Device not found'
                    }
                });
            } else {
                return callback(200,{
                    result: {
                        message: 'Device found!',
                        device: device
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        });
    }

    getAllDevices(req, res, callback) {
        Device
         .find() 
         .exec()
         .then(device => {
            if(device.length < 1){
                console.log('not found!');
                return callback(404,{
                    result: {
                        message: 'Device not found'
                    }
                });
            } else {
                return callback(200,{
                    result: {
                        message: device.length + ' Devices found! ',
                        device:  device.map(device => {
                            return {
                                _id: device._id,
                                product: device.product,
                                version: device.version,
                                lotNumber: device.lotNumber,
                                serialNumber: device.serialNumber
                            };
                        })
                    }
                });
            }
        })
        .catch(err => {
            console.log(err);
            return callback(500 ,{
              error: err
            });
        });
    }

    

    deleteDevice(req, res, callback){
        const serialNumber = req.params.serialNumber;
        Device.remove({ serialNumber: serialNumber })
            .exec()
            .then(result => {
                    if(result.n === 0){
                        console.log('Device  not found!');
                        return callback(404,{
                            result: {
                                message: 'Purchaser not found so could not be deleted!!',
                                status: false
                            }
                        });
                    } else {
                        return callback(200, {
                                result: {
                                    message: "Device with serialNumber: " +  serialNumber + " deleted successfully!"
                                }
                            });
                    }
                })
                .catch(err => {
                    return callback(500, {
                    error: err
                });
            });
        
    }

}

module.exports = Inventory;

