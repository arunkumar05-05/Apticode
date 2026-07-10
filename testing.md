# AptiCode – Testing Strategy & Quality Assurance Specifications

This document defines the testing strategy, frameworks, unit/integration testing patterns, E2E test files, and load testing scripts to support 100,000+ concurrent students.

---

## 1. Testing Pyramid Strategy

```
       ▲
      / \      End-to-End (Playwright) - Critical Workflows (Login, Code Submit)
     /   \     
    /     \    Integration Tests - Express API Controllers + Prisma Database Mock
   /       \   
  /_________\  Unit Tests (Jest) - Business Logic Services, Utilities, Components
```

---

## 2. Unit & Integration Testing (Jest + Supertest)

### 2.1 Backend Controller Test Example
Verifies that authentication pathways validate inputs correctly and respond with standard tokens.
```typescript
import request from 'supertest';
import app from '../app';
import { prismaMock } from '../singleton';

describe('POST /api/auth/login', () => {
  it('should return an access token and 200 OK on correct credentials', async () => {
    // Mock user database resolution
    prismaMock.user.findUnique.mockResolvedValue({
      id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      email: 'student@college.edu',
      passwordHash: '$2b$10$hashedpasswordstring...',
      role: 'STUDENT',
      level: 1,
      xp: 120,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user.email).toBe('student@college.edu');
  });

  it('should return 422 if email format is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: 'Short' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNPROCESSABLE_ENTITY');
  });
});
```

---

## 3. End-to-End Testing (Playwright)

Playwright simulates critical user flows in headless browsers.

### 3.1 Test case: Student Code Submission
```typescript
import { test, expect } from '@playwright/test';

test.describe('Coding Playground Workflow', () => {
  test('should allow student to select language, enter code, and submit', async ({ page }) => {
    // 1. Sign in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@college.edu');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Open a coding challenge
    await page.click('a[href="/coding"]');
    await page.click('text=Two Sum');
    await expect(page).toHaveURL(/\/coding\/[a-zA-Z0-9-]+/);

    // 3. Select language
    await page.selectOption('select#language-selector', 'python');

    // 4. Fill Monaco Editor area
    const editor = page.locator('.monaco-editor').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('def twoSum(nums, target):\n    return [0, 1]');

    // 5. Submit code and wait for WebSocket completion signal
    await page.click('button#submit-code-btn');
    
    // Check if status indicator changes to SUCCESS or wrong answer (but evaluated)
    const statusText = page.locator('#submission-status');
    await expect(statusText).toBeVisible({ timeout: 10000 });
    await expect(statusText).toContainText(/(ACCEPTED|WRONG_ANSWER)/);
  });
});
```

---

## 4. Performance & Load Testing (k6)

To simulate a load of **100k concurrent users**, we utilize distributed load generation tools. Below is the configuration framework script using **k6** to validate API Gateway and Redis scaling bottlenecks.

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Define load options
export const options = {
  stages: [
    { duration: '2m', target: 5000 },  // Ramp-up to 5,000 active virtual users (VUs)
    { duration: '10m', target: 5000 }, // Sustained load testing
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests must complete under 200ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = 'https://api.apticode.com';

// 2. Main Virtual User (VU) Execution Loop
export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'mock-jwt-token-string'}`
    },
  };

  // Scenario 1: Fetch student dashboard (Tests Redis read cache performance)
  let dashboardRes = http.get(`${BASE_URL}/api/users/dashboard`, params);
  check(dashboardRes, {
    'dashboard status was 200': (r) => r.status === 200,
    'dashboard has progress metrics': (r) => r.json().data.xp !== undefined,
  });
  sleep(1);

  // Scenario 2: Load leaderboard (Tests ZSet throughput)
  let leaderboardRes = http.get(`${BASE_URL}/api/leaderboard?scope=GLOBAL&limit=10`, params);
  check(leaderboardRes, {
    'leaderboard status was 200': (r) => r.status === 200,
  });
  sleep(2);

  // Scenario 3: Request AI Explanation (Tests rate-limiting performance)
  let explainPayload = JSON.stringify({ questionId: 'e4a2d81c-d922-491c-8e4d-7bcfa3d66141' });
  let explainRes = http.post(`${BASE_URL}/api/aptitude/explain`, explainPayload, params);
  check(explainRes, {
    'explain status was 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  sleep(5);
}
```

---

## 5. Automated Test Execution Commands

```bash
# Run all unit tests
npm run test:unit

# Run all API integration tests
npm run test:integration

# Run Playwright E2E browser tests
npx playwright test

# Execute local k6 performance simulator script
k6 run --env TEST_TOKEN=dummy_token_hash load_test.js
```
