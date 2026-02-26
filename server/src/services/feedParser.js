const { XMLParser } = require('fast-xml-parser');

// helper utilities used by parser and other modules
const getText = (node) => {
  if (node === undefined || node === null) return '';
  if (Array.isArray(node)) node = node[0];
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    if (node['#text'] !== undefined) return node['#text'];
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
    }
    return '';
  }
  return String(node);
};

const getLink = (linkNode) => {
  if (!linkNode) return '';
  if (Array.isArray(linkNode)) {
    for (const l of linkNode) {
      if (l && typeof l === 'object' && l['@_href']) return l['@_href'];
      if (typeof l === 'string') return l;
    }
    const first = linkNode[0];
    if (typeof first === 'string') return first;
    if (first?.['@_href']) return first['@_href'];
    return '';
  }
  if (typeof linkNode === 'string') return linkNode;
  if (linkNode['@_href']) return linkNode['@_href'];
  return '';
};

const extractItems = (parsed) => {
  let items = [];
  if (parsed.rss) {
    let channel = parsed.rss.channel;
    if (Array.isArray(channel)) channel = channel[0];
    if (channel?.item) items = channel.item;
  } else if (parsed.feed) {
    items = parsed.feed.entry;
  }
  if (!Array.isArray(items)) items = items ? [items] : [];
  return items;
};

// parse raw XML string into array of item objects
function parseFeed(xml) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });
  const parsed = parser.parse(xml);
  return extractItems(parsed);
}

// fetch remote feed and return parsed items
async function fetchAndParse(url) {
  const fetch = require('node-fetch');
  const response = await fetch(url, { timeout: 10000 });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const xml = await response.text();
  return parseFeed(xml);
}

module.exports = {
  getText,
  getLink,
  parseFeed,
  fetchAndParse,
};
