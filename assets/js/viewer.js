/* global Autodesk */
$(function() {
    var tokenurl = 'http://' + window.location.host + '/api/token';
    var config = {
        environment: 'AutodeskProduction'
            //environment : 'AutodeskStaging'
    };
    var viewer = {};
    var viewerFactory = new Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory(
        tokenurl,
        config);
    var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
    console.log(paramUrn);
    var urn = paramUrn;
    var canvasBlobUrl = "";
    viewerFactory.getViewablePath(urn,
        function(pathInfoCollection) {
            var viewerConfig = {
                viewerType: 'GuiViewer3D'
            };

            viewer = viewerFactory.createViewer(
                $('#viewer')[0],
                viewerConfig);
            viewer.load(pathInfoCollection.path3d[0].path);
            viewer.addEventListener(
                Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                function(event) {
                    console.log("LOADED");
                    setTimeout(function() {
                        $('.viewer-options').show();
                    }, 1000);
                    $(document).on('click', '.export-to-png', function(e) {
                        canvasBlobUrl = viewer.getScreenShot();
                        $('.export-to-png').attr('href', canvasBlobUrl);
                    });

                });
        },
        onError);

});

function onError(error) {
    console.log('Error: ' + error);
}
