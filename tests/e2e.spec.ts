import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Event Registration Platform E2E Flow", () => {
  test.beforeAll(async () => {
    const screenshotsDir = path.join(process.cwd(), "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test("End-to-End Registration, Duplicate Prevention, and Admin Verification", async ({
    page,
  }) => {
    // 1. Visit homepage
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Register for Premier Tech");
    await expect(page.locator("text=Upcoming Events")).toBeVisible();

    // Capture homepage
    await page.screenshot({
      path: "screenshots/01-homepage-events.png",
      fullPage: true,
    });

    // 2. Click the first "Register Now" button
    const registerButtons = page.locator('a:has-text("Register Now")');
    await expect(registerButtons.first()).toBeVisible();
    await registerButtons.first().click();

    // 3. Verify event details page
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Participant Registration")).toBeVisible();

    // 4. Fill in the form
    const testName = "Jordan Taylor";
    const testEmail = `jordan.taylor.${Date.now()}@university.edu`;
    const testOrg = "Apex University";

    await page.fill('input[name="fullName"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="collegeOrOrganization"]', testOrg);

    // Select domain interests
    const webDevInterest = page.locator('button:has-text("Web Development")');
    if (await webDevInterest.isVisible()) {
      await webDevInterest.click();
    }
    const aiInterest = page.locator('button:has-text("Artificial Intelligence")');
    if (await aiInterest.isVisible()) {
      await aiInterest.click();
    }

    // Capture filled form screenshot
    await page.screenshot({
      path: "screenshots/02-registration-form-filled.png",
    });

    // 5. Submit registration
    await page.click('button[type="submit"]:has-text("Complete Registration")');

    // 6. Verify confirmation screen
    await expect(
      page.locator("text=You're Officially Registered!")
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${testName}`)).toBeVisible();
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();

    // Capture confirmation screenshot
    await page.screenshot({
      path: "screenshots/03-registration-success.png",
    });

    // 7. Click Register Another Attendee
    await page.click('button:has-text("Register Another Attendee")');
    await expect(page.locator("text=Participant Registration")).toBeVisible();

    // 8. Attempt Duplicate Registration with same email (and test casing normalization)
    await page.fill('input[name="fullName"]', testName);
    await page.fill('input[name="email"]', `  ${testEmail.toUpperCase()}  `);
    await page.fill('input[name="collegeOrOrganization"]', testOrg);

    const dataScienceInterest = page.locator('button:has-text("Data Science")');
    if (await dataScienceInterest.isVisible()) {
      await dataScienceInterest.click();
    }

    // Submit duplicate
    await page.click('button[type="submit"]:has-text("Complete Registration")');

    // 9. Verify 409 Duplicate Error Banner is visible
    await expect(
      page.locator("text=This email is already registered for this event.")
    ).toBeVisible({ timeout: 10000 });

    // Capture duplicate error screenshot
    await page.screenshot({
      path: "screenshots/04-duplicate-registration-error.png",
    });

    // 10. Visit Admin Dashboard
    await page.goto("/admin");
    await expect(page.locator("text=Admin Authentication")).toBeVisible();

    // Capture login screen screenshot
    await page.screenshot({
      path: "screenshots/05-admin-login.png",
    });

    // Sign in to admin console
    await page.fill('input[placeholder="admin"]', "admin");
    await page.fill('input[type="password"]', "adminpassword123");
    await page.click('button:has-text("Sign In to Dashboard")');

    // 11. Verify Admin Dashboard contents
    await expect(page.locator("text=Event Administration")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Total Registrations")).toBeVisible();
    await expect(page.locator("text=Registered Attendees Roster")).toBeVisible();

    // Verify newly registered user is in the table
    await page.fill('input[placeholder="Search name, email, org..."]', testName);
    await expect(page.locator(`text=${testName}`)).toBeVisible();
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();

    // Capture admin dashboard screenshot
    await page.screenshot({
      path: "screenshots/06-admin-dashboard.png",
      fullPage: true,
    });
  });
});
