const spotify = require('../integration/spotify-client');
const util = require('../util');

module.exports = app => {
	app.get('/spotify/artists/:name', util.checkAuth, async (req, res, next) => {
		const data = await spotify.findArtist(`type=artist&q=${encodeURIComponent(req.params.name)}`);
		res.json(data);
	});

//	app.get('/spotify/login', (req, res) => {
//		const authParams = new URLSearchParams({
//			response_type: 'code',
//			client_id: process.env.SPOTIFY_CLIENT_ID,
//			scope: 'streaming user-read-email user-read-private',
//			redirect_uri: `http://localhost:${process.env.PORT || 3000}`
//		})
//		res.json({ url: `https://accounts.spotify.com/authorize/?${authParams.toString()}` });
//	});
//
//	app.get('/spotify/token', (req, res) => {
//		fetch('https://accounts.spotify.com/api/token',
//			{
//				method: 'POST',
//				body: `code=${req.query.code}&redirect_uri=http://localhost:${process.env.PORT || 3000}&grant_type=authorization_code`,
//				headers: {
//					'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
//					'Content-Type': 'application/x-www-form-urlencoded'
//			}
//		})
//		.then(async res => await res.json())
//		.then(json => res.json(json))
//		.catch(err => {
//			console.error(err);
//			return res.sendStatus(500);
//		})
//	});
};
