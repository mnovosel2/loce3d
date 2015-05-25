/* global Autodesk */
$(function () {
	var tokenurl = 'http://' + window.location.host + '/api/token';
    var config = {
        environment: 'AutodeskProduction'
		//environment : 'AutodeskStaging'
    };

    
    var viewerFactory = new Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory(
        tokenurl,
        config);
    var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
    console.log(paramUrn);
    var urn = paramUrn;

    viewerFactory.getViewablePath(urn,
        function (pathInfoCollection) {
            var viewerConfig = {
                viewerType: 'GuiViewer3D'
            };

            var viewer = viewerFactory.createViewer(
                $('#viewer')[0],
                viewerConfig);

            viewer.load(pathInfoCollection.path3d[0].path);
        },
        onError);
});

function onError(error) {
    console.log('Error: ' + error);
};