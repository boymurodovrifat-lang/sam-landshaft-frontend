import { test, expect } from '@playwright/test';

const BASE = 'https://sam-landshaft.uz';
const API = 'https://api.sam-landshaft.uz/api';
const ADMIN_EMAIL = 'admin@sam-landshaft.uz';
const ADMIN_PASSWORD = 'ChangeMe123!';

// ═══════════════════════════════════
// PUBLIC MAP
// ═══════════════════════════════════

test.describe('Public xarita', () => {
  test('Bosh sahifa yuklanadi', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: 'Sam-Landshaft' })).toBeVisible({ timeout: 15000 });
  });

  test('Leaflet xarita ko\'rinadi', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });
  });

  test('Kategoriya label sidebar\'da ko\'rinadi', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText('Kategoriya', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('Admin linkga o\'tish mumkin', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════

test.describe('Admin login', () => {
  test('Login sahifasi ochiladi', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await expect(page.getByRole('heading', { name: /Sam-Landshaft Admin/ })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Noto\'g\'ri parol xatolik beradi', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/noto.*g.*ri|xato/i)).toBeVisible({ timeout: 10000 });
  });

  test('To\'g\'ri login dashboard\'ga o\'tadi', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });
});

// ═══════════════════════════════════
// ADMIN PANEL — sidebar orqali navigatsiya
// ═══════════════════════════════════

test.describe('Admin panel', () => {
  // Sidebar locator — barcha nav linklar shu yerda
  const sidebar = (page: any) => page.locator('aside');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('Dashboard kontenti ko\'rinadi', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('admin panelga xush kelibsiz')).toBeVisible();
  });

  test('Kategoriyalar sahifasi va seed data', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: 'Kategoriyalar' }).click();
    await expect(page.getByRole('heading', { name: 'Kategoriyalar' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tuproq sho'rlanishi")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Tuproq namligi')).toBeVisible();
  });

  test('Yangi kategoriya dialogi', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: 'Kategoriyalar' }).click();
    await expect(page.getByRole('heading', { name: 'Kategoriyalar' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Yangi' }).click();
    await expect(page.getByText('Yangi kategoriya')).toBeVisible({ timeout: 5000 });
  });

  test('Fayllar sahifasi ochiladi', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: 'Fayllar' }).click();
    await expect(page.getByRole('heading', { name: 'GeoTIFF fayllar' })).toBeVisible({ timeout: 10000 });
  });

  test('Yuklash sahifasi ochiladi', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: /Yuklash/ }).click();
    await expect(page.getByRole('heading', { name: 'GeoTIFF yuklash' })).toBeVisible({ timeout: 10000 });
  });

  test('Sidebar navigatsiya ishlaydi', async ({ page }) => {
    await sidebar(page).getByRole('link', { name: 'Kategoriyalar' }).click();
    await expect(page).toHaveURL(/\/admin\/categories/);

    await sidebar(page).getByRole('link', { name: 'Fayllar' }).click();
    await expect(page).toHaveURL(/\/admin\/files/);

    await sidebar(page).getByRole('link', { name: /Yuklash/ }).click();
    await expect(page).toHaveURL(/\/admin\/upload/);
  });

  test('Chiqish tugmasi ishlaydi', async ({ page }) => {
    await page.getByRole('button', { name: 'Chiqish' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

// ═══════════════════════════════════
// API
// ═══════════════════════════════════

test.describe('API', () => {
  test('Health', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('Categories list', async ({ request }) => {
    const res = await request.get(`${API}/categories`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(2);
  });

  test('Login', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
  });

  test('401 without token', async ({ request }) => {
    const res = await request.post(`${API}/categories`, {
      data: { name: 'test', slug: 'test-unauth' },
    });
    expect(res.status()).toBe(401);
  });
});
