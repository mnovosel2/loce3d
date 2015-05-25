/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {
    translationApi: {
        client_id: 'rSA4AopUe2Zqu3afzp4HdWSAQmKN9DRI',
        client_secret: 'RAB92TWhAHB2wJL4',
        appName: 'WorxCore',
        callbackUrl: 'https://stark-waters-4719.herokuapp.com/app',
        baseUrl: 'https://developer.api.autodesk.com',
        grant_type: 'client_credentials',
        fetchedToken: null,
        usingS3: false,
        s3: {
            adapter: null,
            key: '',
            secret: '',
            bucket: '',
            endpoint: ''
        }
    }

};
