const util = require('./util');
const spotify = require('./spotify');
window.login = require('./login');
window.viewHandler = require('./views');

window.currentView = {};
let activeResizes = 0;
let validFunctions;

$(document).ready(async () => {
	const user = await window.login.confirmLogin();
	if (user) {
		validFunctions = [ viewHandler.getArtistGraph, viewHandler.getSongGraph,
			viewHandler.getMultiSongGraph, viewHandler.getTop100, viewHandler.getFavorites ];
		fetchArtists();
		fetchChartDates();
		$('#user-name').html(user.data.first_name);
		$('body').show();
		const qs = new URLSearchParams(location.search);
		if (qs.get('state')) {
			const [ stateFunction, stateArgs ] = qs.get('state').split(':');
			const targetFunction = validFunctions.find(f => f.name === stateFunction);
			if (targetFunction) targetFunction(...stateArgs.split(','));
		}
		if (location.search.includes('code=')) await spotify.getSpotifyToken(qs.get('code'));
	}
	$(window).on('resize', () => {
		activeResizes++;
		setTimeout(() => {
			activeResizes--;
			if (activeResizes === 0 && currentView.graphFunction) {
				currentView.graphFunction(currentView.graphArgs, true);
			}
		}, 500);
	});
});

window.clearTitles = (hideSpotifyPlayer = true) => {
	$('#title').html('');
	$('#subtitle').html('');
	if (hideSpotifyPlayer && spotify.spotifyController && spotify.spotifyIsPlaying) spotify.spotifyController.togglePlay();
	if (hideSpotifyPlayer) $('#spotify-container').hide();
}

window.setCurrentView = (graph, graphFunction, graphArgs) => {
	currentView = { graph, graphFunction, graphArgs,
		previous: currentView ? currentView.graphFunction : null };
};

window.changeView = (functionName, args = '') => {
	const targetFunction = validFunctions.find(f => f.name === functionName);
	if (targetFunction) targetFunction(...args.split(','));
};

const fetchChartDates = chartId => {
	fetch('/charts/dates')
	.then(res => util.processFetchResponse(res))
	.then(json => {
		$('#chart-date').append(`<option value="">Select chart date</option>`);
		json.forEach(row => {
			$('#chart-date').append(`<option value="${row.id}">${row.date}</option>`);
		})
		if (chartId) $('#chart-date').val(chartId);
		$('footer').show();
	})
	.catch(err => console.error(err));

	$('#chart-date').on('change', event => {
		$('#chart-date > option').each((index, option) => {
			if (option.value === event.target.value) window.viewHandler.getTop100(option.text);
		});
	});
};

const fetchArtists = artistId => {
	fetch('/artists')
	.then(res => util.processFetchResponse(res))
	.then(json => {
		$('#artists').append(`<option value="">Select artist</option>`);
		json.forEach(artist => {
			$('#artists').append(`<option value="${artist.id}">${artist.name.substring(0, 50)}</option>`);
		})
		if (artistId) $('#artists').val(artistId);
		$('#artists').on('change', event => viewHandler.getArtistGraph($('#artists').val()));
	})
	.catch(err => console.error(err));
};
