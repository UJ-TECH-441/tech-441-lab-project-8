const util = require('../util');

module.exports.getTop100 = async chartDate => {
	return new Promise((resolve, reject) => {
		try {
			// Don't allow previous/next if out of bounds
			if (['previous', 'next'].includes(chartDate)) {
				const select = $('#other-chart-date > select')[0];
				let index = select.selectedIndex;
				if (index <= 1 && chartDate === 'previous') return resolve(viewHandler.getTop100(select[1].text));
				if (index >= select.length - 1 && chartDate === 'next') return resolve(viewHandler.getTop100(select[select.length - 1].text));
					const option = $(`#other-chart-date > select > option:eq(${chartDate === 'next' ? ++index : --index})`);
					option.prop('selected', true);
					viewHandler.getTop100(option[0].text);
					return resolve();
			}
			history.pushState(`getTop100:${chartDate}`, '', `/?state=getTop100:${chartDate}`);
			scroll({ top: 0 });
			clearTitles(false);
			fetch(`/charts/${chartDate}`)
			.then(res => util.processFetchResponse(res))
			.then(data => {
				const template = Handlebars.compile($('#top100-template').html());
				$('#title').html(`<div>Top 100 Chart</div><div class="nowrap">
					<span id="last-week" class="hand" onclick="viewHandler.getTop100('previous')"><i class="fa-solid fa-chevron-left"></i></span>
					<span id="other-chart-date"></span>
					<span id="next-week" class="hand" onclick="viewHandler.getTop100('next')"><i class="fa-solid fa-chevron-right"></i></span></div>`);
				let clonedChartDates = $('#chart-date').clone(true);
				clonedChartDates.attr('id', 'other-chart-date-select');
				clonedChartDates.css('text-align', 'center');
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
