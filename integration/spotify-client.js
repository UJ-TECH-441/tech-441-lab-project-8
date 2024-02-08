// currentAccessToken will be an object with all token data returned
// from Spotify along with the token expiration timestamp
let currentAccessToken;

const refreshAccessToken = () => {
	return new Promise((resolve, reject) => {
		try {
			// If the current token is still valid, no need to proceed
			if (currentAccessToken?.expires > Date.now()) return resolve();
			// Call Spotify token endpoint
			fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				// Include credentials from Spotify for Developers app
				body: `grant_type=client_credentials&client_id=${process.env.SPOTIFY_CLIENT_ID}&client_secret=${process.env.SPOTIFY_CLIENT_SECRET}`
			})
			.then(async res => await res.json())
			.then(result => {
				// New token received, so store it along with an expiration timestamp
				// of 60 minutes from now
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
			// Call /search endpoint with artist name and a year in which they were active
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
			// Call /search endpoint with song title and artist name
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

// All of the previous functions will call this one to make the connection to Spotify
const request = (path, options = {headers: {}}) => {
	return new Promise(async (resolve, reject) => {
		try {
			// Get a new access token if needed
			await refreshAccessToken();
			// The access token is set in the Authorization header with a "Bearer" prefix
			options.headers.authorization = `Bearer ${currentAccessToken.token}`;
			fetch(`https://api.spotify.com/v1${path}`, options)
				.then(async res => await res.json())
				.then(result => resolve(result))
				.catch(err => reject(err));
		} catch (err) { reject(err); }
	});
};

module.exports = { request, search, searchArtist, searchSong };
