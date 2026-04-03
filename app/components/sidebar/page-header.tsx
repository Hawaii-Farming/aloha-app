import { PageHeader } from '@aloha/ui/page';

export function WorkspacePageHeader(
  props: React.PropsWithChildren<{
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    account: string;
  }>,
) {
  return (
    <PageHeader description={props.description}>{props.children}</PageHeader>
  );
}
