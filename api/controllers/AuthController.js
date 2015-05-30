/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var passport=require('passport');

module.exports = {
	login:function(req,res){
		passport.authenticate('local',function(err,user,info){
			if(err || !user){
				sails.log("Err1");
				sails.log(req.body);
				sails.log(err);
				return res.send({
					message:info,
					user:user
				});
			}
			req.logIn(user,function(err){
				if(err){
					sails.log("Err2");
					sails.log(user);
					return res.send(err);
				}
				return res.redirect('workspace');
			});
		})(req,res);
	},
	logout:function(req,res){
		req.logout();
		res.redirect('/');
	},
	register:function(req,res){
		var email=req.body.email,
			firstname=req.body.firstname,
			password=req.body.password,
			lastname=req.body.lastname;
		User.create({
			firstname:firstname,
			password:password,
			lastname:lastname,
			email:email
		},function(err,user){
			if(err){
				sails.log(err);
				return res.send(500,err);
			}else{
				sails.log(user);
				return res.redirect('login');
			}
		});
	}
};

