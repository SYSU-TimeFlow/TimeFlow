import { test, expect } from "@playwright/test";

test("添加日历事件流程测试", async ({ page }) => {
  // 启动应用
  await page.goto("http://localhost:5173"); // 确保开发服务器已运行

  // 保证在非 todo 视图下
  // 可根据实际视图状态设置，或模拟切换
  const addEventBtn = page.locator('button:has-text("Add Event")');
  await expect(addEventBtn).toBeVisible();

  // 点击“添加事件”按钮
  await addEventBtn.click();

  // 等待模态框出现
  await expect(page.locator("text=Title")).toBeVisible();

  // 填写标题
  await page.locator('input[placeholder="Event title"]').fill("测试事件");

  // 填写开始时间
  const now = new Date();
  const startStr = now.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
  const endStr = new Date(now.getTime() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  await page.locator('input[type="datetime-local"]').nth(0).fill(startStr);
  await page.locator('input[type="datetime-local"]').nth(1).fill(endStr);

  // 点击保存
  await page.getByRole("button", { name: "Save" }).click();

  // 检查是否事件出现在事件列表中（视你的事件显示位置而定）
  await expect(page.getByText("测试事件")).toBeVisible();
});
