let currentAccessToken;

const refreshAccessToken = () => {
	return new Promise((resolve, reject) => {
		try {
			if (currentAccessToken?.expires > Date.now()) resolve();
			fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`
			})
			.then(async res => await res.json())
			.then(result => {
				if (result?.access_token) currentAccessToken = {
					expires: Date.now() + (1000 * result.expires_in),
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
