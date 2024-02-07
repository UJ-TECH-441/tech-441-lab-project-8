const spotify = require('../integration/spotify-client');
const util = require('../util');

module.exports = app => {
	app.get('/spotify/search/song', util.checkAuth, async (req, res, next) => {
		try {
			const data = await spotify.searchSong(req.query.title, req.query.artist);
			res.json(data);
		} catch (err) { return util.routeError(res, err); }
	});

	app.get('/spotify/search/artist', util.checkAuth, async (req, res, next) => {
		try {
			const data = await spotify.searchArtist(req.query.name, req.query.year);
			res.json(data);
		} catch (err) { return util.routeError(res, err); }
	});

	app.get('/spotify/artists/id', util.checkAuth, async (req, res, next) => {
		const artist = await spotify.searchArtist(req.query.name, req.query.year);
		if (artist) return res.json({ id: artist.id, uri: artist.uri });
		res.json({});
	});

	app.get('/spotify/artist/top-tracks', util.checkAuth, async (req, res, next) => {
		const artist = await spotify.searchArtist(req.query.name, req.query.year);
		if (artist) {
			const data = await spotify.request(`/artists/${artist.id}/top-tracks?market=US`);
			if (!data.tracks || data.tracks.length === 0) return res.json([]);
			return res.json(data.tracks.map(track => track.uri));
		}
		res.json([]);
	});
};
