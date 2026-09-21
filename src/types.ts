export type ToolMode = 'choice' | 'alignment' | 'printing';

export type PaperSizeKey = 'A4' | 'A3' | 'B4';

export type OrientationMode = 'auto' | 'portrait' | 'landscape';

export type PartCount = 2 | 3 | 4 | 5 | 6;

export interface StatusState {
  text: string;
  type: 'ok' | 'error' | 'loading' | '';
}

export interface OversizedIssue {
  page: number;
  pageW: number;
  pageH: number;
  pageWmm: number;
  pageHmm: number;
  sheetName: string;
  sheetW: number;
  sheetH: number;
  sheetWmm: number;
  sheetHmm: number;
}

export interface PrintItemPlan {
  pageIndex: number;
  origW: number;
  origH: number;
  renderW: number;
  renderH: number;
  x: number;
  y: number;
  scaled: boolean;
}

export interface PrintSheetPlan {
  sheetIndex: number;
  width: number;
  height: number;
  items: PrintItemPlan[];
  drawCutMarks?: boolean;
}
