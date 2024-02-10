const util = require('../util');
const spotify = require('../spotify');

const getArtistGraph = (artistId, isResize) => {
	return new Promise((resolve, reject) => {
		try {
			if (!artistId) return resolve();
			if (!isResize) {
				clearTitles();
				history.pushState(`getArtistGraph:${artistId}`, '', `/?state=getArtistGraph:${artistId}`);
			}
			fetch(`/artists/${artistId}/songs`)
			.then(res => util.processFetchResponse(res))
			.then(async res => {
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
				if (!isResize) {
					spotify.loadSpotifyArtist(json[0].artist_name, json[0].peak_week.substring(0, 4));
				}
				resolve(window.displayGraph(config, getArtistGraph, [ artistId ]));
			})
			.catch(err => util.handleError(err) && reject());
		} catch (err) {
			util.handleError(err) && reject();
		}
	});
};

module.exports = { getArtistGraph };
