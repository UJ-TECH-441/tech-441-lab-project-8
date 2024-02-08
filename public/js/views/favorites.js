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
