# songalike.

Give this little app your favorite song and you'll get information about it as well as a list of similar songs.

## Getting started
- `git clone`
- Replace your API Keys in the `server.js` file located in `src` (see https://github.com/ngarnier/songalike#services-used)
- `npm install && npm run postinstall && npm start`
- The app is running on `localhost:3030` or the `port` set by your environment.

## Services used
All credentials are stored as environment variables, don't forget to store yours before running the app.
- [Spotify](https://developer.spotify.com/web-api/): Used to provide the song analysis and features.
  - `SPOTIFY_ID`: your Spotify API Client ID
  - `SPOTIFY_SECRET`: your Spotify API Client Secret Key
- [Last.fm](http://www.last.fm/api/intro): Used to provide the list of similar songs.
  - `LASTFM_ID`: your Last.fm API ID
- [Genius](https://docs.genius.com/): Used to provide lyrics.
  - `GENIUS_TOKEN`: your Genius API token

## Architecture of the app
- `src` folder
  - `server.js`: The server of the app, built in Node.js and ES6. It is built with Babel with the `npm run postinstall` command (the compiled version is the `server.js` file located at the root of the app)
  - `styles.scss`: The styles of the app, written in `SCSS`. It is manually built with the `Sass` CLI (the `CSS` output is located in the `public` folder)
- `views` folder: `pug` templates rendered by `server.js`
  - `index.pug`: the homepage of the app
  - `features.pug`: the song analysis page of the app
- `public` folder: static style and script files
