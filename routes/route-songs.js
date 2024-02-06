const database = require('../data/database');
const util = require('../util');

module.exports = app => {
	app.get('/songs/:id/graph', util.checkAuth, async (req, res, next) => {
		const songId = req.params.id;
		if (!songId || !util.isValidUuid(songId)) return res.sendStatus(400);
		const data = await database.query(`select * from chart_view where song_id = '${songId}' order by date`);
		if (data[0].length === 0) return res.sendStatus(404);
		const isFavoriteSong = !!req.user.data.favorites.songs.find(s => s.id === songId);
		const isFavoriteArtist = !!req.user.data.favorites.artists.find(a => a.id === data[0][0].artist_id);
		res.json({ data: data[0], isFavoriteSong, isFavoriteArtist });
	});
};
