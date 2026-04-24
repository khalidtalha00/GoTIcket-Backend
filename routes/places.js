const router = require('express').Router();

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE_URL = 'https://photon.komoot.io/api';
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const setCached = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const baseHeaders = {
  Accept: 'application/json',
  'User-Agent': process.env.NOMINATIM_USER_AGENT || 'GoTicket/1.0',
};

const toPlaceSuggestion = (description, placeId) =>
  description && placeId ? { description, placeId } : null;

const fromNominatim = async (query) => {
  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');

  const response = await fetch(url.toString(), { headers: baseHeaders });
  if (!response.ok) return null;

  const data = await response.json();
  return (Array.isArray(data) ? data : [])
    .map((item) => {
      const description = item?.display_name || '';
      const placeId = item?.osm_type && item?.osm_id ? `${item.osm_type}:${item.osm_id}` : '';
      return toPlaceSuggestion(description, placeId);
    })
    .filter(Boolean);
};

const fromPhoton = async (query) => {
  const url = new URL(PHOTON_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '5');

  const response = await fetch(url.toString(), { headers: baseHeaders });
  if (!response.ok) return [];

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];

  return features
    .map((feature) => {
      const props = feature?.properties || {};
      const parts = [props.name, props.city, props.state, props.country].filter(Boolean);
      const description = parts.join(', ');
      const placeId = props.osm_type && props.osm_id ? `${props.osm_type}:${props.osm_id}` : `photon:${props.osm_id || description}`;
      return toPlaceSuggestion(description, placeId);
    })
    .filter(Boolean);
};

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 3) return res.json({ suggestions: [] });

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ suggestions: cached });

  try {
    const nominatimSuggestions = await fromNominatim(query);
    const suggestions = nominatimSuggestions && nominatimSuggestions.length > 0
      ? nominatimSuggestions
      : await fromPhoton(query);

    setCached(cacheKey, suggestions);
    return res.json({ suggestions });
  } catch (error) {
    console.error('Place search failed:', error);
    return res.json({ suggestions: [] });
  }
});

router.get('/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ place: null });
  }

  const cacheKey = `reverse:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json({ place: cached });

  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(url.toString(), { headers: baseHeaders });
    if (!response.ok) {
      return res.json({ place: null });
    }

    const data = await response.json();
    const place = data?.display_name || null;
    setCached(cacheKey, place);
    return res.json({ place });
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    return res.json({ place: null });
  }
});

module.exports = router;
