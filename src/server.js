/**
* This is an example of a basic node.js script that performs
* the Authorization Code oAuth2 flow to authenticate against
* the Spotify Accounts.
*
* For more information, read
* https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
*/

import express from 'express'; // Express web server framework
import request from 'request'; // "Request" library
import querystring from 'querystring'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import {spotify as credentials} from './credentials.js';

const port = process.env.PORT || 8080

const client_id = credentials.client_id, // Your client id
      client_secret = credentials.client_secret, // Your secret
  redirect_uri = 'http://localhost:8888/callback', // Your redirect uri
  spotifyBaseUrl = 'https://api.spotify.com',
  spotifyAudioAnalysis = '/v1/audio-features/',
  spotifySearch = '/v1/search'
let access_token,
refresh_token

const stateKey = 'spotify_auth_state';

const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('view engine', 'pug')

app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname))
.use(cookieParser());

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/search', (req, res) => {
     let title = encodeURI(req.query.title)
     let artist = encodeURI(req.query.artist)
     console.log(`title: ${title}`)


     // Searching for the song
       const options = {
         url: `${spotifyBaseUrl}${spotifySearch}?q=track:${title}%20artist:${artist}&type=track`,
         headers: {
           //'Authorization': 'Bearer ' + token
         },
         json: true
       }

       const callback = (error, response, body) => {
         if (!error) {
           if(typeof body.tracks.items["0"] === 'undefined') {
             res.render('index', {
               message: `Sorry, we couldn't find your song.`,
               message2: `Please try again with the exact Artist and Title names.`
             })
           }
           else {
             // Log the first result in the response
             let id = body.tracks.items["0"].id
             let track = body.tracks.items["0"].name
             let artist = body.tracks.items[0].album.artists[0].name
             console.log(`Song ID:${id} for ${track} by ${artist}`)
             // Authenticate to get the Track features
              var authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: {
                  'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
                },
                form: {
                  grant_type: 'client_credentials'
                },
                json: true
              };

              request.post(authOptions, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                  // Use the access token to access the audio features
                  var token = body.access_token;
                  const options = {
                    url: `${spotifyBaseUrl}${spotifyAudioAnalysis}${id}`,
                    headers: {
                      'Authorization': 'Bearer ' + token
                    },
                    json: true
                  }

                  const callback = (error, response, body) => {
                    if (!error) {
                      let features = body
                      console.log(features)
                      res.render('features', {
                        status: `Song found`,
                        track: track,
                        artist: artist,
                        features: features
                      })
                    }
                    else {
                      console.log(error) // Error from Spotify API
                    }
                  }

                  request(options, callback)
                }
              })
           }
         }
         else {
           console.log(error) // Error when searching the song
         }
       }
       request(options, callback)
})

console.log(`Server listening on ${port}`)
app.listen(port);
