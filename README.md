# playwright-mcp-generate


我来帮您补充在GitHub CodeSpaces上执行这个Playwright项目的完整配置步骤。
GitHub CodeSpaces 配置步骤
1. 创建开发容器配置文件
在项目根目录创建 ".devcontainer" 文件夹和配置文件：
mkdir -p .devcontainer
创建 ".devcontainer/devcontainer.json"：
{
  "name": "Playwright MCP Demo",
  "image": "mcr.microsoft.com/devcontainers/universal:2",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "18"
    }
  },
  "forwardPorts": [3000, 9323],
  "postCreateCommand": "npm install && npx playwright install --with-deps",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-playwright.playwright",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  }
}
2. 创建 GitHub Actions 工作流文件
创建 ".github/workflows/test.yml"（优化版本，支持CodeSpaces自动运行）：
name: Playwright Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:  # 支持手动触发

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]  # 多版本测试
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci  # 比 npm install 更快更可靠
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    
    - name: Run Playwright tests
      run: npx playwright test --project=chromium
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-${{ matrix.node-version }}
        path: playwright-report/
        retention-days: 30
    
    - name: Upload test screenshots
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: test-screenshots-${{ matrix.node-version }}
        path: test-results/
        retention-days: 7
3. 创建 Playwright 配置文件
创建 "playwright.config.ts"：
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'https://demo-shop.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
4. 创建测试文件
创建 "tests/login.test.js"：
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
5. 创建测试提示文件
创建 "test-prompt.txt"：
测试场景：电商网站登录功能
步骤：
1. 打开网址：/login（使用baseURL）
2. 在账号输入框中输入：testuser@example.com
3. 在密码输入框中输入：Test123456
4. 点击“登录”按钮
5. 验证页面跳转至首页（url包含/home）
6. 验证首页显示“欢迎回来”文本
异常处理：若出现“验证码弹窗”，点击“刷新验证码”后重试登录


6. 创建 npm 脚本
更新 "package.json" 添加脚本：
{
  "scripts": {
    "test": "playwright test",
    "test:chrome": "playwright test --project=chromium",
    "test:debug": "playwright test --debug",
    "test:codegen": "playwright codegen",
    "report": "playwright show-report",
    "generate": "npx playwright-mcp generate --prompt test-prompt.txt --output tests/login.test.js"
  }
}
7. 在 CodeSpaces 中运行测试
# 打开CodeSpaces后，终端会自动执行postCreateCommand
# 手动运行测试：
npm test

# 查看HTML报告：
npx playwright show-report

# 调试模式（逐步执行）：
npm run test:debug
8. 提交代码到GitHub
git add .
git commit -m "添加Playwright测试和CodeSpaces配置"
git push
提交后，GitHub Actions会自动在CodeSpaces环境中运行测试，并生成测试报告。
