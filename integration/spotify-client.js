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
			.catch(err => reject(err));
		} catch (err) { reject(err); }
	});
}

const searchArtist = (name, year) => {
	return new Promise(async (resolve, reject) => {
		try {
			const result = await request(
				`/search?type=artist&market=US&limit=1&q=${encodeURIComponent(`artist:${name} year:${year}`)}`
			);
			if (!result?.artists || result.artists.length === 0) return resolve({ status: 404 });
			resolve(result.artists.items[0]);
		} catch (err) { reject(err); }
	});
};

const searchSong = (title, artist) => {
	return new Promise(async (resolve, reject) => {
		try {
			const result = await request(
				`/search?type=track&market=US&limit=1&q=${encodeURI(`track:${title} artist:${artist}`)}`
			);
			if (!result?.tracks) return resolve({ status: 404 });
			resolve({ uri: result.tracks.items[0]?.uri });
		} catch (err) { reject(err); }
	});
};

const search = query => {
	return new Promise(async (resolve, reject) => {
		try {
			resolve(await request(`/search?${query}`));
		} catch (err) { reject(err); }
	});
};

const request = (path, options = {headers: {}}) => {
	return new Promise(async (resolve, reject) => {
		try {
			await refreshAccessToken();
			options.headers.authorization = `Bearer ${currentAccessToken.token}`;
			fetch(`https://api.spotify.com/v1${path}`, options)
				.then(async res => await res.json())
				.then(result => resolve(result))
				.catch(err => reject(err));
		} catch (err) { reject(err); }
	});
};

module.exports = { request, search, searchArtist, searchSong };
