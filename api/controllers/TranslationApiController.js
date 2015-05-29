/* global async */
/* global __dirname */
/* global TranslationService */
/* global sails */
/**
 * TranslationApiController
 *
 * @description :: Server-side logic for managing TranslationApi
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var path = require('path'),
    fs = require('fs'),
    jf = require('jsonfile'),
    util = require('util'),
    moment = require('moment'),
    s3 = require('skipper-s3'),
    apiConfig = sails.config.translationApi;

module.exports = {
    renderHome: function(req, res) {
        new TranslationService().authenticate();
        res.render('home/index', {
            user: req.user || false
        });
    },
    getToken: function(req, res) {
        new TranslationService().authenticate().on('success', function(data) {
            res.send(data);
        }).on('fail', function(data) {
            res.badRequest(data);
        });
    },
    parseUploadForm: function(req, res) {
        var filename = '',
            fileUploaded = false,
            uploadDir = path.normalize(__dirname + '/../../uploaded/'),
            options = {};
        if (apiConfig.usingS3) {
            apiConfig.s3.adapter = s3;
            options = apiConfig.s3;
        } else {
            options = {
                saveAs: function(__newFileStream, cb) {
                    cb(null, uploadDir + __newFileStream.filename);
                }
            };
        }
        req.file("files").upload(options, function(err, uploadedFiles) {
            if (err) {
                res.send(500, err);
            } else {
                res.send(200, {
                    uploadedFiles: uploadedFiles,
                    usingS3: apiConfig.usingS3
                });
            }
        });

        sails.log('Uploading...backend');
    },
    translateFile: function(req, res) {
        var bucket = 'model' + new Date().toISOString().replace(/T/, '-').replace(/:+/g, '-').replace(/\..+/, '') +
            '-' + apiConfig.fetchedToken.access_token.toLowerCase().replace(/\W+/g, ''),
            policy = 'transient',
            uploadedFiles = req.body.uploadedFiles,
            isAssembly = (req.body.isAssembly==="true"); //conversion to boolean 
        sails.log("SOCKET");
        sails.log(uploadedFiles);
        async.waterfall([
            function(cb) {
                sails.log('createBucket');
                new TranslationService(bucket).createBucket(policy)
                    .on('success', function(data) {
                        sails.log('Bucket created');
                        cb(null, data);
                    }).on('fail', function(error) {
                        sails.log('Failed to create bucket');
                        cb(error);
                    });
            },
            function(data, cb1) {
                sails.log('Upload Async');
                new TranslationService(bucket).uploadFile(uploadedFiles)
                    .on('success', function(data) {
                        sails.log('UPLOADED ');

                        cb1(null, data);
                    }).on('fail', function(error) {
                        sails.log('Upload failed');
                        cb1(error);
                    });
            },
            function(data, cb2) {
                var referenceObject = {
                        master: "",
                        dependencies: []
                    },
                    masterFile = [],
                    referenceFile = path.normalize(__dirname + '/../../uploaded/'),
                    objectInfo = {},
                    uploadedFileList = [];
                if (data.length === 1) {
                    uploadedFileList.push(JSON.parse(data[0]));
                    cb2(null, uploadedFileList);
                } else if (data.length > 1) {
                    //TODO maybe requires refactoring. Second forEach because master must be present before children
                    data.forEach(function(uploadedObject) {
                        sails.log.warn('FR1');
                        objectInfo = JSON.parse(uploadedObject);
                        if ((path.extname(objectInfo.objects[0].key) === ".SLDASM") && isAssembly) {
                            referenceObject.master = objectInfo.objects[0].id;
                            masterFile.push(objectInfo);
                        }
                    });
                    data.forEach(function(uploadedObject) {
                        objectInfo = JSON.parse(uploadedObject);
                        if (path.extname(objectInfo.objects[0].key) === ".SLDPRT") {
                            sails.log(req.body.isAssembly);
                            sails.log(isAssembly);
                            if (isAssembly===true) {
                                sails.log('FR2');
                                referenceObject.dependencies.push({
                                    file: objectInfo.objects[0].id,
                                    metadata: {
                                        childPath: objectInfo.objects[0].key,
                                        parentPath: masterFile[0].objects[0].key
                                    }
                                });
                            }
                        }
                        uploadedFileList.push(objectInfo);

                    });
                    if (isAssembly===true) {
                        jf.writeFile(referenceFile + 'objects_attrs.json', referenceObject, function(err) {
                            if (err) {
                                sails.log(err);
                            } else {
                                new TranslationService().setReferences(referenceFile + 'objects_attrs.json')
                                    .on('success', function(data) {
                                        sails.log('REF. UPLOAD');
                                        cb2(null, masterFile);
                                    })
                                    .on('fail', function(data) {
                                        sails.log('REF UPLOAD FAIL');
                                        cb2(data);
                                    });
                            }
                        });
                    } else {
                        sails.log(uploadedFileList);
                        cb2(null, uploadedFileList);
                    }
                }
            },
            function(objectsInfo, cb3) {
                sails.log.info('Translation process started');
                sails.log(objectsInfo);
                new TranslationService(bucket).register(objectsInfo)
                    .on('success', function(data) {
                        sails.log('Data');
                        sails.log(data);
                        cb3(null, data);
                    }).on('fail', function(error) {
                        sails.log('Translation failed');
                        cb3(error);
                    });
            }
        ], function(error, results) {
            if (error) {
                res.send(error);
            } else {
                sails.log('Results');
                if (req.isAuthenticated()) {
                    User.native(function(err, user) {
                        if (err) {
                            sails.log(err);
                        } else {
                            user.find({
                                email: req.user.email
                            }).toArray(function(error, userFound) {
                                if (error) {
                                    sails.log("db err 2");
                                    sails.log(error);
                                } else {
                                    results.forEach(function(result) {
                                        result.uploadedAt = moment().utc().format("YYYY-MM-DD");
                                    });
                                    user.update({
                                        _id: userFound[0]._id
                                    }, {
                                        $push: {
                                            uploadedModels: {
                                                $each: results
                                            }
                                        }
                                    }, function(err, updatedUser) {
                                        if (err) {
                                            sails.log('db err 3');
                                            sails.log(err);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                sails.log(results);
                res.send(results);
            }
        });
    },
    translateProgress: function(req, res) {
        var urn = req.params.urn;
        new TranslationService('').status(urn)
            .on('success', function(data) {
                res.send(data);
            }).on('fail', function(error) {
                res.send(error);
            });
    }
};
