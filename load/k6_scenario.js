import http from 'k6/http';
import { sleep, check } from 'k6';
import { randomSeed, randomString } from 'k6/experimental';

export let options = {
  scenarios: {
    ramp_auth_and_contacts: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 }
      ],
      gracefulRampDown: '5s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.95']
  }
};

const BASE = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // Register a user (idempotent-ish: random suffix)
  const uid = randomString(8);
  const registerPayload = {
    name: 'Load User ' + uid,
    login_id: 'load_' + uid,
    email_id: `load_${uid}@example.com`,
    password: 'LoadTestPass123'
  };
  let reg = http.post(`${BASE}/api/v1/register`, JSON.stringify(registerPayload), { headers: { 'Content-Type': 'application/json' } });
  if (reg.status === 400) {
    // Already exists, fallback to login
    const loginPayload = { login_id: registerPayload.login_id, password: registerPayload.password };
    reg = http.post(`${BASE}/api/v1/login`, JSON.stringify(loginPayload), { headers: { 'Content-Type': 'application/json' } });
  }
  check(reg, { 'auth success': r => r.status === 201 || r.status === 200 });
  let token;
  try { token = reg.json('access_token'); } catch (_) { token = null; }
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create a contact
  const contactPayload = { name: 'Contact ' + uid, email: `c_${uid}@ex.com` };
  const cResp = http.post(`${BASE}/api/v1/masters/contacts`, JSON.stringify(contactPayload), { headers });
  check(cResp, { 'contact create ok': r => r.status === 201 });

  // List contacts
  const lResp = http.get(`${BASE}/api/v1/masters/contacts?page=1&per_page=5`, { headers });
  check(lResp, { 'contacts list ok': r => r.status === 200 });

  // Metrics endpoint (no auth) quick sample
  const m = http.get(`${BASE}/metrics`);
  check(m, { 'metrics reachable': r => r.status === 200 });

  sleep(1);
}
