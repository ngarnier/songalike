# songalike.

Give this little app your favorite song and you'll get information about it as well as a lit of similar songs.

## Services used
All credentials are stored as environment variables, don't forget to store yours before running the app.
- Spotify: Used to provide the song analysis and features.
- LastFM: Used to provide the list of similar songs.
- Genius: Used to provide lyrics.

## Architecture of the app
- `src` folder
  - `server.js`: The server of the app, built in Node.js and ES6. It is built with Babel with the `npm run postinstall` command (the compiled version is the `server.js` file located at the root of the app)
  - `styles.scss`: The styles of the app, built with `SCSS`. They are manually built with the `sass` CLI and outputted in the `public` folder as `CSS` files
- `views` folder: `pug` templates rendered by `server.js`
  - `index.pug`: the homepage of the app
  - `features.pug`: the song analysis page of the app
