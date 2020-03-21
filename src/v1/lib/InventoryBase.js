/**
 * (c) copyright 2011-2019. TableSafe, Inc. All rights reserved.
 *
 * @author <a href="mailto:schaudhry@tablesafe.com">Shawn Chaudhry</a>
 * @author <a href="mailto:mweaver@tablesafe.com">Michael Weaver</a>
 * 
 */


const config    = require('service-lib-node').config;
const Audit     = require('audit-node');
const _ = require('underscore');


const  METHOD_NAME = {

};


class InventoryBase {

    constructor(req, myType){
        this.myType = myType;
        this._req = req;
        this.METHOD_NAME = METHOD_NAME;
        this.audit = new Audit(config.auditConnectionString, config.serviceName, this.myType, global.process_hrtime);

    }

    get req() {
         return this._req;
    }

    getResultErrorMessage(message) {
        return (_.isObject(message)) ? 
        {
            result: {
                error: message
            }
        } :
        {
            result: {
                error: { 
                    message: message 
                }
            }
        }
    }

   
}

module.exports = InventoryBase;