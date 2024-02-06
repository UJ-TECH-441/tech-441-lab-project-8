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
