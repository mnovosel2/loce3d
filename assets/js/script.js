/// <reference path="../../typings/jquery/jquery.d.ts"/>
$(function() {
    $('#btn-translate-model').on('click', function(e) {
        var $uploadForm = $('.file-upload'),
            data = {};
        // if (uploadedFiles.length == 0) {
        // 	return;
        // }
        // $.each(uploadedFiles,function(key,value){
        data = new FormData($uploadForm[0]);
        // data.append(key,value);
        $.ajax({
            url: '//' + window.location.host + '/api/file',
            type: 'post',
            // headers:{
            // 	'x-file-name':value.name
            // },
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            complete: null
        }).done(function(data) {
            var uploadedFiles = data.uploadedFiles;
            uploadedFiles.forEach(function(uploadedFile) {
                $('#msg').text(uploadedFile.filename + ' uploaded');
            });
            translate(data);
        }).fail(function(xHr, ajaxOptions, error) {
            console.log(error);
            $('#msg').text(value.name + ' upload fail');
        });
        // })
    });
    $('#btn-add').on('click', function(e) {
        var urn = $('#urn').val().trim();
        if (urn != '') {
            addUrn(urn);
        }
    });
});

function addUrn(urn) {
    var id = urn.replace(/=+/g, ''),
        content = '<div class="list-group-item row">' + '<button id="' + id + '" type="text" class="form-control">' + urn + '</button></div>';
    $('#list').append(content);
    $('#' + id).on('click', function(e) {
        window.open('/preview/?urn=' + $(this).text(), '_blank');
    });
}

function translate(data) {
    console.log('translation started');
    console.log(data);
    io.socket.post('/api/translate', data, function(resData, jwRes) {
    	console.log(resData);
        resData.forEach(function(file) {
            $('#msg').empty().append(file.name + ' translation requested...');
            setTimeout(function() {
                translateProgress(file.urn);
            }, 5000);
        });
    });
}

function translateProgress(urn) {
    $.ajax({
        url: '/api/translate/progress/' + urn,
        type: 'get',
        data: null,
        contentType: 'application/json',
        complete: null
    }).done(function(response) {
        console.log(response);
        if (response.body.progress === 'complete') {
            addUrn(response.urn);
            $('#msg').text('Processing finished. Click on urn below.');
        } else {
            var name = window.atob(urn),
                filename = name.replace(/^.*[\\\/]/, '');
            $('#msg').text(filename + ': Processing. Please wait...');
            setTimeout(translateProgress(urn), 500);
        }
    }).fail(function(xHr, ajaxOptions, error) {
        $('#msg').text('Progress failed');
    });
}
