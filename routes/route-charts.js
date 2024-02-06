const database = require('../data/database');
const util = require('../util');
const passport = require('passport');

module.exports = app => {
	app.get('/charts/dates', util.checkAuth, async (req, res, next) => {
		const data = await database.query(`select id, substr(date, 1, 10) as date from chart order by date`);
		if (data[0].length === 0) return res.sendStatus(404);
		res.json(data[0]);
	});

	app.get('/charts/:date', util.checkAuth, async (req, res, next) => {
		if (!req.params.date.match(/^19\d\d-[01]\d-[0-3]\d$/)) return res.sendStatus(400);
		const data = await database.query(`select * from chart_view where date = '${req.params.date}' order by position`);
		if (data[0].length === 0) return res.sendStatus(404);
		data[0].forEach(data => {
			data.isTop40 = data.position <= 40;
			data.isTop10 = data.position <= 10;
			data.isUserFavSong = !!req.user.data.favorites.songs.find(song => song.id === data.song_id);
			data.isUserFavArtist = !!req.user.data.favorites.artists.find(artist => artist.id === data.artist_id);
			if (data.last_week) {
				data.changeNone = data.last_week === data.position;
				data.changeUp = (data.last_week - data.position) > 0;
				data.change = Math.abs(data.last_week - data.position);
			} else {
				data.isFirstWeek = true;
			}
		});
		res.json({
			id: data[0][0].chart_id,
			date: req.params.date,
			title: `Chart: ${req.params.date}`,
			data: data[0],
			loggedIn: !!req.user
		});
	});
};
