const spotify = require('../integration/spotify-client');
const util = require('../util');

module.exports = app => {
	app.get('/spotify/artists/:name', util.checkAuth, async (req, res, next) => {
		const data = await spotify.findArtist(`type=artist&q=${encodeURIComponent(req.params.name)}`);
		res.json(data);
	});
};
