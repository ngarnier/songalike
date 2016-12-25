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
import rp from 'request-promise'

const port = process.env.PORT || 8080

const client_id = process.env["SPOTIFY_ID"],
  client_secret = process.env["SPOTIFY_SECRET"],
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

     // Searching for the song
       const options = {
         url: `${spotifyBaseUrl}${spotifySearch}?q=track:${title}%20artist:${artist}&type=track`,
         headers: {
           //'Authorization': 'Bearer ' + token
         },
         json: true
       }

       rp(options) // Make the request to look for the song
           .then(body => {
             // If the API returns something but not a list of songs as we're expecting
             if(typeof body.tracks.items["0"] === 'undefined') {
               res.render('index', {
                 message: `Sorry, we couldn't find your song.`,
                 instruction: `Please try again with the exact Artist and Title names.`
               })
             }
             // If the API returns a list of songs as expected
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

                // Authenticate on the API
                rp.post(authOptions)
                  .then(body => {
                    // Use the access token in the request for the audio features
                    var token = body.access_token;
                    const options = {
                      url: `${spotifyBaseUrl}${spotifyAudioAnalysis}${id}`,
                      headers: {
                        'Authorization': 'Bearer ' + token
                      },
                      json: true
                    }

                    // Make the request to get the Song's features
                    rp(options)
                      .then(body => {
                          let features = body
                          console.log(features)
                          res.render('features', {
                            status: `Song found`,
                            track: track,
                            artist: artist,
                            features: features
                          })
                      })
                      .catch(error => {
                        console.log(error) // Error from Spotify API
                      })
                  })
                  .catch(error => {
                    console.log(error)
                  })


                  if (!error && response.statusCode === 200) {
                    }
                //end
              }
           })
           .catch(err => {
              console.log(err) // Error when searching the song
           });
})

console.log(`Server listening on ${port}`)
app.listen(port);
