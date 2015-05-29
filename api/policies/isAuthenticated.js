module.exports=function(req,res,next){
	if(req.xhr){
       sails.log.warn("***AJAX***");
    }
	if(req.isAuthenticated()){
		return next();
	}else{
		res.redirect('login');
	}
};