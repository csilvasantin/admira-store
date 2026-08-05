import crypto from 'node:crypto';

const required = [
  'GA_PROPERTY_ID',
  'GA_SERVICE_ACCOUNT_JSON',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required secret/env: ${key}`);
  }
}

const propertyId = process.env.GA_PROPERTY_ID.trim();
const serviceAccount = JSON.parse(process.env.GA_SERVICE_ACCOUNT_JSON);

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function yesterdayMadrid() {
  const now = new Date();
  const madrid = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  madrid.setDate(madrid.getDate() - 1);
  const yyyy = madrid.getFullYear();
  const mm = String(madrid.getMonth() + 1).padStart(2, '0');
  const dd = String(madrid.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(serviceAccount.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google token failed: ${JSON.stringify(payload)}`);
  }
  return payload.access_token;
}

async function gaRunReport(token, request) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GA report failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function metric(row, index) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function dimension(row, index) {
  return row?.dimensionValues?.[index]?.value || '(not set)';
}

function rowsToLines(rows = [], max = 5) {
  if (!rows.length) return ['  - sin datos'];
  return rows.slice(0, max).map(row => `  - ${dimension(row, 0)}: ${metric(row, 0)} usuarios · ${metric(row, 1)} vistas`);
}

async function sendTelegram(text) {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text.slice(0, 3900),
      disable_web_page_preview: true,
    }),
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Telegram failed: ${JSON.stringify(payload)}`);
  }
}

const date = yesterdayMadrid();
const token = await getAccessToken();

const summary = await gaRunReport(token, {
  dateRanges: [{ startDate: date, endDate: date }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'sessions' },
    { name: 'screenPageViews' },
    { name: 'eventCount' },
  ],
});

const pages = await gaRunReport(token, {
  dateRanges: [{ startDate: date, endDate: date }],
  dimensions: [{ name: 'pagePath' }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
  ],
  orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  limit: 8,
});

const sources = await gaRunReport(token, {
  dateRanges: [{ startDate: date, endDate: date }],
  dimensions: [{ name: 'sessionSourceMedium' }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'screenPageViews' },
  ],
  orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  limit: 8,
});

const total = summary.rows?.[0] || {};
const text = [
  `📊 XpaceOS · informe de visitas (${date})`,
  '',
  `Usuarios: ${metric(total, 0)}`,
  `Sesiones: ${metric(total, 1)}`,
  `Vistas: ${metric(total, 2)}`,
  `Eventos: ${metric(total, 3)}`,
  '',
  'Top páginas:',
  ...rowsToLines(pages.rows),
  '',
  'Fuentes:',
  ...rowsToLines(sources.rows),
].join('\n');

await sendTelegram(text);
