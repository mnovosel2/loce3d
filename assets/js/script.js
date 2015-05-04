/// <reference path="../../typings/jquery/jquery.d.ts"/>
$(function () {
	$('#btn-translate-model').on('click', function (e) {
		var uploadedFiles = document.getElementById('files').files,
			data={};
		if (uploadedFiles.length == 0) {
			return;
		}
		$.each(uploadedFiles,function(key,value){
			data=new FormData();
			data.append(key,value);
			$.ajax({
				url:'//'+window.location.host+'/api/file',
				type:'post',
				headers:{
					'x-file-name':value.name
				},
				data:data,
				cache:false,
				processData:false,
				contentType:false,
				complete:null
			}).done(function(data){
				$('#msg').text(value.name+' uploaded');
				translate(data);
			}).fail(function(xHr,ajaxOptions,error){
				console.log(error);
				$('#msg').text(value.name+' upload fail');
			});
		})
	});
	$('#btn-add').on('click',function(e){
		var urn=$('#urn').val().trim();
		if(urn!=''){
			addUrn(urn);
		}
	});
});

function addUrn(urn){
	var id=urn.replace(/=+/g, ''),
		content='<div class="list-group-item row">'
				+'<button id="'+id+'" type="text" class="form-control">'
				+urn+'</button></div>';
	$('#list').append(content);
	$('#'+id).on('click',function(e){
			window.open('/preview/?urn='+$(this).text(),'_blank');
	});
}
function translate(data){
	console.log('translation started');
	$('#msg').text(data.name+' translation started');
	$.ajax({
		url:'/api/translate',
		type:'post',
		data:JSON.stringify(data),
		timeout:0,
		contentType:'application/json',
		complete:null
	}).done(function(response){
		$('#msg').text(data.name+' translation requested...');
		setTimeout(function(){
			translateProgress(response.urn);
		},5000);
	}).fail(function(xHr,ajaxOptions,error){
		console.log(error);
		$('#msg').text(data.name+' translation request failed');
	});
}
function translateProgress(urn){
	$.ajax({
		url:'/api/translate/progress/'+urn,
		type:'get',
		data:null,
		contentType:'application/json',
		complete:null
	}).done(function(response){
		console.log(response);
		if(response.progress='complete'){
			addUrn(response.urn);
			$('#msg').empty();
		}else{
			var name=window.atob(urn),
				filename=name.replace(/^.*[\\\/]/,'');
			$('#msg').text(filename+': '+response.progress);
			setTimeout(function(){
				translateProgress(urn);
			},500);
		}
	}).fail(function(xHr,ajaxOptions,error){
		$('#msg').text('Progress failed');
	});
}