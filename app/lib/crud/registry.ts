import type { CrudModuleConfig } from '~/lib/crud/types';

import { fsafeResultConfig } from './fsafe-result.config';
import { fsafeTestHoldConfig } from './fsafe-test-hold.config';
import { growHarvestWeightConfig } from './grow-harvest-weight.config';
import { growSeedBatchConfig } from './grow-seed-batch.config';
import { hrDepartmentConfig } from './hr-department.config';
import { hrEmployeeConfig } from './hr-employee.config';
import { hrPayrollCompManagerConfig } from './hr-payroll-comp-manager.config';
import { hrPayrollComparisonConfig } from './hr-payroll-comparison.config';
import { hrPayrollDataConfig } from './hr-payroll-data.config';
import { hrPayrollHoursConfig } from './hr-payroll-hours.config';
import { hrPayrollConfig } from './hr-payroll.config';
import { hrTimeOffConfig } from './hr-time-off.config';
import { invntItemConfig } from './invnt-item.config';
import { invntOnhandConfig } from './invnt-onhand.config';
import { opsTaskScheduleConfig } from './ops-task-schedule.config';
import { opsTaskTrackerConfig } from './ops-task-tracker.config';
import { opsTemplateConfig } from './ops-template.config';
import { orgSiteConfig } from './org-site.config';

/**
 * Maps sub-module slugs (from URL params) to their CRUD configs.
 *
 * Each entry maps the sys_sub_module_id (used in URL routing)
 * to the CrudModuleConfig that tells the factory which Supabase
 * table/view to query and how to render columns/forms.
 */
const registry = new Map<string, CrudModuleConfig>([
  ['register', hrEmployeeConfig],
  ['departments', hrDepartmentConfig],
  ['employees', hrEmployeeConfig],
  ['time_off', hrTimeOffConfig],
  ['payroll', hrPayrollConfig],
  ['payroll_comp', hrPayrollComparisonConfig],
  ['payroll_comparison', hrPayrollComparisonConfig],
  ['payroll_comp_manager', hrPayrollCompManagerConfig],
  ['payroll_data', hrPayrollDataConfig],
  ['hours_comp', hrPayrollHoursConfig],
  ['products', invntItemConfig],
  ['stock_counts', invntOnhandConfig],
  ['warehouses', orgSiteConfig],
  ['seed_batches', growSeedBatchConfig],
  ['harvests', growHarvestWeightConfig],
  ['inspections', fsafeResultConfig],
  ['incidents', fsafeTestHoldConfig],
  ['scheduler', opsTaskScheduleConfig],
  ['task_tracking', opsTaskTrackerConfig],
  ['checklists', opsTemplateConfig],
]);

export function getModuleConfig(
  subModuleSlug: string,
): CrudModuleConfig | undefined {
  return registry.get(subModuleSlug);
}
