/**
 * (c) copyright 2011-2019. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:schaudhry@tablesafe.com">Shawn Chaudhry</a>
 * @author <a href="mailto:mweaver@tablesafe.com">Michael Weaver</a>
 * 
 */

"use strict";
const config    = require('service-lib-node').config;
const express   = require('express');
const params    = require('express-params');     // allows validation of :id params with regex
const ts_util   = require('baseobjects-lib-node').ts_util;
const Audit     = require('audit-node');

//inventory controllers
let inventory_controller = require('./routes/inventory/inventory_controller');

let router = express.Router();
params.extend(router);


// middleware to use for all v2 requests


router.use(function (req, res, next) {
    // every call to the api is logged to couchbase in an audit object. This object contains - the auditId,
    // the userId, the sessionId, elapsedTime (from request to response), and references to the request and
    // response objects. Every other object in the database references an auditId in which are the req/res
    // that created or altered it, thus satisfying audit requirements.

    console.log(req.method, req.url);

    res.set('Content-Type', 'application/json');

    req.audit = new Audit(config.auditConnectionString, config.serviceName, "main", global.process_hrtime);
    req.audit.create(req, function(err, response){
        if(err)
            return res.status(500).end();
        else
            req.site = String(response.id).slice(0,2);
            req.reqId = response.requestId;
            next();
    });
 
 });


//inventory routes
router.use('/inventory/', inventory_controller);


router.get('/', function (req, res) {
    var resultData = {
        result: 'Welcome to Tablesafe v1 inventory API!\n'
    };
    ts_util.extendDataCompleteRequest(req, res, 200, resultData, function (error, result) {
        //return callback(error, result);
    });
});


router.get('*', function (req, res) {
    return ts_util.routeNotFound(req, res, function (error, result) {
    });
});

module.exports = router;