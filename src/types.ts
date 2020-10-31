export interface MapperOptions {
  apiKey: string;
  sheetId: string;
  sheetsNames?: Array<string>;
}

export interface ValueRange {
  majorDimensions: string;
  range: string;
  values: Array<string[]>;
}

export interface ValueRangesResponse {
  spreadsheetId: string;
  valueRanges: Array<ValueRange>;
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
  data: Array<object>;
}

export interface ApiResponse {
  url: string;
  status: number;
  statusText: string;
}

export interface ErrorResponse {
  response: ApiResponse;
}
