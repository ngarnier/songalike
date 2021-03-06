import express from 'express'; // Express web server framework
import request from 'request'; // "Request" library
import querystring from 'querystring'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import rp from 'request-promise'
import { spotifyToken } from './helpers/spotify'

const port = process.env.PORT || 3030

const client_id = process.env["SPOTIFY_ID"],
client_secret = process.env["SPOTIFY_SECRET"],
redirect_uri = 'http://localhost:8888/callback', // Your redirect uri
spotifyBaseUrl = 'https://api.spotify.com',
spotifyAudioAnalysis = '/v1/audio-features/',
spotifySearch = '/v1/search',
geniusBaseUrl = 'https://api.genius.com',
geniusSearch = '/search',
genius_token = process.env["GENIUS_TOKEN"],
lastfmBaseUrl = 'http://ws.audioscrobbler.com/2.0/',
lastfm_id=process.env["LASTFM_ID"],
lastfmSimilar = `?method=track.getsimilar&format=json&api_key=${lastfm_id}`

let access_token,
  refresh_token,
  path

const stateKey = 'spotify_auth_state'
const app = express()

app.use(bodyParser.json()) // support json encoded bodies
.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
.set('view engine', 'pug')
.use('/public', express.static(__dirname + '/public'))
.use(cookieParser())

.get('/', (req, res) => {
  res.render('index')
})
.get('/search', async (req, res) => {
  let query_track = encodeURI(req.query.title)
  let query_artist = encodeURI(req.query.artist)

  // If the user wants the features of the song
  if (req.query.button == 'features') {
       // Searching for the song
       const token = await spotifyToken(client_id, client_secret)
       const options = {
         url: `${spotifyBaseUrl}${spotifySearch}?q=track:${query_track}%20artist:${query_artist}&type=track`,
         headers: {
           'Authorization': 'Bearer ' + token
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
  }
  else {
    console.log(`Searching similar songs to ${query_track} by ${query_artist}`)
    // Getting the similar list of tracks with LastFM
    const lastfm_options = {
      url: `${lastfmBaseUrl}${lastfmSimilar}&artist=${query_artist}&track=${query_track}`,
      json: true
    }

    rp(lastfm_options)
      .then(body => {
        if (body.similartracks) {
          console.log(body.similartracks)
          let tracks = body.similartracks.track.length > 9 ? body.similartracks.track.slice(0, 10) : body.similartracks.track
          if (body.similartracks.track.length > 0) {
            res.render('similar', {
              tracks: tracks,
              track: req.query.title,
              artist: req.query.artist
            })
          }
          else {
            res.render('index', {
              message: `Sorry, we couldn't find any song similar ${req.query.title} by ${req.query.artist}.`,
              instruction: `Try with another one?`
            })
          }
        }
        else {
          res.render('index', {
            message: `Sorry, we couldn't find ${req.query.title} by ${req.query.artist}.`,
            instruction: `Please try again and check the spelling of the Artist and Title names.`
          })
        }
      })
      .catch(err => {
        console.log(err)
      })
  }
  })

.listen(port)
console.log(`Server listening on ${port}`)
