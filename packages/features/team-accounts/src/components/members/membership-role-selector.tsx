import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@aloha/ui/select';
import { Trans } from '@aloha/ui/trans';

type Role = string;

export const MembershipRoleSelector: React.FC<{
  roles: Role[];
  value: Role;
  currentUserRole?: Role;
  onChange: (role: Role) => unknown;
  triggerClassName?: string;
}> = ({ roles, value, currentUserRole, onChange, triggerClassName }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        data-test={'role-selector-trigger'}
        className={triggerClassName}
      >
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        {roles.map((role) => {
          return (
            <SelectItem
              key={role}
              data-test={`role-option-${role}`}
              disabled={currentUserRole === role}
              value={role}
            >
              <span className={'text-sm capitalize'}>
                <Trans i18nKey={`common:roles.${role}.label`} defaults={role} />
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
