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

export function createInitializeCardEvent(cardUID, design, cardModulePubKey) {
  const body = {
    cid: cardUID,
    ctr: 0,
    design: {
      uuid: design.uuid,
      name: design.name,
    },
  };

  return {
    kind: 21111,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', cardModulePubKey],
      ['t', 'card-init-request'],
    ],
    content: JSON.stringify(body),
  };
}

module.exports = {
  getQueryParam,
  createInitializeCardEvent,
};
