'use strict';

var async = require('async');
var fs = require('fs');
var chalk = require('chalk');

var updateProject = require('./project/update');
var famouserror = require('./error');
var storage = require('../res/sdk-bundle').storage;
var register = require('./user/create');
var link = require('./project/link');
var npm = require('./util/npm');
var path = require('path');
var noSession = require('./user/noSession');
var waterfallChain = require('./util/waterfallDecorator').waterfallChain;
var waterfallPipe = require('./util/waterfallDecorator').waterfallPipe;
var waterfallVariadic = require('./util/waterfallDecorator').waterfallVariadic;

var checkDirectory = function checkDirectory(directoryPath, callback) {
    fs.readdir(directoryPath, function (error, files) {
        if (error) {
            if (error.code === 'ENOENT') {
                return callback(new Error('directory-does-not-exist'), null);
            }
            if (error.code === 'ENOTDIR') {
                return callback(new Error('not-directory'), null);
            }
        }
        if (!files.length) {
            return callback(new Error('empty-directory'), null);
        }
        return callback(error, {directoryPath: directoryPath});
    });
};

var checkSession = function checkSession(callback) {
    storage.getGlobal(function(error, config) {
        if (!config || !config.authentication_token) {
            return noSession(callback);
        }
        return callback(error, config);
    });
};

var checkWidget = function checkWidget(callback) {
    storage.getProjectMeta(function(error, config) {
        if (!config || !config.widget_id) {
            link(null, function(err, results) {
                if (err) {
                    return callback(err, null);
                }
                results.scripts = config.scripts;
                return callback(err, results);
            });
        } else {
            return callback(error, config);
        }
    });
};

var preDeployHook = function preDeployHook(data, callback) {
    if (data.scripts && data.scripts.deploy){
        return npm.runScripts(data.scripts.deploy, callback);
    } else {
        return callback(null, data);
    }
};

/**
 * deployProject
 *
 * Uploads project to Hub Services.
 */
var deployProject = function(directory, done) {

    var directoryPath = path.join(process.cwd(), directory);

    async.waterfall([
        waterfallChain(checkSession),
        waterfallChain(checkWidget),
        waterfallPipe(preDeployHook),
        waterfallVariadic(checkDirectory, directoryPath),
        updateProject
    ],
    function (error, results) {
        if (error) {
            if (error.message === 'empty-directory') {
                console.log(
                    chalk.red('\n\r Directory is empty, please use'),
                    chalk.red.bold('famous create.\n\r')
                );
            } else if (error.message === 'not-directory') {
                console.log(
                    chalk.red('\n\r Not a directory\r')
                );
            } else if (error.message === 'directory-does-not-exist') {
                console.log(
                    chalk.red('\n\r Directory does not exist\r')
                );
            } else if (error.message === 'error-npm-install') {
                console.log(
                    chalk.red('\n\r Error while building\r')
                );
            } else if (error.message === 'error-build') {
                console.log(
                    chalk.red('\n\r Error while building\n\r')
                );
            } else if (error.message === 'no-token') {
                console.log(
                    chalk.red('\n\r You must be authenticated, please login or register:')
                );
                register();
            } else if (error.message === '401') {
                console.log(
                    chalk.red('\n\r Invalid credentials, please try to login again.')
                );
            } else {
                var message = famouserror.message(error, results);
                if (message) {
                    console.log(message);
                    process.exit(1);
                }
                return;
            }
        }
        done(error, results);
    });
};

var deployCLI = function(directory) {
    if (!directory) {
        storage.getProjectMeta(function(error, config) {
            if (config && config.scripts && config.scripts['deploy-folder']) {
                directory = config.scripts['deploy-folder'];
            } else {
                directory = 'public';
            }
            deployProject(directory, function(){});
        });
    } else {
        deployProject(directory, function(){});
    }
};

/** **/

module.exports.deployCLI = deployCLI;
module.exports.deployProject = deployProject;
