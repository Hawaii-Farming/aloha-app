import { expect, test } from '@playwright/test';



import { AuthPageObject } from './auth.po';



























































const newPassword = (Math.random() * 10000).toString();

test.describe('Password Reset Flow', () => {
  test('will reset the password and sign in with new one', async ({ page }) => {
    const auth = new AuthPageObject(page);

    let email = '';

    email = `test-${Math.random() * 10000}@example.com`;

    await page.goto('/auth/sign-up');

    await auth.signUp({
      email,
      password: 'password',
      repeatPassword: 'password',
    });

    await auth.visitConfirmEmailLink(email, {
      deleteAfter: true,
      subject: 'Confirm Your Email',
    });

    await page.context().clearCookies();
    await page.reload();

    await page.goto('/auth/password-reset');

    await expect(async () => {
      await page.waitForTimeout(250);

      await page.fill('[name="email"]', email);
      await page.click('[type="submit"]');

      await auth.visitConfirmEmailLink(email, {
        deleteAfter: true,
        subject: 'Reset your password',
      });
    }).toPass();

    await expect(async () => {
      await auth.updatePassword(newPassword);

      await page.waitForURL('/home');
    }).toPass();

    await page.context().clearCookies();
    await page.reload();

    await page.goto('/auth/sign-in');

    await auth.signIn({
      email,
      password: newPassword,
    });

    await page.waitForURL('/home');
  });
});
