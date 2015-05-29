/// <reference path="../../typings/node/node.d.ts"/>
/* global Buffer */
/* global sails */
//TranslationService - wrapper for LMV functions needed to handle bucket operations
var events = require('events'),
    request = require('request'),
    events = require('events'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    apiConfig = sails.config.translationApi,
    skipperS3 = require('skipper-s3')({
        key: apiConfig.s3.key,
        secret: apiConfig.s3.secret,
        bucket: apiConfig.s3.bucket,
        region: apiConfig.s3.region,
        endpoint: apiConfig.s3.endpoint
    }),
    AWS = require('aws-sdk');
if(apiConfig.usingS3){
		AWS.config = {
        accessKeyId: apiConfig.s3.key,
        secretAccessKey: apiConfig.s3.secret,
        region: apiConfig.s3.region
	};
}
function TranslationService(bucketName) {
    events.EventEmitter.call(this);
    this.bucketName = bucketName;
    return this;
}
util.inherits(TranslationService, events.EventEmitter);


TranslationService.prototype.authenticate = function() {
    var _this = this;
    sails.log(apiConfig);
    request.post(apiConfig.baseUrl + '/authentication/v1/authenticate', {
        form: apiConfig
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            apiConfig.fetchedToken = JSON.parse(body);
            sails.log(apiConfig.fetchedToken);
            _this.emit('success', apiConfig.fetchedToken);
        } else {
            _this.emit('fail', 'Token problem');
        }
    });
    return this;
};

TranslationService.prototype.checkBucket = function() {
    var _this = this;
    request(apiConfig.baseUrl + '/oss/v1/buckets/' + _this.bucketName + '/details', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            _this.emit('success', body);
        } else {
            _this.emit('fail', error);
        }
    });
    return this;
};
TranslationService.prototype.createBucket = function(policy) {
    var policySettings = policy || 'transient',
        _this = this;
    request({
        url: apiConfig.baseUrl + '/oss/v1/buckets',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token
        },
        json: true,
        body: {
            'bucketKey': _this.bucketName,
            'policy': policy
        }
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            _this.emit('success', body);
        } else {
            sails.log(error);
            _this.emit('fail', error);
        }
    });
    return this;
};
TranslationService.prototype.uploadFile = function(uploadedFiles) {
        var _this = this,
            s3AWS = new AWS.S3();
        async.map(uploadedFiles, function(file, callback) {
                var filenameNoExt = "",
                    uploadEndpoint = "",
                    s3File = "";
                if (apiConfig.usingS3) {
                    filenameNoExt = path.basename(file.extra.Location);
                    uploadEndpoint = '/oss/v1/buckets/' + _this.bucketName + '/objects/' + filenameNoExt.replace(/ /g, '+');
                    skipperS3.read(filenameNoExt, function(err, data) {
                            if (err) {
                                sails.log(err);
                            } else {
                                request({
                                    url: apiConfig.baseUrl + uploadEndpoint,
                                    method: 'PUT',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/octet-stream',
                                        'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token

                                    },
                                    body: data
                                }, function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        callback(null, body);
                                    } else {

                                        callback(body);
                                    }
                                });
                           }
                        });
                    } else {
                        filenameNoExt = path.basename(file.filename);
                        uploadEndpoint = '/oss/v1/buckets/' + _this.bucketName + '/objects/' + filenameNoExt.replace(/ /g, '');
                        fs.readFile(file.fd, function(err, data) {
                            if (err) {
                                callback(err);
                            }
                            request({
                                url: apiConfig.baseUrl + uploadEndpoint,
                                method: 'PUT',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/octet-stream',
                                    'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token
                                },
                                body: data
                            }, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    callback(null, body);
                                } else {
                                    callback(body);
                                }
                            });
                        });
                    }
                },
                function(err, uploaded) {
                    if (err) {
                        sails.log(err);
                        _this.emit('fail', err);
                    } else {
                        _this.emit('success', uploaded);
                    }
                });
            return this;
        };
        //Register viewing service
        TranslationService.prototype.register = function(uploadedFiles) {
            var _this = this;
            async.map(uploadedFiles, function(file, callback) {
                var urnEncoded = new Buffer(file.objects[0].id).toString('base64');
                request({
                    url: apiConfig.baseUrl + '/viewingservice/v1/register',
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token
                    },
                    json: true,
                    body: {
                        'urn': urnEncoded
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(null, {
                            'urn': urnEncoded,
                            body: body,
                            name: file.objects[0].key
                        });
                    } else {
                        callback(error);
                    }
                });

            }, function(error, uploaded) {
                if (error) {
                    sails.log(error);
                    _this.emit('fail', error);
                } else {
                    _this.emit('success', uploaded);
                }
            });

            return this;
        };
        TranslationService.prototype.status = function(urn, params) {
            var _this = this;
            request({
                url: apiConfig.baseUrl + '/viewingservice/v1/' + urn + '/status',
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token
                },
                json: true,
                qs: params
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    sails.log('success!!!');
                    _this.emit('success', {
                        'urn': urn,
                        body: body
                    });
                } else {
                    _this.emit('fail', error);
                }
            });
            return this;
        };
        TranslationService.prototype.setReferences = function(referenceFilePath) {
            var _this = this;
            fs.createReadStream(referenceFilePath).pipe(
                request({
                    url: apiConfig.baseUrl + '/references/v1/setreference',
                    method: 'POST',
                    json: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.fetchedToken.access_token
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        _this.emit('success', body);
                    } else {
                        _this.emit('fail', response.statusCode);
                    }
                }));
            return this;
        };
        module.exports = TranslationService;
