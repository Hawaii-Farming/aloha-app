type RowData = Record<string, unknown>;

interface HousingDetailRowProps {
  data: RowData;
}

// Stub: replaced in Task 2 with full tenant-fetching implementation
export function HousingDetailRow({ data: _data }: HousingDetailRowProps) {
  return (
    <div className="text-muted-foreground px-6 py-4 text-sm">
      Loading tenants...
    </div>
  );
}

export default HousingDetailRow;
