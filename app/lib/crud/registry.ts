import type { CrudModuleConfig } from '~/lib/crud/types';

import { fsafeResultConfig } from './fsafe-result.config';
import { fsafeTestHoldConfig } from './fsafe-test-hold.config';
import { growHarvestWeightConfig } from './grow-harvest-weight.config';
import { growSeedBatchConfig } from './grow-seed-batch.config';
import { hrDepartmentConfig } from './hr-department.config';
import { hrEmployeeReviewConfig } from './hr-employee-review.config';
import { hrEmployeeConfig } from './hr-employee.config';
import { hrHousingConfig } from './hr-housing.config';
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
 * Maps sub_module_id (URL segment + display name) to its CRUD config.
 *
 * Keys are the Proper Case sys_sub_module.id values — they flow straight
 * from URL params to this lookup with no transformation.
 */
const registry = new Map<string, CrudModuleConfig>([
  ['Register', hrEmployeeConfig],
  ['Departments', hrDepartmentConfig],
  ['Employees', hrEmployeeConfig],
  ['Time Off', hrTimeOffConfig],
  ['Payroll', hrPayrollConfig],
  ['Payroll Comp', hrPayrollComparisonConfig],
  ['Payroll Comparison', hrPayrollComparisonConfig],
  ['Payroll Comp Manager', hrPayrollCompManagerConfig],
  ['Payroll Data', hrPayrollDataConfig],
  ['Hours Comp', hrPayrollHoursConfig],
  ['Products', invntItemConfig],
  ['Stock Counts', invntOnhandConfig],
  ['Warehouses', orgSiteConfig],
  ['Seed Batches', growSeedBatchConfig],
  ['Harvests', growHarvestWeightConfig],
  ['Inspections', fsafeResultConfig],
  ['Incidents', fsafeTestHoldConfig],
  ['Scheduler', opsTaskScheduleConfig],
  ['Task Tracking', opsTaskTrackerConfig],
  ['Checklists', opsTemplateConfig],
  ['Housing', hrHousingConfig],
  ['Employee Review', hrEmployeeReviewConfig],
]);

export function getModuleConfig(
  subModuleId: string,
): CrudModuleConfig | undefined {
  return registry.get(subModuleId);
}
