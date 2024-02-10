const util = require('../util');

module.exports.getTop100 = async chartDate => {
	return new Promise((resolve, reject) => {
		try {
			history.pushState(`getTop100:${chartDate}`, '', `/?state=getTop100:${chartDate}`);
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
