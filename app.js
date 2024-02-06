// Import required packages
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userService = require('./services/service-user');
require('dotenv').config({ path: ['.env.local', '.env'] });

// Create Express instance
const app = express();

// Set port number (change if there is a conflicting service running on 3000)
const port = process.env.PORT || 3000;
app.set('port', port);

// Set up Express to handle JSON, URL encoding, POST bodies and static files
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: uuidv4(),
	store: new MemoryStore({}),
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false, maxAge: 180000 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
	process.nextTick(async () => {
		let user;
		const dbUser = await userService.getUserByUsername(username);
		if (dbUser[0].length > 0) {
			bcrypt.compare(password, dbUser[0][0].password, async (err, result) => {
				if (err) {
					console.error(err);
				} else if (result) {
					user = Object.assign({}, dbUser[0][0]);
					user.favorites = await userService.getUserFavorites(user.id);
					delete user.password;
					await userService.recordLogin(user.id);
					return done(null, user);
				}
				return done(null, false, { message: `Unknown user ${username}` });
			});
		}
	});
}));

passport.serializeUser(function(user, cb) {
	process.nextTick(function() {
		cb(null, { id: user.id, data: user });
	});
});

passport.deserializeUser(function(user, cb) {
	process.nextTick(function() {
		return cb(null, user);
	});
});

//app.use(passport.authenticate('session'));

app.use('/', async (req, res, next) => {
	if (!req.session.favorites) {
		//return res.redirect('/user/favorites');
		//req.session.favorites = { artists: [], songs: [] };
	}
	next();
});

// Register all files in the /routes directory as Express routes
const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(route => require(path.join(routesDir, route))(app));

// Create HTTP server and plug it with the Express instance
const server = http.createServer(app);

// Start server
server.listen(port);
server.on('listening', () => console.log(`Listening on port ${server.address().port}`));
