/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var bcrypt=require('bcrypt');

module.exports = {

  attributes: {
  		email:{
  			required:true,
  			type:'email',
  			unique:true
  		},
  		password:{
  			required:true,
  			type:'string'
  		},
  		firstname:{
  			type:'string',
  			required:true
  		},
  		lastname:{
  			type:'string',
  			required:true
  		},
      uploadedModels:{
        type:'array',
        defaultsTo:[]
      },
  		toJSON:function(){
  			var obj=this.toObject();
  			delete obj.password;
  			return obj;
  		}
  },
  beforeCreate:function(user,callback){
  	bcrypt.genSalt(10, function(err,salt){
  		bcrypt.hash(user.password,salt, function(err,passwordHash){
  			if(err){
  				sails.log(err);
  				callback(err);
  			}else{
  				user.password=passwordHash;
  				callback();
  			}
  		});
  	});
  }
};

