/**
 * (c) copyright 2011-2019. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:schaudhry@tablesafe.com">Shawn Chaudhry</a>
 * @author <a href="mailto:mweaver@tablesafe.com">Michael Weaver</a>
 * 
 */

"use strict"

let express = require('express');
let _ = require('underscore');
const config = require('service-lib-node').config;
var debug = require('debug')(`${config.serviceName}:inventory_controller`);
let ts_util = require('baseobjects-lib-node').ts_util;


let Inventory =  require('./inventory');
let thisObject = {};

let router = express.Router();



router.use(function (req, res, next) {
    thisObject = new Inventory(req);
    next();
});

function sendResponse(req, res, error, result) {
    ts_util.extendDataCompleteRequest(req, res, error, result, function (error, result) {
        if(error) {
            //config.service.recalcStats(config.STATS_ENUM.GIFT_ALOHA_ERROR, result);
        } else {
            //config.service.recalcStats(config.STATS_ENUM.GIFT_ALOHA_SUCCESS, result);
        }
    });
}

router.route('/') 
    .get(function (req, res, next) { //health check
        thisObject.healthCheck(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });


router.route('/createPurchaser')   
    .post(function (req, res, next) { 
        thisObject.createPurchaser(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/getPurchaser/:purchaserCode')   
    .get(function (req, res, next) { 
        thisObject.getPurchaser(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/getAllPurchasers')   
    .get(function (req, res, next) { 
        thisObject.getAllPurchasers(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/getPurchaserDevices')   
    .get(function (req, res, next) { 
        let devices = [];
        thisObject.getPurchaserDevices(req,function (error, result) {
            let Length = result.result.purchaserDeviceItems.length;
    
            result.result.purchaserDeviceItems.map( (Item) => {          
                thisObject.getPurchaserDeviceItems(Item, function (error, result){
                    devices.push(result);
                    if((Length - 1)===0)
                    {
                        let mappedBody = {
                            result: _.extend({}, {"devices": devices})
                        }; 
                        sendResponse(req, res, error, mappedBody);
                    }
                    Length--;
                });
            });
        });
    });

router.route('/deletePurchaser/:purchaserCode')   
    .delete(function (req, res, next) { 
        thisObject.deletePurchaser(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/:purchaserId/device')   
    .get(function (req, res, next) { 
        thisObject.getPurchaserDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    })
    .post(function (req, res, next) { 
        thisObject.LinkDeviceParms(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/device')   
    .post(function (req, res, next) { 
        thisObject.LinkDeviceBody(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/linkDevice')   
    .post(function (req, res, next) { 
        thisObject.LinkDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });


router.route('/createDevice')   
    .post(function (req, res, next) { 
        thisObject.createDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/getDevice/:serialNumber') 
    .get(function (req, res, next) { 
        thisObject.getDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/getAllDevices') 
    .get(function (req, res, next) { 
        thisObject.getAllDevices(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });



router.route('/updateDevice')   
    .put(function (req, res, next) { 
        thisObject.updateDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });

router.route('/deleteDevice/:serialNumber')   
    .delete(function (req, res, next) { 
        thisObject.deleteDevice(req, res, function (error, result) {
            sendResponse(req, res, error, result);
        });
    });






module.exports = router;
