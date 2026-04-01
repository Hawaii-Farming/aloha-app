export interface AiPageContext {
  orgId: string;
  orgName: string;
  module?: string;
  subModule?: string;
  recordId?: string;
  pageType?: 'list' | 'detail' | 'create' | 'edit' | 'dashboard';
}
