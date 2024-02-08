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
