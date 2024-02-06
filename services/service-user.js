const database = require('../data/database');

module.exports = {
	getUserByUsername: async username => {
		return await database.query('select * from user where lower(username) = ?', [ username ]);
	},

	getUserFavorites: async userId => {
		const artists = await database.query(`select a.id, a.name from user_fav_artists u join artist a on 
    		u.fav_id = a.id where u.user_id = ? order by lower(a.name)`, [ userId ]);
		const songs = await database.query(`select s.id, s.title as name from user_fav_songs u join song s on 
    		u.fav_id = s.id where u.user_id = ? order by lower(s.title)`, [ userId ]);
		const favorites = { artists: artists[0], songs: songs[0] };
		return favorites;
	},

	recordLogin: async userId => {
		return await database.query('update user set last_login_date = ? where id = ?', [ new Date(), userId ]);
	}
};
