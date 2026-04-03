import { cn } from '../lib/utils/cn';

export function Divider(props: { className?: string }) {
  return <div className={cn('bg-border h-[1px] w-full', props.className)} />;
}
