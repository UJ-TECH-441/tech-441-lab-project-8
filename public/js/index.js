let currentView = {};
let activeResizes = 0;
let spotifyToken, spotifyPlayer, spotifyController;

$(document).ready(async () => {
	const user = await confirmLogin();
	if (user) {
		Chart.register(ChartDataLabels);
		const validFunctions = [ getArtistGraph, getSongGraph, getMultiSongGraph, getTop100, getFavorites ];
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
		if (location.search.includes('code=')) await getSpotifyToken(qs.get('code'));
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

window.onSpotifyIframeApiReady = IFrameAPI => {
	const element = document.getElementById('embed-iframe');
	const options = {
		width: 300,
		height: 100
	};
	const callback = EmbedController => spotifyController = EmbedController;
	IFrameAPI.createController(element, options, callback);
};

const getSpotifySong = (title, artist, callback) => {
	try {
		fetch(`/spotify/search/song?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
			.then(res => processFetchResponse(res))
			.then(json => {
				if (callback) callback(null, json);
				if (json.uri) spotifyController.loadUri(json.uri);
				$('header > div:first-child').css('visibility', 'visible');
			})
			.catch(err => callback ? callback(err) : console.error(err));
	} catch (err) {
		callback ? callback(err) : console.error(err);
	}
};

const clearTitles = () => {
	$('#title').html('');
	$('#subtitle').html('');
	$('header > div:first-child').css('visibility', 'hidden');
}

const handleError = err => {
	console.error(err);
	return true;
}

const processFetchResponse = async res => {
	if (res.redirected) return location.href = res.url;
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
};

const confirmLogin = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/login-check')
				.then(res => processFetchResponse(res))
				.then(json => resolve(json))
				.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject()
		}
	});
};

const logout = async () => {
	return new Promise((resolve, reject) => {
		try {
			fetch('/user/logout')
			.then(res => processFetchResponse(res))
			.then(json => resolve(json))
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject()
		}
	});
};

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
			.then(res => processFetchResponse(res))
			.then(json => resolve())
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};

const displayGraph = (config, graphFunction, graphArgs) => {
	$('#content-container').hide();
	if (currentView.graph) currentView.graph.destroy();
	$('#chartjs-canvas-container').children().remove();
	const canvas = document.createElement('canvas');
	$(canvas).attr('id', 'chartjs-canvas');
	$(canvas).appendTo($('#chartjs-canvas-container'));
	const graph = new Chart($('#chartjs-canvas'), config);
	currentView = { graph, graphFunction, graphArgs };
	scroll({ top: 0 });
	$('#chartjs-canvas-container').show();
};

const getArtistGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			clearTitles();
			fetch(`/artists/${artistId}/songs`)
			.then(res => processFetchResponse(res))
			.then(res => {
				const json = res.data;
				$('#title').html(`${heartIcon('a', json[0].artist_id, res.isFavorite)} ${json[0].artist_name}: Chart Performance`);
				const subtitle = (json.length === 1 ? '' : `<div class="bold"><a class="bold" 
				href="javascript:getMultiSongGraph('${json[0].artist_id}');">View weekly performance for all songs by 
				${json[0].artist_name.replace(/^The /, 'the ')}</a></div>`) +
					'<div>Click titles to view chart performance graphs</div>';
				$('#subtitle').html(subtitle);
				const config = Object.assign({}, baseConfig);
				config.data = { datasets: Object.assign([], baseDatasets) };
				config.data.labels = json.map(song => song.peak_week.substring(0, 10));
				config.data.datasets[0].label = 'Chart Position';
				config.data.datasets[0].data = json.map(song => song.peak_position);
				config.options.onClick = event => {
					const points = currentView.graph.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
					if (points.length) getSongGraph(json[points[0].index].song_id);
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
					click: (ctx, event) => getSongGraph(json[ctx.dataIndex].song_id)
				}
				setHeartMouseEvents();
				resolve(displayGraph(config, getArtistGraph, [ artistId ]));
			})
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};

const getSongGraph = (songId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!songId) return resolve();
			if (!isResize) clearTitles();
			currentGraphFunction = getSongGraph;
			currentViewArgs = songId;
			fetch(`/songs/${songId}/graph`)
				.then(res => processFetchResponse(res))
				.then(res => {
					const data = res.data;
					$('#title').html(`${heartIcon('s', data[0].song_id, res.isFavoriteSong)} "${data[0].song_title}" by 
						${heartIcon('a', data[0].artist_id, res.isFavoriteArtist)} <a href="javascript:getArtistGraph('${data[0].artist_id}')">${data[0].artist_name}</a>`);
					$('#subtitle').html(`
						<div class="bold">All songs by ${data[0].artist_name.replace(/^The /, 'the ')}: 
						<a href="javascript:getArtistGraph('${data[0].artist_id}')">Peak position</a> | 
						<a href="javascript:getMultiSongGraph('${data[0].artist_id}')">Weekly performance</a></div>
						<div>Click graph points to view full charts for each week</div>
					`);

					if (!isResize) getSpotifySong(data[0].song_title, data[0].artist_name);
					fetch(`/artists/${data[0].artist_id}/songs`)
						.then(res => processFetchResponse(res))
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
						if (points.length) getTop100(data[points[0].index].date.substring(0, 10));
					};
					config.options.plugins.datalabels.offset = 10;
					config.options.plugins.datalabels.align = 'bottom';
					config.options.plugins.datalabels.formatter = (value, ctx) => data[ctx.dataIndex].position;
					config.options.plugins.datalabels.listeners = {
						click: (ctx, event) => getTop100(data[ctx.dataIndex].date.substring(0, 10))
					};
					config.options.tooltip = {yAlign: 'bottom'};
					setHeartMouseEvents();
					resolve(displayGraph(config, getSongGraph, [ songId ]));
			}).catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};

const getMultiSongGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			clearTitles();
			currentGraphFunction = getMultiSongGraph;
			currentViewArgs = artistId;
			fetch(`/artists/${artistId}/songs/graph`)
			.then(res => processFetchResponse(res))
			.then(data => {
				$('#title').html(`${heartIcon('a', data.charts[0][0].artist_id, data.isFavoriteArtist)} ${data.charts[0][0].artist_name}: All Songs`);
				$('#subtitle').html(`
				<div class="bold"><a href="javascript:getArtistGraph('${data.charts[0][0].artist_id}')">View peak positions only</a></div>
				<div>Click titles to see details for specific songs or graph points to view full chart for corresponding week</div>
			`);
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
					getTop100(date);
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
						getSongGraph(songId);
					}
				};
				config.options.plugins.datalabels.align = 'bottom';
				config.options.plugins.datalabels.formatter = (value, ctx) => {};
				setHeartMouseEvents();
				resolve(displayGraph(config, getMultiSongGraph, [ artistId ]));
			})
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};

const getTop100 = async chartDate => {
	return new Promise((resolve, reject) => {
		try {
			scroll({ top: 0 });
			clearTitles();
			fetch(`/charts/${chartDate}`)
			.then(res => processFetchResponse(res))
			.then(data => {
				const template = Handlebars.compile($('#top100-template').html());
				$('#title').html('<div>Top 100 Chart: <span id="other-chart-date"></span></div>');
				let clonedChartDates = $('#chart-date').clone(true);
				clonedChartDates.attr('id', 'other-chart-date-select');
				clonedChartDates.appendTo($('#other-chart-date'));
				$('#other-chart-date-select').val(data.id);
				$('#chartjs-canvas-container').hide();
				$('#content-container').html(template(data));
				$('#content-container').show();
				setHeartMouseEvents();
				currentView = { graphFunction: getTop100, graphArgs: [ chartDate ] };
				resolve();
			})
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
			.then(res => processFetchResponse(res))
			.then(data => {
				clearTitles();
				$('#chartjs-canvas-container').hide();
				const template = Handlebars.compile($('#favorites-template').html());
				$('#content-container').html(template(data));
				$('#content-container').show();
				setHeartMouseEvents();
				currentView = { graphFunction: getFavorites, graphArgs: [] };
				$('#title').html('<div>Your Favorites</div>');
				resolve();
			})
			.catch(err => handleError(err) && reject());
		} catch (err) {
			handleError(err) && reject();
		}
	});
};


const baseDatasets = [{
	borderColor: '#bbccdd',
	clip: false,
	pointRadius: 7,
	pointBackgroundColor: '#1880e7',
	pointBorderColor: '#1469be',
	pointHoverRadius: 12,
	pointHoverBackgroundColor: '#ffcc00',
	pointHoverBorderColor: '#eabb00'
}];

const baseConfig = {
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

const fetchChartDates = chartId => {
	fetch('/charts/dates')
	.then(res => processFetchResponse(res))
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
			if (option.value === event.target.value) getTop100(option.text);
		});
	});
};

const fetchArtists = artistId => {
	fetch('/artists')
	.then(res => processFetchResponse(res))
	.then(json => {
		$('#artists').append(`<option value="">Select artist</option>`);
		json.forEach(artist => {
			$('#artists').append(`<option value="${artist.id}">${artist.name.substring(0, 50)}</option>`);
		})
		if (artistId) $('#artists').val(artistId);
		$('#artists').on('change', event => getArtistGraph($('#artists').val()));
	})
	.catch(err => console.error(err));
};
