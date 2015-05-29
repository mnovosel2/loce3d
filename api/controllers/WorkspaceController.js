/**
 * WorkspaceController
 *
 * @description :: Server-side logic for managing workspaces
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    workspace: function(req, res) {
        var protocol = req.connection.encrypted ? 'https' : 'http',
            url = protocol + '://' + req.headers.host + '/';
        res.render('workspace/index', {
            user: req.user || false,
            url: url
        });
    }
};
