(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./login":2,"./spotify":3,"./util":4,"./views":7}],2:[function(require,module,exports){
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

},{"./util":4}],3:[function(require,module,exports){
const util = require('./util');

let spotifyToken, spotifyPlayer, spotifyController, spotifyIsPlaying = false;

$(document).ready(async () => {
	$('#spotify-autoplay').on('change', e => {
		if (e.currentTarget.checked && spotifyController) spotifyController.play();
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
	spotifyController.addListener('playback_update', e => {
		spotifyIsPlaying = !e.data.isPaused
		console.log(spotifyIsPlaying);
	} );
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

},{"./util":4}],4:[function(require,module,exports){
module.exports.processFetchResponse = async res => {
	if (res.redirected) return location.href = res.url;
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
};

module.exports.handleError = err => {
	console.error(err);
	return true;
}
},{}],5:[function(require,module,exports){
const util = require('../util');
const spotify = require('../spotify');

const getArtistGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			clearTitles();
			fetch(`/artists/${artistId}/songs`)
			.then(res => util.processFetchResponse(res))
			.then(res => {
				const json = res.data;
				$('#title').html(`${window.viewHandler.hearts.heartIcon('a', json[0].artist_id, res.isFavorite)} ${json[0].artist_name}: Chart Performance`);
				const subtitle = (json.length === 1 ? '' : `<div class="bold"><a class="bold" 
					href="javascript:window.viewHandler.getMultiSongGraph('${json[0].artist_id}');">View weekly performance for all songs by 
					${json[0].artist_name.replace(/^The /, 'the ')}</a></div>`) +
					'<div>Click titles to view chart performance graphs</div>';
				$('#subtitle').html(subtitle);
				const config = Object.assign({}, window.baseConfig);
				config.data = { datasets: Object.assign([], window.baseDatasets) };
				config.data.labels = json.map(song => song.peak_week.substring(0, 10));
				config.data.datasets[0].label = 'Chart Position';
				config.data.datasets[0].data = json.map(song => song.peak_position);
				config.options.onClick = event => {
					const points = currentView.graph.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
					if (points.length) window.viewHandler.getSongGraph(json[points[0].index].song_id);
				};
				config.options.plugins.datalabels.color = ctx => '#1880e7';
				config.options.plugins.datalabels.align = ctx => ctx.dataIndex === 0 ? 'right' :
					(json.length > 1 && ctx.dataIndex === json.length - 1) ? 'left' : 'bottom';
				config.options.plugins.datalabels.formatter = (value, ctx) => {
					let title = json[ctx.dataIndex].song_title;
					if (title.length >= 8) title = title.replace(/^(.{8}\w*)\s/, '$1\n');
					return `#${json[ctx.dataIndex].peak_position} ${title}`;
				};
				config.options.plugins.datalabels.listeners = {
					click: (ctx, event) => window.viewHandler.getSongGraph(json[ctx.dataIndex].song_id)
				}
				window.viewHandler.hearts.setHeartMouseEvents();
				if (!isResize) spotify.loadSpotifyArtist(json[0].artist_name, json[0].peak_week.substring(0, 4));
				resolve(window.displayGraph(config, getArtistGraph, [ artistId ]));
			})
			.catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

module.exports = { getArtistGraph };

},{"../spotify":3,"../util":4}],6:[function(require,module,exports){
const util = require('../util');

const setHeartMouseEvents = () => {
	$('.heart').on('mouseover', e => heartMouseEvent(e));
	$('.heart').on('mouseout', e => heartMouseEvent(e));
	$('.heart').on('click', e => heartMouseEvent(e));
};

const heartMouseEvent = async event => {
	const type = event.currentTarget.id.includes('-a-') ? 'artists' : 'songs';
	const element = $(`#${event.currentTarget.id}`);
	switch (event.originalEvent.type) {
		case 'mouseover':
			if (element.hasClass('fa-solid')) {
				element.removeClass('fa-solid heart-filled');
				element.addClass('fa-regular');
			} else {
				element.removeClass('fa-regular');
				element.addClass('fa-solid heart-filled');
			}
			break;
		case 'mouseout':
			if (element.hasClass('fa-solid')) {
				element.removeClass('fa-solid heart-filled');
				element.addClass('fa-regular');
			} else {
				element.removeClass('fa-regular');
				element.addClass('fa-solid heart-filled');
			}
			break;
		case 'click':
			try {
				await sendHeartEvent(type, event.currentTarget.id.substring(8));
				if (element.hasClass('fa-solid')) {
					element.removeClass('fa-solid heart-filled');
					element.addClass('fa-regular');
				} else {
					element.removeClass('fa-regular');
					element.addClass('fa-solid heart-filled');
				}
			} catch (err) {
				// Logged out?
				console.error(err);
			}
			break;
	};
};

const heartIcon = (type, id, isFavorite) =>
	`<i id="heart-${type}-${id}" class="fa-heart heart heart-large ${isFavorite ? 'fa-solid heart-filled' : 'fa-regular'}"></i>`;

const sendHeartEvent = (type, id) => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/favorites', {
				method: 'POST',
				body: JSON.stringify({ type, id }),
				headers: { 'Content-Type': 'application/json '}
			})
			.then(res => util.processFetchResponse(res))
			.then(json => resolve())
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};

const getFavorites = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch(`/user/favorites`)
			.then(res => util.processFetchResponse(res))
			.then(data => {
				window.clearTitles(false);
				$('#chartjs-canvas-container').hide();
				const template = Handlebars.compile($('#favorites-template').html());
				$('#content-container').html(template(data));
				$('#content-container').show();
				setHeartMouseEvents();
				window.setCurrentView(null, window.viewHandler.getFavorites, [ ]);
				$('#title').html('<div>Your Favorites</div>');
				resolve();
			})
			.catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

module.exports = {
	hearts: { heartMouseEvent, setHeartMouseEvents, sendHeartEvent, heartIcon },
	getFavorites
};

},{"../util":4}],7:[function(require,module,exports){
const util = require('../util');
const { getArtistGraph } = require('./artist-graph');
const { getSongGraph } = require('./song-graph');
const { getMultiSongGraph } = require('./multi-song-graph');
const { getTop100 } = require('./top-100');
const { hearts, getFavorites } = require('./favorites');

module.exports = { getArtistGraph, getSongGraph, getMultiSongGraph, getTop100, getFavorites, hearts };

$(document).ready(async () => {
	Chart.register(ChartDataLabels);
});

window.displayGraph = (config, graphFunction, graphArgs) => {
	$('#content-container').hide();
	if (window.currentView.graph) window.currentView.graph.destroy();
	$('#chartjs-canvas-container').children().remove();
	const canvas = document.createElement('canvas');
	$(canvas).attr('id', 'chartjs-canvas');
	$(canvas).appendTo($('#chartjs-canvas-container'));
	const graph = new Chart($('#chartjs-canvas'), config);
	scroll({ top: 0 });
	$('#chartjs-canvas-container').show();
	window.setCurrentView(graph, graphFunction, graphArgs);
};

window.baseDatasets = [{
	borderColor: '#bbccdd',
	clip: false,
	pointRadius: 7,
	pointBackgroundColor: '#1880e7',
	pointBorderColor: '#1469be',
	pointHoverRadius: 12,
	pointHoverBackgroundColor: '#ffcc00',
	pointHoverBorderColor: '#eabb00'
}];

window.baseConfig = {
	type: 'line',
	options: {
		responsive: true,
		animation: {
			onComplete: () => {
			}
		},
		plugins: {
			legend: {
				position: 'top',
				labels: {
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 13,
						weight: 600
					}
				}
			},
			datalabels: {
				color: 'black',
				font: {
					size: 16,
					family: 'Rubik,sans-serif',
					weight: 600
				},
				rotation: 0,
				offset: 15
			}
		},
		scales: {
			x: {
				ticks: {
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 16,
						weight: 'bold'
					}
				}
			},
			y: {
				min: 1,
				max: 100,
				reverse: true,
				ticks: {
					stepSize: 5,
					color: 'black',
					font: {
						family: 'Rubik,sans-serif',
						size: 16,
						weight: 'bold'
					}
				}
			}
		}
	},
};

},{"../util":4,"./artist-graph":5,"./favorites":6,"./multi-song-graph":8,"./song-graph":9,"./top-100":10}],8:[function(require,module,exports){
const util = require('../util');
const spotify = require('../spotify');

const getMultiSongGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			clearTitles(false);
			fetch(`/artists/${artistId}/songs/graph`)
			.then(res => util.processFetchResponse(res))
			.then(data => {
				$('#title').html(`${window.viewHandler.hearts.heartIcon('a', data.charts[0][0].artist_id, data.isFavoriteArtist)} ${data.charts[0][0].artist_name}: All Songs`);
				$('#subtitle').html(`
					<div class="bold"><a href="javascript:window.viewHandler.getArtistGraph('${data.charts[0][0].artist_id}')">View peak positions only</a></div>
					<div>Click titles to see details for specific songs or graph points to view full chart for corresponding week</div>
				`);
				if (!isResize && !spotify.spotifyIsPlaying) {
					console.log(spotify.spotifyIsPlaying);
					spotify.loadSpotifyArtist(data.charts[0][0].artist_name, data.dates[0].substring(0, 4));
				}
				const config = Object.assign({}, baseConfig);
				config.data = { datasets: Object.assign([], baseDatasets) };
				config.data.labels = data.dates.map(date => date.substring(0, 10));
				config.data.datasets = data.charts.map(song => {
					const data = {};
					song.forEach(song => data[song.date.substring(0, 10)] = song.position);
					return {
						label: song[0].song_title,
						data,
						clip: false,
						tension: 0.1,
						pointRadius: 5,
						pointHoverRadius: 10
					};
				});
				config.options.onClick = (ctx, event) => {
					const date = data.charts[event[0].datasetIndex][event[0].index].date.substring(0, 10);
					window.viewHandler.getTop100(date);
				};
				config.options.plugins.legend = {
					position: 'top',
					labels: {
						color: 'black',
						font: {
							family: 'Rubik,sans-serif',
							size: 12
						}
					},
					onClick: (event, legendItem, legend) => {
						const songId = data.charts[legendItem.datasetIndex][0].song_id;
						window.viewHandler.getSongGraph(songId);
					}
				};
				config.options.plugins.datalabels.align = 'bottom';
				config.options.plugins.datalabels.formatter = (value, ctx) => {};
				window.viewHandler.hearts.setHeartMouseEvents();
				resolve(window.displayGraph(config, getMultiSongGraph, [ artistId ]));
			})
			.catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

module.exports = { getMultiSongGraph };

},{"../spotify":3,"../util":4}],9:[function(require,module,exports){
const util = require('../util');
const spotify = require('../spotify');

const getSongGraph = (songId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!songId) return resolve();
			if (!isResize) clearTitles();
			fetch(`/songs/${songId}/graph`)
			.then(res => util.processFetchResponse(res))
			.then(res => {

				const data = res.data;
				$('#title').html(`${window.viewHandler.hearts.heartIcon('s', data[0].song_id, res.isFavoriteSong)} "${data[0].song_title}" by 
						${window.viewHandler.hearts.heartIcon('a', data[0].artist_id, res.isFavoriteArtist)} <a href="javascript:window.viewHandler.getArtistGraph('${data[0].artist_id}')">${data[0].artist_name}</a>`);
				$('#subtitle').html(`
						<div class="bold">All songs by ${data[0].artist_name.replace(/^The /, 'the ')}: 
						<a href="javascript:window.viewHandler.getArtistGraph('${data[0].artist_id}')">Peak position</a> | 
						<a href="javascript:window.viewHandler.getMultiSongGraph('${data[0].artist_id}')">Weekly performance</a></div>
						<div>Click graph points to view full charts for each week</div>
					`);

				if (!isResize) spotify.loadSpotifySong(data[0].song_title, data[0].artist_name);
				fetch(`/artists/${data[0].artist_id}/songs`)
				.then(res => util.processFetchResponse(res))
				.then(otherSongs => {
					if (otherSongs.data.length > 1) {
						if ($('#artist-other-songs')) $('#artist-other-songs').remove();
						const artistOtherSongs = document.createElement('select');
						$(artistOtherSongs).html('');
						$(artistOtherSongs).attr('id', 'artist-other-songs');
						$(artistOtherSongs).append(`<option value="">Other songs by ${data[0].artist_name}</option>`);
						otherSongs.data.forEach(song => {
							$(artistOtherSongs).append(`<option value="${song.song_id}">${song.song_title} (#${song.peak_position}, ${song.first_week.substring(0, 4)})</option>`);
						});
						$(artistOtherSongs).on('change', () => getSongGraph($(artistOtherSongs).val()));
						$('#subtitle').prepend(artistOtherSongs);
					}
				})
				.catch(err => console.error(err));

				const config = Object.assign({}, baseConfig);
				config.data = { datasets: Object.assign([], baseDatasets) };
				config.data.labels = data.map(song => song.date.substring(0, 10));
				config.data.datasets[0].label = 'Chart Position';
				config.data.datasets[0].data = data.map(song => song.position);
				config.options.onClick = event => {
					const points = currentView.graph.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
					if (points.length) window.viewHandler.getTop100(data[points[0].index].date.substring(0, 10));
				};
				config.options.plugins.datalabels.offset = 10;
				config.options.plugins.datalabels.align = 'bottom';
				config.options.plugins.datalabels.formatter = (value, ctx) => data[ctx.dataIndex].position;
				config.options.plugins.datalabels.listeners = {
					click: (ctx, event) => window.viewHandler.getTop100(data[ctx.dataIndex].date.substring(0, 10))
				};
				config.options.tooltip = {yAlign: 'bottom'};
				window.viewHandler.hearts.setHeartMouseEvents();
				resolve(window.displayGraph(config, getSongGraph, [ songId ]));
			}).catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

module.exports = { getSongGraph };

},{"../spotify":3,"../util":4}],10:[function(require,module,exports){
const util = require('../util');

module.exports.getTop100 = async chartDate => {
	return new Promise((resolve, reject) => {
		try {
			scroll({ top: 0 });
			clearTitles(false);
			fetch(`/charts/${chartDate}`)
			.then(res => util.processFetchResponse(res))
			.then(data => {
				const template = Handlebars.compile($('#top100-template').html());
				$('#title').html('<div>Top 100 Chart<div id="other-chart-date"></div></div>');
				let clonedChartDates = $('#chart-date').clone(true);
				clonedChartDates.attr('id', 'other-chart-date-select');
				clonedChartDates.appendTo($('#other-chart-date'));
				$('#other-chart-date-select').val(data.id);
				$('#chartjs-canvas-container').hide();
				$('#content-container').html(template(data));
				$('#content-container').show();
				window.viewHandler.hearts.setHeartMouseEvents();
				window.setCurrentView(null, window.viewHandler.getTop100, [ chartDate ]);
				resolve();
			})
			.catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

},{"../util":4}]},{},[1]);
