const passport = require('passport');

module.exports = {
	isValidUuid: uuid => !!uuid.match(/^[A-F\d]{8}-([A-F\d]{4}-){3}[A-F\d]{12}$/i),
	passportAuth: passport.authenticate('local', { failureRedirect: '/login.html?failure' }),
	checkAuth: (req, res, next) => {
		if (!req.isAuthenticated()) {
			return res.redirect(`/login.html?path=${encodeURIComponent(req.path)}`);
		}
		return next();
	}
};
