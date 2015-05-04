var express = require('sails/node_modules/express');

module.exports.express = {
   bodyParser: function() {
    return function (req, res, next){
        console.log(req.path);
        if (!(req.path === '/api/file' && req.method === 'POST')) {
        return express.bodyParser()(req, res, next);
      } else {
        return next();
      }
    }
   }
}