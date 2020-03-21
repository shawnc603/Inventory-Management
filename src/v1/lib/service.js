/**
 * (c) copyright 2011-2017. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:mweaver@tablesafe.com">Michael Weaver</a>
 */

"use strict";

const _ = require('underscore');
let ServiceBase = require('service-lib-node').ServiceBase; // this is the base class
let config = require('service-lib-node').config;    // these are singletons
config.startTime = Date.now();
const debug = require('debug')(`${config.serviceName}:Service`);

const _httpOptions = {
    headers: {
        'Content-Type': 'application/json'
    },
    json: true
};


// These need to necustomized for each new service
// Any additional customized supporting variables go here
config.serviceName = "inventory-service"; // ALTER WITH YOUR SERVICE NAME

/*  Stats are part of the health check object. Keep track of relevant and useful stats that
    will provide insight into the health of the service such as number of messages processed,
    number of exceptions, percentage of total messages, etc.
*/

const stats = {
    inventoryRequests: {
        inventory: {
            total: 0,
            error: 0,
            success: 0,
            last: []
        },

    }
};


/* 
    Custom enum used in calculating the stats.
*/
const STATS_ENUM = {

};

// Service object is the implementation of the ServiceBase base class.
class Service extends ServiceBase {

    constructor() {
        super (config.serviceName, config.startTime, stats );
        config.service = this;
        config.STATS_ENUM = STATS_ENUM;
        // CREATE ELEMENTS IN THE DEPENDNCIES OBJECT TO REPRESENT THE STATE OF EACH DEPENDENT SERVICE and Up TO THE SUFFIX
        //  AND SET TO FALSE. THESE WILL BE SET TO TRUE BY THE checkDependentServices METHOD. 
        let dependencies = {  
            auditUp : false
        };
        _.extend(this.dependencies, dependencies);
    }


    /*
    Override function loadConfiguration()
    Customizes the custom parameters/environment variables and default settings for the service.

    Each new setting by instantiating an service-lib-setting.Setting object.
    Each new setting objec is then added to an array which is passed to the config.addSettings function. This
    function adds each of the setting value to the config object so that it may be referenced by dot notation.
    Ex: config.dbURL.
    
    Each setting can be created with a default value, environment name, and startup param code. The priority of the values
    are as follows: startup param, environment value, default. Ex:
    
    settings.push(new Setting('apiPort', '13040', 'API_PORT', 'p')); // overwrites a core setting
    settings.push(new Setting("srcEndpoint", "chatter.tsafe.io", "SOURCE_ENDPOINT", "e"));

    we can also add values that are derived from settings by creating an object with a get 
    function and adding via addSettings.

    Ultimately, we can load a configuration yaml file

    @since 0.1.0
    */
    loadConfiguration() {
        const Setting = require('service-lib-node').Setting;        
        // create an array of settings and add to the config object
        // p, w, o, c parameters are already assigned in base object - see service-lib-node::config for these parameters

        let settings = [];
        /* ADD SETTINGS HERE
            settings.push(new Setting("srcEndpoint", "chatter.tsafe.io", "SOURCE_ENDPOINT", "e"));
        */  


       //Audit Settings
       settings.push(new Setting("auditEndpoint", "localhost", "AUDIT_ENDPOINT", "e"));
       settings.push(new Setting("auditPort", "14000", "AUDIT_PORT", "a"));
       
       config.addSettings(settings);

       config.addSettings({
        "auditConnectionString": {
            get: () => {
                let returnVal = `http://${config.settings.auditEndpoint}:${config.settings.auditPort}`;
                debug(`auditConnectionString = ${returnVal}`);
                return returnVal;
            }
         }
        });
        
        // LIST SECRET ITEMS THAT SHOULD NOT BE EXPOSED SUCH AS PASSWORDS - this avoids passwords being displayed on the status page
        config.secureArray = _.union(config.secureArray, [/*"srcPassword", "destPassword"*/]);

        /*
            if exists, overwrite all settings with a configuration file
            the default config file path is "./config.yaml" relative to the ${workspace} directory
            consider using a different config file for each stack ie: config-dev.yaml, config-qa.yaml, config-staging.yaml, etc
            ths format is simply
                variable: value
            
            USING A CONFIG FILE IS THE PREFERRED METHOD FOR SETTING VARIABLES
        */
        config.loadConfigsFile(config.settings.configFile);
 
    }
    
    /*
    Override function recalcStats(incrementedStat)
    Should be called each time a stats value needs to be incremented (defined by STATS_ENUM)
    
    @param {STATS_ENUM} incrementedStat
    The stat to increment.
    @param element

    @since 0.1.0
    */
    recalcStats(incrementedStat, element){

        function recalcArray(arr, element){
            if(arr.length < 20) { 
                arr.unshift(element);
            } else {
                arr.pop();
                arr.unshift(element);
            } 
        }

        switch (incrementedStat) {

        }
    } 

    /*
    Override function checkDependentServices(callback)

    Checks external services required by this service to operate. May include database, message queue,
    audit or authentication service, etc.
    Called by the server module before starting up the server. May also be called by other modules when
    a dependent service interruption is detected.
    
    @param {Object} callback
    The callback function in the form function(error, result).
   
    @since 0.1.0
    */
   checkDependentServices(callback){
        const async = require('async');
        const httpRequest = require('request');
        let _this = this;
        let count = 0;
        async.retry({times: config.settings.waitForServices*60, interval: 1000}, function(cb) {
            // async.retry({times: 10, interval: 1000}, function(cb) {
            count++;    
            async.parallel([
                function(callback) {
                    if(!(_this.dependencies.auditUp)){
                        console.log(`${count}: Attempting to connect to audit service on: ${config.auditConnectionString}`);
                        let options = _httpOptions;
                        options.url = config.auditConnectionString;
                        options.method = 'GET';
                        httpRequest(options, function(error, response, body){
                            if(error) return callback(error);
                            if(response.body.health) {
                                if(response.body.health === "HEALTHY") {
                                    _this.dependencies.auditUp = true;
                                    return callback(null, true);
                                } else return callback(`health: ${response.body.health}, diagnosis: ${JSON.stringify(response.body.diagnosis)}`);
                            } else return callback("Unable to determine health of the audit-service.");
                        });
                    } else return callback(null);
                }
                ], function (err, result){
                    return (err) ? cb(err): cb(null);
                });
            }, function(err, result){
                let _logConnectionMessage = (predicate, serverType) =>{
                    (predicate) ? 
                        console.log(`Successfully connected to ${serverType} server`) : 
                        console.error(`Failed to connected to ${serverType} server`);
                };
                _logConnectionMessage(_this.dependencies.auditUp, 'audit');

                if(err) {
                    // if we don't ultimately give up, the container won't die and the auto-scalar won't notice a problem.
                    return callback('Unable to connect to dependent services. Giving up.');
                }
                else {
                    return callback(null, true);
                }
            });
   }

    /*
    Override function startService(callback)
    
    startService is the main program loop for the service. All critical functions are executed within this loop. If
    this loop terminates or errors out, the server.js will attempt a restart a total of three times and then exit the 
    program.  Updates to the stats and health will be expected from within this function as once the function executes, it
    is expected to never exit and loop forever or until the logic stops the service for other reasons.

        Since 0.1.0

    */
    startService(callback) {}
}

module.exports = new Service();
