/**
 * (c) copyright 2011-2017. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:mweaver@tablesafeinc.com">Michael Weaver</a>
 */

"use strict";


// start up the service and loads the config and status objects
const service = require('./v1/lib/service');
// reference the config singleton object loaded by the Service
const config = require('service-lib-node').config;
// set the debug - needs t be after the Service assignment in order to have the service name
const debug = require('debug')(`${config.serviceName}:server`);

const mongoose = require('mongoose');

const v1 = require('./v1/controller');

// load express
const express = require('express');
const app = express();

// in order to define req.body, we need to use bodyparser
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '5mb'})); // to support JSON-encoded bodies and increase payload limit to 5mb
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    limit: '5mb',
    extended: true
}));

//database connection
mongoose.connect('mongodb://admin:admin123@ds253804.mlab.com:53804/node-consume-api',{ useNewUrlParser: true } );

function errorHandler(err, req, res, next) {
    res.status(err.status).json(err);
}

app.use(errorHandler);
// lets assume that the api is http://api.tsafe.systems/{version} where {version} is
// the current version such as v1, v2, or v3
function errorHandler(err, req, res, next) {
    res.status(err.status).json(err);
}


// override the settings if necessary for testing or adding a configuration file etc.
overrideSettings();
function overrideSettings() {}

// global errorHandler
function errorHandler(err, req, res, next) {
    res.status(err.status).json(err);
}

app.use(errorHandler);
// lets assume that the api is http://api.tsafe.systems/{version} where {version} is
// the current version such as v1, v2, or v3
function errorHandler(err, req, res, next) {
    res.status(err.status).json(err);
}

// middleware to use for all requests
app.use(function (req, res, next) {
    // set some useful variables if we want to use thems
    global.process_hrtime = process.hrtime();
    global.transactionStart = Date.now();
    // Website you wish to allow to connect
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
    // res.setHeader('Access-Control-Allow-Headers', '*');
    //THis header will give browsers ability to read header while do cors
    res.setHeader('Access-Control-Expose-Headers', 'access-token');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    debug('req.query = ', JSON.stringify(req.query));
    next();
});

// route to the specific versions controller - inside each controller are the relative
// routes for that version
app.use('/v1', v1);

// map thes status message to the root
app.get('/', function (req, res) {
    res.send(service.getStatus(config.settings, config.secureArray));
});

app.get('*', function (req, res) {
    let resultData = {
        result: {
            status: 404,
            error: `File not found. Path not available: ${req.method}  ${req.originalUrl}`
        }
    };
    res.status(404).send(resultData);
});

// set the apiport from our config - this is the port on which the service will listen
app.set('port', config.settings.apiPort);



let server;

const async = require('async');
// start 'er up
server = app.listen(app.get('port'), function () {
    console.log(`${config.serviceName} listening on port ${server.address().port}`);
    let count = 0;
    // The app will attempt to restart dependent services and the main service up to three times before giving up
    async.retry({times: 3, interval: 3000}, function(cb, results){
        count++;
        console.log(`\n\n***************************************\n${count}: Attempting to start ${config.serviceName}\n***************************************\n`);
        try {
            async.series([
                function(callback){
                    // checkDependentService is function is called in advance of server startup to ensure 
                    // any needed dependencies such as databases and messagequeues are up and running
                    // Override the function in the vx/lib/service.js module
                    service.checkDependentServices((err, result) => {
                        if(err) {
                            return cb(err);
                        }
                        return callback(null);
                    });
                },
                function(callback){
                    service.startService((err, result) => {
                        if(err) {
                            return cb(err);
                        }
                        return callback(null);
                    });
                }
            ]);
        } catch(ex) {
            return cb(ex);
        }
    }, function(err, result){
        if(err) {
            console.log(err);
            console.log(`${config.serviceName} error. Exiting...`);
            process.exit(1);
        }
    });
});

