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
var formidable = require('formidable'),
	path = require('path'),
	fs = require('fs'),
	apiConfig = sails.config.translationApi;

module.exports = {
	renderHome:function(req, res){
			new TranslationService().authenticate();
			res.render('home/index');
	},
	getToken:function(req,res){
		new TranslationService().authenticate().on('success',function(data){
			res.send(data);
		}).on('fail',function(data){
			res.badRequest(data);
		})
	},
	parseUploadForm: function (req, res) {
		var filename = '',
			fileUploaded = false,
			form = new formidable.IncomingForm();
		console.log('Uploading...backend');
		form.uploadDir = path.normalize(__dirname + '/../../uploaded/');
		form.on('field', function (field, value) {
			console.log(field, value);
		}).on('file', function (field, file) {
			fs.rename(file.path, form.uploadDir + '/' + file.name);
			filename = file.name;
			fileUploaded = true;
		}).on('end', function () {
			console.log('uploaded');
			if (!fileUploaded) {
				res.status(500).end('File missing');
			} else {
				res.send({
					'name': filename
				});
			}
		});
		form.parse(req);
	},
	translateFile: function (req, res) {
		console.log(apiConfig.fetchedToken);
		var filePath = path.normalize(__dirname + '/../../uploaded/' + req.body.name),
			bucket = 'model' + new Date().toISOString().replace(/T/, '-').replace(/:+/g, '-').replace(/\..+/, '')
				+ '-' + apiConfig.fetchedToken.access_token.toLowerCase().replace(/\W+/g, ''),
			policy = 'transient',
			filename=req.body.name;
			console.log('TRANSLATE FILE');
		async.waterfall([
			function (cb) {
				console.log('createBucket');
				new TranslationService(bucket).createBucket(policy)
					.on('success', function (data) {
						console.log('Bucket created');
						cb(null, data);
				}).on('fail', function (error) {
					console.log('Failed to create bucket');
					cb(error);
				});
			},
			function (data, cb1) {
				console.log('Upload Async');
				new TranslationService(bucket).uploadFile(filename)
					.on('success', function (data) {
						console.log('UPLOADED ' + filePath);
						cb1(null, data);
				}).on('fail', function (error) {
					console.log('Upload failed');
					cb1(error);
				});
			},
			function (data, cb2) {
				console.log('Translation process');
				var urn = JSON.parse(data).objects[0].id;
				new TranslationService(bucket).register(urn)
					.on('success',function(data){
							console.log('Translation started');
							cb2(null,data);
					}).on('fail',function(error){
						console.log('Translation failed');
						cb2(error);
					});
			}
		], function (error, results) {
				if(error){
					res.send(error);
				}else{
					res.send(results);
				}
		});
	},
	translateProgress:function(req,res){
		var urn =req.params.urn;
		new TranslationService('').status(urn)
			.on('success',function(data){
				console.log(data.progress);
				res.send(data);
			}).on('fail',function(error){
				res.send(error);
			});
	}
};

