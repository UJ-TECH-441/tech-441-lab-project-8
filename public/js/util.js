module.exports.processFetchResponse = async res => {
	if (res.redirected) return location.href = res.url;
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
};

module.exports.handleError = err => {
	console.error(err);
	return true;
}