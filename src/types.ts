export interface SheetsOption {
  id: string;
  headerRowIndex?: number;
}

export interface MapperOptions {
  apiKey: string;
  sheetId: string;
  sheetsOptions?: SheetsOption[];
}

export interface ValueRange {
  majorDimensions: string;
  range: string;
  values: string[][];
}

export interface ValueRangesResponse {
  spreadsheetId: string;
  valueRanges: ValueRange[];
}

export interface PropertiesFromResponse {
  title: string;
}

export interface SheetFromResponse {
  properties: PropertiesFromResponse;
}

export interface SheetsResponse {
  sheets: SheetFromResponse[];
}

export interface MapperState {
  id: string;
  data: object[];
}

export interface ApiResponse {
  url: string;
  status: number;
  statusText: string;
}

export interface ErrorResponse {
  response: ApiResponse;
}
