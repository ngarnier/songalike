import rp from 'request-promise'

export const spotifyToken = async (client_id, client_secret) => {
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


    const spotifyResponse = await rp.post(authOptions)
    return spotifyResponse.access_token
}
