import { test, expect, type Page } from '@playwright/test';

test.describe.serial('App E2E Tests', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Invalid login', async () => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'badpass');
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('text=Incorrect email or password').or(page.locator('text=Login failed')).first()).toBeVisible({ timeout: 5000 });
  });

  test('Valid login', async () => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'abhishek@aiagency.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('h1').first()).toContainText('Welcome back', { timeout: 10000 });
  });

  test('Dashboard rendering', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('text=eslint-disable-next-line')).toHaveCount(0);
    // check if cards render
    await expect(page.locator('text=Total Reach')).toBeVisible();
  });

  test('Campaign generation workflow', async () => {
    await page.goto('/campaigns');
    // Open the first campaign in the list
    await page.click('button:has-text("Open Studio") >> nth=0');
    // Generate content
    await page.click('button:has-text("Generate Flow")');
    
    // Wait for the AI output
    await expect(page.locator('text=contentId: undefined')).toHaveCount(0, { timeout: 15000 });
    // Assuming generated content is visible in the text block
    const contentBox = page.locator('.whitespace-pre-wrap');
    await expect(contentBox.first()).toBeVisible({ timeout: 15000 });
    const textContent = (await contentBox.first().textContent()) || '';
    expect(textContent.trim().length).toBeGreaterThan(0);
  });

  test('Leads CRUD', async () => {
    await page.goto('/leads');
    await page.click('button:has-text("Add Lead")');
    await page.locator('input[type="text"]').first().fill('Test Lead E2E');
    await page.click('button:has-text("Save Lead")');
    await expect(page.locator('text=Test Lead E2E').first()).toBeVisible({ timeout: 5000 });
    
    // Edit Lead
    await page.click('text=Test Lead E2E');
    await page.locator('input[type="text"]').first().fill('Updated Test Lead');
    await page.click('button:has-text("Save Lead")');
    await expect(page.locator('text=Updated Test Lead').first()).toBeVisible({ timeout: 5000 });

    // Delete Lead
    await page.click('text=Updated Test Lead');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete Lead")');
    await expect(page.locator('text=Updated Test Lead')).toHaveCount(0, { timeout: 5000 });
  });

  test('Audiences view', async () => {
    await page.goto('/audiences');
    await expect(page.url()).toContain('/audiences');
  });

  test('Content view', async () => {
    await page.goto('/content');
    await expect(page.url()).toContain('/content');
  });

  test('Email view', async () => {
    await page.goto('/email');
    await expect(page.url()).toContain('/email');
  });

  test('Analytics view', async () => {
    await page.goto('/analytics');
    await expect(page.url()).toContain('/analytics');
  });

  test('Traffic view', async () => {
    await page.goto('/traffic');
    await expect(page.url()).toContain('/traffic');
    // test refresh button
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=Refreshing...')).toBeVisible();
    await expect(page.locator('text=Refreshing...')).toHaveCount(0, { timeout: 5000 });
  });

  test('Settings view', async () => {
    await page.goto('/settings');
    await expect(page.url()).toContain('/settings');
  });

  test('Trends view', async () => {
    await page.goto('/trends');
    await expect(page.url()).toContain('/trends');
  });

  test('Calendar view', async () => {
    await page.goto('/calendar');
    await expect(page.url()).toContain('/calendar');
  });

  test('Inbox view', async () => {
    await page.goto('/inbox');
    await expect(page.url()).toContain('/inbox');
  });

  test('Brand view', async () => {
    await page.goto('/brand');
    await expect(page.url()).toContain('/brand');
  });

  test('Logout', async () => {
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('**/login');
  });
});
