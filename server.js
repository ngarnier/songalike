'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Express web server framework
var port = process.env.PORT || 8080; // "Request" library
/**
* This is an example of a basic node.js script that performs
* the Authorization Code oAuth2 flow to authenticate against
* the Spotify Accounts.
*
* For more information, read
* https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
*/

var client_id = '044216bdc27d49e6b6cdf7f9ee469ef7',
    client_secret = 'eb91bc0ad00842638772d54f7696f8cf',
    redirect_uri = 'http://localhost:8888/callback',
    // Your redirect uri
spotifyBaseUrl = 'https://api.spotify.com',
    spotifyAudioAnalysis = '/v1/audio-features/',
    spotifySearch = '/v1/search';
var access_token = void 0,
    refresh_token = void 0;

var stateKey = 'spotify_auth_state';

var app = (0, _express2.default)();
app.use(_bodyParser2.default.json()); // support json encoded bodies
app.use(_bodyParser2.default.urlencoded({ extended: true })); // support encoded bodies

app.set('view engine', 'pug');

app.use(_express2.default.static(__dirname + '/public'));
app.use(_express2.default.static(__dirname)).use((0, _cookieParser2.default)());

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/search', function (req, res) {
  var title = encodeURI(req.query.title);
  var artist = encodeURI(req.query.artist);
  console.log('title: ' + title);

  // Searching for the song
  var options = {
    url: '' + spotifyBaseUrl + spotifySearch + '?q=track:' + title + '%20artist:' + artist + '&type=track',
    headers: {
      //'Authorization': 'Bearer ' + token
    },
    json: true
  };

  var callback = function callback(error, response, body) {
    if (!error) {
      if (typeof body.tracks.items["0"] === 'undefined') {
        res.render('index', {
          message: 'Sorry, we couldn\'t find your song.',
          message2: 'Please try again with the exact Artist and Title names.'
        });
      } else {
        var authOptions;

        (function () {
          // Log the first result in the response
          var id = body.tracks.items["0"].id;
          var track = body.tracks.items["0"].name;
          var artist = body.tracks.items[0].album.artists[0].name;
          console.log('Song ID:' + id + ' for ' + track + ' by ' + artist);
          // Authenticate to get the Track features
          authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
              'Authorization': 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
            },
            form: {
              grant_type: 'client_credentials'
            },
            json: true
          };


          _request2.default.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
              // Use the access token to access the audio features
              var token = body.access_token;
              var _options = {
                url: '' + spotifyBaseUrl + spotifyAudioAnalysis + id,
                headers: {
                  'Authorization': 'Bearer ' + token
                },
                json: true
              };

              var _callback = function _callback(error, response, body) {
                if (!error) {
                  var features = body;
                  console.log(features);
                  res.render('features', {
                    status: 'Song found',
                    track: track,
                    artist: artist,
                    features: features
                  });
                } else {
                  console.log(error); // Error from Spotify API
                }
              };

              (0, _request2.default)(_options, _callback);
            }
          });
        })();
      }
    } else {
      console.log(error); // Error when searching the song
    }
  };
  (0, _request2.default)(options, callback);
});

console.log('Server listening on ' + port);
app.listen(port);