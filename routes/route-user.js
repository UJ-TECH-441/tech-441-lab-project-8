const orderBy = require('lodash/orderBy');
const passport = require('passport');
const util = require('../util');
const database = require('../data/database');

module.exports = app => {
	app.get('/user/login-check', util.checkAuth, async (req, res, next) => {
		res.json(req.user);
	});

	app.post('/user/login', util.passportAuth, async (req, res, next) => {
		res.sendStatus(200);
	});

	app.get('/user/logout', util.checkAuth, async (req, res, next) => {
		req.session.user = null;
		req.session.save(err => {
			if (err) next(err);
			req.session.regenerate(err => {
				if (err) next(err);
				req.logout((err) => {
					if (err) { console.log(err); return next(err); }
					res.redirect('/');
				});
			})
		})
	});

	app.get('/user/favorites', util.checkAuth, async (req, res, next) => {
		try {
			res.json(req.user.data.favorites);
		} catch (err) {
			console.error(err);
			res.sendStatus(500);
		}
	});

	app.post('/user/favorites', util.checkAuth, async (req, res, next) => {
		try {
			if (!['artists', 'songs'].includes(req.body.type) || !util.isValidUuid(req.body.id)) {
				return res.sendStatus(400);
			}
			const index = req.user.data.favorites[req.body.type].findIndex(fav => fav.id === req.body.id);
			if (index >= 0) {
				await database.query(`delete from user_fav_${req.body.type} where user_id = ? and fav_id = ?`,
                	[ req.user.id, req.body.id]);
				req.user.data.favorites[req.body.type].splice(index, 1);
			} else {
				await database.query(`insert into user_fav_${req.body.type} values (?, ?)`,
					[req.user.id, req.body.id]);
				const data = await database.query(`select * from ${req.body.type.replace(/s$/, '')} where id = ?`,
					[req.body.id]);
				const name = data[0][0].title || data[0][0].name;
				req.user.data.favorites[req.body.type].push({id: req.body.id, name});
				req.user.data.favorites[req.body.type] = orderBy(req.user.data.favorites[req.body.type], ['name', 'title']);
			}
			res.json({success: true});
		} catch (err) {
			console.error(err);
			res.sendStatus(500);
		}
	});
};