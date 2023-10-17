export function getQueryParam(url, param) {
  const regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

module.exports = {
  getQueryParam,
};
