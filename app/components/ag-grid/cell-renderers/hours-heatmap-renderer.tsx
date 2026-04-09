import type { CustomCellRendererProps } from 'ag-grid-react';

function isDarkMode(el: HTMLElement | null): boolean {
  if (!el) return false;
  const wrapper = el.closest('[data-ag-theme-mode]');
  return wrapper?.getAttribute('data-ag-theme-mode') === 'dark';
}

/**
 * AG Grid cell renderer that shows hours as a heatmap cell.
 * Scans all visible rows to find min/max, then maps the value
 * to a blue → emerald → amber gradient based on relative position.
 */
export function HoursHeatmapRenderer(props: CustomCellRendererProps) {
  const value = props.value as number | null | undefined;
  if (value === null || value === undefined) return null;

  const dark = isDarkMode(props.eGridCell);
  const field = props.colDef?.field ?? 'total_hours';

  // Scan rows to get min/max for relative scaling
  let min = value;
  let max = value;
  props.api.forEachNode((node) => {
    const v = node.data?.[field] as number | undefined;
    if (v !== undefined && v !== null) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  });

  // Normalize 0-1 within the data range
  const range = max - min;
  const t = range > 0 ? (value - min) / range : 0.5;

  // Interpolate: low=blue, mid=emerald, high=amber
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const s = t * 2; // 0-1 within blue→emerald
    r = 71 + (62 - 71) * s;
    g = 168 + (207 - 168) * s;
    b = 248 + (142 - 248) * s;
  } else {
    const s = (t - 0.5) * 2; // 0-1 within emerald→amber
    r = 62 + (243 - 62) * s;
    g = 207 + (162 - 207) * s;
    b = 142 + (58 - 142) * s;
  }

  const alpha = 0.1 + t * 0.3;
  const bgColor = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;

  // Text color matches the hue
  let textColor: string;
  if (t < 0.33) {
    textColor = dark ? '#6dc0ff' : '#1a6fbf';
  } else if (t < 0.66) {
    textColor = dark ? '#3ecf8e' : '#1a7f54';
  } else {
    textColor = dark ? '#f3a23a' : '#b06e10';
  }

  return (
    <div
      className="-mx-[var(--ag-cell-horizontal-padding)] flex h-full items-center justify-center"
      style={{
        backgroundColor: bgColor,
        marginTop: -1,
        marginBottom: -1,
        paddingTop: 1,
        paddingBottom: 1,
      }}
    >
      <span
        className="font-mono text-sm font-semibold"
        style={{ color: textColor }}
      >
        {value}
      </span>
    </div>
  );
}
