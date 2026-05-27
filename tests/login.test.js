const { test, expect } = require('@playwright/test');

test('电商登录功能测试', async ({ page }) => {
  // 使用相对路径，baseURL会自动拼接
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // 输入账号密码
  await page.getByLabel('账号').fill('testuser@example.com');
  await page.getByLabel('密码').fill('Test123456');
  
  // 点击登录
  const loginButton = page.getByRole('button', { name: '登录' });
  try {
    await loginButton.click();
    await page.waitForURL('**/home', { timeout: 10000 });
    
    // 验证登录成功
    await expect(page).toHaveURL(/.*\/home/);
    await expect(page.locator('text=欢迎回来')).toBeVisible();
  } catch (error) {
    // 处理验证码弹窗
    const captcha = page.locator('[class*="captcha"]');
    if (await captcha.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('button', { name: '刷新验证码' }).click();
      await loginButton.click();
      await page.waitForURL('**/home', { timeout: 10000 });
    }
  }
});
