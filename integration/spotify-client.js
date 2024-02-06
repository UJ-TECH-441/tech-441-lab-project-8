let currentAccessToken;

const refreshAccessToken = () => {
	return new Promise((resolve, reject) => {
		try {
			if (currentAccessToken?.expiration > Date.now()) resolve();
			fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'grant_type=client_credentials&client_id=2d0cef599d0742dfbdfc244d488b2a0d&client_secret=6208562e4fc547cda3964280ebc21805'
			})
			.then(async res => await res.json())
			.then(result => {
				if (result?.access_token) currentAccessToken = {
					expiration: Date.now() + (1000 * result.expires_in),
					token: result.access_token
				};
				resolve(currentAccessToken);
			})
			.catch(err => console.error(err));
		} catch (err) {
			reject(err);
		}
	});
}

const findArtist = query => {
	return new Promise(async (resolve, reject) => {
		try {
			await refreshAccessToken();
			fetch(`https://api.spotify.com/v1/search?${query}`, {
				headers: { Authorization: `Bearer ${currentAccessToken.token}` }
			})
			.then(async res => await res.json())
			.then(result => {
				resolve({
					image: result.artists.items[0]?.images[0]?.url,
					url: result.artists.items[0]?.href
				});
			});
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = { findArtist };
