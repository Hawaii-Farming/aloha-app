import { Page, expect } from '@playwright/test';

export class AuthPageObject {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  goToSignIn() {
    return this.page.goto('/auth/sign-in');
  }

  async signOut() {
    await this.page.click('[data-test="account-dropdown-trigger"]');
    await this.page.click('[data-test="account-dropdown-sign-out"]');
  }

  async signIn(params: { email: string; password: string }) {
    await this.page.waitForTimeout(500);

    await this.page.fill('input[name="email"]', params.email);
    await this.page.fill('input[name="password"]', params.password);
    await this.page.click('button[type="submit"]');
  }

  async updatePassword(password: string) {
    await this.page.waitForTimeout(250);

    expect(async () => {
      await this.page.fill('[name="password"]', password);
      await this.page.fill('[name="repeatPassword"]', password);

      await this.page.click('[type="submit"]');
      await this.page.waitForTimeout(500);
    }).toPass();
  }
}
