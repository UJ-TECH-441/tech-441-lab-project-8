(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const util = require('./util');

$(document).ready(async () => {
	if (location.search.includes('fail')) {
		$('#subtitle').html('Login failed.');
	}
	$('#login-button').on('click', async () => {
		await login();
	});
	$('#login-form input').on('keypress', async event => {
		if (event.keyCode == 13 || event.which == 13) {
			await login();
		}
	});
	$('#login-button').focus();
});

const login = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/login', {
				method: 'POST',
				body: JSON.stringify({ username: $('#username').val(), password: $('#password').val() }),
				headers: { 'Content-Type': 'application/json' }
			})
			.then(res => {
				if (res.redirected) return location.href = res.url;
				if (res.status === 401) return resolve(false);
				if (!res.ok) throw new Error(res.statusText);
				// TODO: Redirect user to the original path
				//if (!location.search || location.search.includes('login')) return location.href = '/';
				//location.href = `/${location.search}`;
				location.href = '/';
			})
			.catch(err => handleError(err) && reject());
		} catch (err) {
			reject(err);
		}
	});
};

module.exports.confirmLogin = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/login-check')
			.then(res => util.processFetchResponse(res))
			.then(json => resolve(json))
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject()
		}
	});
};

module.exports.logout = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/logout')
			.then(res => util.processFetchResponse(res))
			.then(json => resolve(json))
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject()
		}
	});
};

},{"./util":2}],2:[function(require,module,exports){
module.exports.processFetchResponse = async res => {
	if (res.redirected) return location.href = res.url;
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
};

module.exports.handleError = err => {
	console.error(err);
	return true;
}
},{}]},{},[1]);
