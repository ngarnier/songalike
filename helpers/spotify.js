'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.spotifyToken = undefined;

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var spotifyToken = exports.spotifyToken = async function spotifyToken(client_id, client_secret) {
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    var spotifyResponse = await _requestPromise2.default.post(authOptions);
    return spotifyResponse.access_token;
};