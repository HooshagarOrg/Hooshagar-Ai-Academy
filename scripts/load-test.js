/**
 * Load Testing with k6
 * تست بار برای اطمینان از عملکرد تحت فشار
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'errors': ['rate<0.1'],              // Error rate should be below 10%
    'http_req_failed': ['rate<0.01'],    // Failed requests should be below 1%
  },
};

// Base URL (change for production)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const TEST_USER = {
  national_id: '1234567890',
  password: 'test123',
};

/**
 * Setup - runs once before all iterations
 */
export function setup() {
  console.log(`🚀 Starting load test against ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

/**
 * Main test scenario
 */
export default function (data) {
  // 1. Health Check
  const healthRes = http.get(`${data.baseUrl}/api/health`);
  check(healthRes, {
    'health check is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // 2. Login (if endpoint exists)
  const loginPayload = JSON.stringify(TEST_USER);
  const loginRes = http.post(`${data.baseUrl}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  loginDuration.add(loginRes.timings.duration);
  
  const loginSuccess = check(loginRes, {
    'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
  }

  sleep(2);

  // 3. API calls (simulated user behavior)
  const endpoints = [
    '/api/health',
    // Add your API endpoints here
    // '/api/students',
    // '/api/attendance',
  ];

  endpoints.forEach((endpoint) => {
    const res = http.get(`${data.baseUrl}${endpoint}`);
    
    apiDuration.add(res.timings.duration);
    
    check(res, {
      [`${endpoint} status is 200 or 401`]: (r) => r.status === 200 || r.status === 401,
      [`${endpoint} response time < 1s`]: (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);
  });

  sleep(3);
}

/**
 * Teardown - runs once after all iterations
 */
export function teardown(data) {
  console.log('✅ Load test completed');
}

