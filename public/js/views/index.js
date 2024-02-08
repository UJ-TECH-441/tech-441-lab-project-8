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
