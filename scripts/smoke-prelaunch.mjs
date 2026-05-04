const webUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_WEB_URL || process.env.PRELAUNCH_WEB_URL || 'http://localhost:3000',
);
const apiBaseUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.PRELAUNCH_API_BASE_URL ||
    'http://localhost:4000/api',
);

const email = `smoke+${Date.now()}@example.com`;

await checkPage('/', 'homepage');
await checkPage('/signup?accountType=CREATIVE', 'creative signup');
await submitLead(email, 'new waitlist lead');
await submitLead(email, 'duplicate waitlist lead');

console.log('Pre-launch smoke test passed.');

async function checkPage(path, label) {
  const response = await fetch(`${webUrl}${path}`, {
    redirect: 'manual',
  });

  if (!response.ok && response.status < 300) {
    throw new Error(`${label} returned unexpected status ${response.status}`);
  }

  if (response.status >= 400) {
    throw new Error(`${label} failed with status ${response.status}`);
  }
}

async function submitLead(leadEmail, label) {
  const response = await fetch(`${apiBaseUrl}/prelaunch/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'vendr-studios-smoke-test',
    },
    body: JSON.stringify({
      email: leadEmail,
      name: 'Smoke Test',
      interestType: 'GENERAL',
      source: 'PRELAUNCH_PAGE',
    }),
  });

  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}: ${JSON.stringify(body)}`);
  }
  if (!body?.data?.email) {
    throw new Error(`${label} returned an unexpected response: ${JSON.stringify(body)}`);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}
