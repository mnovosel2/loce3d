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
	apiConfig = sails.config.translationApi;

function TranslationService(bucketName) {
	events.EventEmitter.call(this);
	this.bucketName = bucketName;
	console.log(this.bucketName);
	return this;
}
util.inherits(TranslationService, events.EventEmitter);


TranslationService.prototype.authenticate = function () {
	var _this = this;
	console.log(events.EventEmitter);
	request.post(apiConfig.baseUrl + '/authentication/v1/authenticate', {
		form: apiConfig
	}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				apiConfig.fetchedToken = JSON.parse(body);
				console.log(apiConfig.fetchedToken);
				_this.emit('success', apiConfig.fetchedToken);
			} else {
				_this.emit('fail', 'Token problem');
			}
		});
	return this;
};

TranslationService.prototype.checkBucket = function () {
	var _this = this;
	request(apiConfig.baseUrl + '/oss/v1/buckets/' + _this.bucketName + '/details', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			_this.emit('success', body);
		} else {
			_this.emit('fail', error);
		}
	});
	return this;
};
TranslationService.prototype.createBucket = function (policy) {
	var policy = policy || 'transient',
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
	}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				_this.emit('success', body);
			} else {
				console.log(error);
				_this.emit('fail', error);
			}
		});
	return this;
}
TranslationService.prototype.uploadFile = function (filename) {
	var _this = this,
		filePath = path.normalize(__dirname + '/../../uploaded/' + filename),
		filenameNoExt = path.basename(filename),
		file = null,
		uploadEndpoint = '/oss/v1/buckets/' + _this.bucketName + '/objects/' + filenameNoExt.replace(/ /g, '+');
	console.log(filePath);
	file = fs.readFile(filePath, function (error, data) {
		if (error) {
			console.log('FILE READ FAILED');
			return _this.emit('fail', error);
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
		}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					_this.emit('success', body);
				} else {
					_this.emit('fail', error);
				}
			});
	});
	return this;
}
//Register viewing service
TranslationService.prototype.register = function (urn) {
	var _this = this,
		urnEncoded = new Buffer(urn).toString('base64');
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
	}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				_this.emit('success', { 'urn': urnEncoded, body: body });
			} else {
				_this.emit('fail', error);
			}
		});
	return this;
}
TranslationService.prototype.status = function (urn, params) {
	var _this = this,
		params = params || {};
	console.log('URL');
	console.log(apiConfig.baseUrl + '/viewingservice/v1/' + urn + '/status');
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
	}, function (error, response, body) {
			console.log('Error');
			console.log(error);
			console.log('BODY***');
			console.log(body);
			if (!error && response.statusCode == 200) {
				console.log('success!!!');
				_this.emit('success', { 'urn': urn, body: body });
			} else {
				_this.emit('fail', error);
			}
		});
	return this;
}

module.exports = TranslationService;