const util = require('../util');
const spotify = require('../spotify');

const getMultiSongGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			if (!isResize) {
				clearTitles(false);
				history.pushState(`getMultiSongGraph:${artistId}`, '', `/?state=getMultiSongGraph:${artistId}`);
			}
			fetch(`/artists/${artistId}/songs/graph`)
			.then(res => util.processFetchResponse(res))
			.then(data => {
				$('#title').html(`${window.viewHandler.hearts.heartIcon('a', data.charts[0][0].artist_id, data.isFavoriteArtist)} ${data.charts[0][0].artist_name}: All Songs`);
				$('#subtitle').html(`
					<div class="bold"><a href="javascript:window.viewHandler.getArtistGraph('${data.charts[0][0].artist_id}')">View peak positions only</a></div>
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
