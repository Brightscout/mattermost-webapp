// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint header/header: "off", dot-location: ["error", "property"] */

import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio-client';
import auth from '@feathersjs/authentication-client';
import io from 'socket.io-client';

// access to api

/* eslint-disable no-console, no-empty-function */
// Noop function to use for disabled log levels
const noopFn = () => {};

const infoLog = console.log.bind(window.console);
const warnLog = console.warn.bind(window.console);
const errorLog = console.error.bind(window.console);
/* eslint-enable no-console, no-empty-function */

/**
 * logger is a poor man's cheap logger for client code.
 *
 * It mostly just redirects to using the window console
 * log, EXCEPT it allows debug logging to be enabled or
 * disabled.
 *
 * By using this logger instead of console.log directly
 * we can more easily replace all logging with a fancier
 * logger package w/ more functionality at some later time
 * if desired.
 */
export const logger = {
    debug: infoLog,
    info: infoLog,
    warn: warnLog,
    error: errorLog,

    setLogLevel(level) {
        this.debug = noopFn;
        this.info = noopFn;
        this.warn = noopFn;
        this.error = noopFn;

        /* eslint-disable no-fallthrough */
        switch (level) {
        case 'debug':
            this.debug = infoLog;
        case 'info':
            this.info = infoLog;
        case 'warn':
            this.warn = warnLog;
        case 'error':
            this.error = errorLog;
        }
        /* eslint-enable no-fallthrough */
    },
};

// Default dataserver and signalmaster url and path values which work w/ the reverse proxy
export const config = {
    logLevel: 'debug',
    dataserverUrl: '/',
    dataserverPath: '/api/videodata',
    signalmasterUrl: '/',
    signalmasterPath: '/api/signalmaster',
};

// TODO: get the client log level from some real configuration sent from the server
const configLogLevel = process.env.CLIENT_ENV ? process.env.CLIENT_ENV.RIFF_LOGLEVEL : process.env.RIFF_LOGLEVEL;
config.logLevel = configLogLevel || 'debug';
logger.setLogLevel(config.logLevel);

// TODO: get the data server url and path from some real configuration sent from the server
logger.debug('path envs:', process.env.CLIENT_ENV, process.env.RIFF_SERVER_PATH);
const configDataserverUrl = process.env.CLIENT_ENV ? process.env.CLIENT_ENV.RIFF_SERVER_URL : process.env.RIFF_SERVER_URL;
const configDataserverPath = process.env.CLIENT_ENV ? process.env.CLIENT_ENV.RIFF_SERVER_PATH : process.env.RIFF_SERVER_PATH;

const configSignalmasterUrl = process.env.CLIENT_ENV ? process.env.CLIENT_ENV.SIGNALMASTER_URL : process.env.SIGNALMASTER_URL;
const configSignalmasterPath = process.env.CLIENT_ENV ? process.env.CLIENT_ENV.SIGNALMASTER_PATH : process.env.SIGNALMASTER_PATH;

// override the defaults w/ the config values
/* eslint-disable no-negated-condition, no-undefined */
config.dataserverUrl = configDataserverUrl !== undefined ? configDataserverUrl : config.dataserverUrl;
config.dataserverPath = configDataserverPath !== undefined ? configDataserverPath : config.dataserverPath;
config.signalmasterUrl = configSignalmasterUrl !== undefined ? configSignalmasterUrl : config.signalmasterUrl;
config.signalmasterPath = configSignalmasterPath !== undefined ? configSignalmasterPath : config.signalmasterPath;
/* eslint-enable no-negated-condition, no-undefined */

logger.debug('data server socket:', {url: config.dataserverUrl, path: config.dataserverPath + '/socket.io'});

export const socket = io(config.dataserverUrl, {
    timeout: 20000,
    path: config.dataserverPath + '/socket.io',
    transports: [
        'websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
    ],
});

export var app = feathers()
    .configure(socketio(socket))
    .configure(auth({jwt: {}, local: {}}));
