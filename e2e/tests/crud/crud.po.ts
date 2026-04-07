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
    return this.page.locator('[data-test="crud-data-table"]');
  }

  /** Get visible table rows (tbody tr) */
  get tableRows() {
    return this.page.locator(
      '[data-test="crud-data-table"] tbody tr',
    );
  }

  /** Type into the search input */
  async search(query: string) {
    const searchInput = this.page.locator(
      '[data-test="table-search"]',
    );
    await searchInput.fill(query);
    // Wait for table to update (debounced search triggers navigation)
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the Create button to open the sheet */
  async openCreateSheet() {
    await this.page
      .locator('[data-test="sub-module-create-button"]')
      .click();
    // Wait for sheet to slide in
    await expect(
      this.page.locator('[data-test="create-panel"]'),
    ).toBeVisible();
  }

  /** Fill a form field by label */
  async fillField(label: string, value: string) {
    await this.page.getByLabel(label, { exact: false }).fill(value);
  }

  /** Submit the form in the sheet */
  async submitForm() {
    await this.page
      .locator('[data-test="create-panel-submit"]')
      .click();
  }

  /** Select a row by clicking its checkbox */
  async selectRow(index: number) {
    await this.tableRows
      .nth(index)
      .locator('input[type="checkbox"]')
      .check();
  }

  /** Click the bulk delete button and confirm */
  async bulkDelete() {
    await this.page
      .locator('[data-test="bulk-delete-button"]')
      .click();
    // Confirm in the AlertDialog
    const dialog = this.page.locator('[role="alertdialog"]');
    const confirmBtn = dialog.getByRole('button', {
      name: /delete/i,
    });
    if (
      await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await confirmBtn.click();
    }
  }
}
