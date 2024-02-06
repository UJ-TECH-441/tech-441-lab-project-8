const database = require('../data/database');
const util = require('../util');
const moment = require('moment/moment');
const passport = require('passport');

module.exports = app => {
	app.get('/artists', util.checkAuth, async (req, res, next) => {
		const data = await database.query(`select * from artist order by name`);
		res.json(data[0]);
	});

	app.get('/artists/:id/songs/graph', util.checkAuth, async (req, res, next) => {
		const artistId = req.params.id;
		if (!artistId || !util.isValidUuid(artistId)) return res.sendStatus(400);
		const data = await database.query(`select * from chart_view where artist_id = '${artistId}' order by song_id, date`);
		if (data[0].length === 0) return res.sendStatus(404);
		const songs = {};
		let minDate, maxDate;
		data[0].forEach(chartWeek => {
			if (!minDate || chartWeek.date < minDate) minDate = chartWeek.date;
			if (!maxDate || chartWeek.date > maxDate) maxDate = chartWeek.date;
			if (!songs[chartWeek.song_id]) songs[chartWeek.song_id] = [];
			songs[chartWeek.song_id].push(chartWeek);
		});

		const min = moment(minDate);
		const max = moment(maxDate);
		const dates = [ min.toDate() ];

		do {
			min.add(1, 'week');
			if (min <= max) dates.push(min.toDate());
		} while (min <= max);

		const isFavoriteArtist = !!req.user.data.favorites.artists.find(a => a.id === artistId);
		res.json({ dates, charts: Object.values(songs), isFavoriteArtist });
	});

	app.get('/artists/:id/songs', util.checkAuth, async (req, res, next) => {
		const artistId = req.params.id;
		if (!artistId || !util.isValidUuid(artistId)) return res.sendStatus(400);
		const data = await database.query(
			`select * from artist_song_view where artist_id = '${req.params.id}' order by first_week`);
		if (data[0].length === 0) return res.sendStatus(404);
		const isFavorite = !!req.user.data.favorites.artists.find(a => a.id === artistId);
		res.json({ data: data[0], isFavorite });
	});
};
