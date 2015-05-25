/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
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
        usingS3: true,
        s3: {
            adapter: null,
            key: 'AKIAJ72FTPHAGJXAV76A',
            secret: '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',
            bucket: 'worxcorebucket',
            endpoint: 's3-eu-west-1.amazonaws.com'
        }
    }
};
