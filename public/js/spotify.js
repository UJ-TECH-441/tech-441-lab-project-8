const util = require('./util');

let spotifyToken, spotifyPlayer, spotifyController, spotifyIsPlaying = false;

$(document).ready(async () => {
	$('#spotify-autoplay').on('change', e => {
		if (e.currentTarget.checked && spotifyController && !spotifyIsPlaying) spotifyController.play();
	});
});

window.onSpotifyIframeApiReady = IFrameAPI => {
	const element = document.getElementById('embed-iframe');
	const options = {
		width: 400,
		height: 80
	};
	const callback = EmbedController => spotifyController = EmbedController;
	IFrameAPI.createController(element, options, callback);
	spotifyController.addListener('playback_update', e => spotifyIsPlaying = !e.data.isPaused);
};

const addSpotifyUriToPlayer = uri => {
	if (!spotifyController || !uri) return;
	spotifyController.loadUri(uri);
	if ($('#spotify-autoplay').prop('checked')) spotifyController.play();
	$('#spotify-container').show();
	$('#spotify-autoplay-container').show();
}

const loadSpotifySong = (title, artist, callback) => {
	try {
		$('#spotify-autoplay-container').hide();
		fetch(`/spotify/search/song?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
		.then(res => util.processFetchResponse(res))
		.then(data => {
			if (callback) callback(null, data);
			if (data.uri) addSpotifyUriToPlayer(data.uri);
		})
		.catch(err => callback ? callback(err) : console.error(err));
	} catch (err) {
		callback ? callback(err) : console.error(err);
	}
};

const loadSpotifyArtist = (artist, year, callback) => {
	try {
		$('#spotify-autoplay-container').hide();
		fetch(`/spotify/artists/id/?name=${encodeURIComponent(artist)}&year=${year}`)
		.then(res => util.processFetchResponse(res))
		.then(data => {
			if (callback) callback(null, uris);
			if (data.uri) addSpotifyUriToPlayer(data.uri);
		})
		.catch(err => callback ? callback(err) : console.error(err));
	} catch (err) {
		callback ? callback(err) : console.error(err);
	}
};

module.exports = { addSpotifyUriToPlayer, loadSpotifySong, loadSpotifyArtist, spotifyToken, spotifyPlayer, spotifyController, spotifyIsPlaying };
