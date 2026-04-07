import { Page, expect } from '@playwright/test';

export class CrudPageObject {
  constructor(private readonly page: Page) {}

  /** Navigate to a specific sub-module list view */
  async goToSubModule(
    account: string,
    module: string,
    subModule: string,
  ) {
    await this.page.goto(`/home/${account}/${module}/${subModule}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Get the data table container */
  get table() {
    return this.page.locator('table');
  }

  /** Get visible table rows (tbody tr) */
  get tableRows() {
    return this.page.locator('table tbody tr');
  }

  /** Type into the search input */
  async search(query: string) {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.fill(query);
    // Wait for table to update (debounced search triggers navigation)
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the Create button to open the sheet */
  async openCreateSheet() {
    await this.page.getByRole('button', { name: /create/i }).click();
    // Wait for sheet to slide in
    await expect(this.page.locator('[role="dialog"]')).toBeVisible();
  }

  /** Fill a form field by label */
  async fillField(label: string, value: string) {
    await this.page.getByLabel(label, { exact: false }).fill(value);
  }

  /** Submit the form in the sheet */
  async submitForm() {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.getByRole('button', { name: /save|create|submit/i }).click();
  }

  /** Select a row by clicking its checkbox */
  async selectRow(index: number) {
    await this.tableRows
      .nth(index)
      .locator('input[type="checkbox"]')
      .check();
  }

  /** Click the bulk delete button */
  async bulkDelete() {
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog if present
    const confirmBtn = this.page.getByRole('button', {
      name: /confirm|yes|delete/i,
    });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}
