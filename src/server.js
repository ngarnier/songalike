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
spotifySearch = '/v1/search',
geniusBaseUrl = 'https://api.genius.com',
geniusSearch = '/search',
genius_token = process.env["GENIUS_TOKEN"]
let access_token,
refresh_token
let path = "No lyrics found"

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
  let query_track = encodeURI(req.query.title)
  let query_artist = encodeURI(req.query.artist)

  // Searching for the song
  const options = {
    url: `${spotifyBaseUrl}${spotifySearch}?q=track:${query_track}%20artist:${query_artist}&type=track`,
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
      console.log(`Spotify:${id} for ${track} by ${artist}`)
      const genius_options = {
        url: `${geniusBaseUrl}${geniusSearch}?q=${artist}%20${track}`,
        headers: {
          'Authorization': 'Bearer ' + genius_token
        },
        json: true,
        timeout: 1000
      }

      rp(genius_options)
        .then(song => {
          console.log(`Genius ID: ${song.response.hits[0].result.id} for ${song.response.hits[0].result.full_title}`)
          path = song.response.hits[0].result.api_path
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
              // Send the results with the lyrics
              res.render('features', {
                status: `Song found`,
                track: track,
                artist: artist,
                features: features,
                path: path
              })
            })
            .catch(error => {
              console.log(error) // Error from Spotify API
            })
          })
          .catch(error => {
            console.log(error)
          })
          })
        .catch(error => {
          console.log('No lyrics found')
          path = "No lyrics found"
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
              // Send the results without the lyrics
              res.render('features', {
                status: `Song found`,
                track: track,
                artist: artist,
                features: features,
                path: path
              })
            })
            .catch(error => {
              console.log(error) // Error from Spotify API
            })
          })
          .catch(error => {
            console.log(error)
          })
        })
    }
  })
  .catch(err => {
    console.log(err) // Error when searching the song
  });

})

console.log(`Server listening on ${port}`)
app.listen(port)
