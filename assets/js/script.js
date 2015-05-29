/// <reference path="../../typings/jquery/jquery.d.ts"/>
var isAssembly = false;
$(function() {
    $('#btn-translate-model').on('click', function(e) {
        var $uploadForm = $('.file-upload'),
            data = {};
        data = new FormData($uploadForm[0]);
        if ($('#assembly-structure').is(':checked')) {
            isAssembly = true;
        } else {
            isAssembly = false;
        }
        if (!$('#file-text').val()) {
            swal({
                title: "Please provide file to upload",
                text: "You have not selected any file to upload, please do so",
                type: "error",
                showCancelButton: false,
                confirmButtonColor: "#009688",
                confirmButtonText: "Ok"
            });
            return;
        } else {
            $('.progress').css("visibility", "visible");
        }

        $.ajax({
            url: '//' + window.location.host + '/api/file',
            type: 'post',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            complete: null
        }).done(function(data) {
            var uploadedFiles = data.uploadedFiles;
            uploadedFiles.forEach(function(uploadedFile) {
                $('#msg').text('Uploading... Please wait');
                $('#cancel').text('Cancel upload');
            });
            translate(data);
        }).fail(function(xHr, ajaxOptions, error) {
            $('.progress').css("visibility", "hidden");

            console.log(error);
            $('#msg').text(value.name + ' upload fail');
        });
    });
    $('#btn-add').on('click', function(e) {
        var urn = $('#urn').val().trim();
        if (urn !== '') {
            addUrn(urn);
        }
    });
});

function addUrn(urn) {
    var id = urn.replace(/=+/g, ''),
        content = '<div class="list-group-item col s12 m6">' + '<button id="' + id + '" type="text" class="btn waves-effect waves-light view-model" urn="' + urn + '">View model</button>' +
        '<div class="center-align"><iframe class="model-iframe" src="/preview/?urn=' + urn + '"></iframe></div></div>';
    $('#list').append(content);
    $('#' + id).on('click', function(e) {
        window.open('/preview/?urn=' + $(this).attr('urn'), '_blank');
    });
}
function translate(data) {
    console.log('translation started');
    data.isAssembly = isAssembly;
    console.log(data);
    $.ajax({
        url: '/api/translate',
        method: 'post',
        data: data
    }).done(function(resData) {
        console.log(resData);
        resData.forEach(function(file) {
            $('#msg').append(file.name + ' translation requested...');
            setTimeout(function() {
                translateProgress(file.urn);
            }, 5000);
        });
    }).fail(function(xHr, ajaxOptions, error) {
        console.log(error);
    });
}

function translateProgress(urn) {
    request = $.ajax({
        url: '/api/translate/progress/' + urn,
        type: 'get',
        data: null,
        contentType: 'application/json',
        complete: null
    }).done(function(response) {

        console.log(response);
        if (response.body.progress === 'complete') {
            addUrn(response.urn);
            $('.progress').css("visibility", "hidden");
            $('#msg').text('DONE !');
            $('#cancel').addClass("btn disabled");

            var audio = new Audio('/audio/beep.mp3');
            audio.play();
        } else {
            var name = window.atob(urn),
                filename = name.replace(/^.*[\\\/]/, '');
            $('#msg').text(filename + ': Processing. Please wait...');
            setTimeout(translateProgress(urn), 500);
        }
    }).fail(function(xHr, ajaxOptions, error) {
        $('#msg').text('Progress failed');
        $('.progress').css("visibility", "hidden");
    });
}
