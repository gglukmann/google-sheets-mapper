import {
  MapperOptions,
  MapperState,
  ApiResponse,
  ValueRange,
  SheetsResponse,
  SheetFromResponse,
  ValueRangesResponse,
  SheetsOption,
} from './types';

const GOOGLE_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getRanges = (sheetNames: string[] = []): string => {
  // ranges=Sheet1&ranges=Sheet2
  return sheetNames.map((sheetName) => `ranges=${sheetName}`).join('&');
};

const getSheetsTitleUrl = (sheetId: string, apiKey: string): string => {
  return `${GOOGLE_API_URL}/${sheetId}?fields=sheets%2Fproperties%2Ftitle&key=${apiKey}`;
};

const getBatchUrl = (
  sheetId: string,
  ranges: Array<string>,
  apiKey: string,
): string => {
  const rangesQueryString = getRanges(ranges);

  return `${GOOGLE_API_URL}/${sheetId}/values:batchGet?${rangesQueryString}&key=${apiKey}`;
};

class ApiResponseError extends Error {
  constructor(message: string, public readonly response: ApiResponse) {
    super(message);
    Object.setPrototypeOf(this, ApiResponseError.prototype);
    this.response = response;
    Error.captureStackTrace(this, ApiResponseError);
  }
}

const makeFetch = async (url: string, config = {}): Promise<any> => {
  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new ApiResponseError(
        `Request to '${url}' failed with ${response.status}${
          response.statusText ? `: ${response.statusText}` : ''
        }`,
        {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        },
      );
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const mapRecords = (records: ValueRange['values'], headerData: string[]) => {
  return records
    .filter((record: string[]) => record.length > 0)
    .map((record: string[]) =>
      record.reduce(
        (obj: { [key: string]: unknown }, item: string, index: number) => {
          obj[headerData[index]] = item;
          return obj;
        },
        {},
      ),
    );
};

export const mapData = ({
  sheets,
  sheetsOptions = [],
}: {
  sheets: ValueRange[];
  sheetsOptions?: SheetsOption[];
}): MapperState[] => {
  return sheets.map((sheet: ValueRange) => {
    const id = sheet.range.split('!')[0].replace(/'/g, '');
    const rows = sheet.values || [];

    if (rows.length > 0) {
      const sheetsOptionsSheet = sheetsOptions.find(
        (sheet: SheetsOption) => sheet.id === id,
      );
      const headerRowIndex = sheetsOptionsSheet?.headerRowIndex ?? 0;
      const header = rows[headerRowIndex];
      const records = rows.filter((_, index: number) => index > headerRowIndex);
      const recordsData = mapRecords(records, header);

      return {
        id,
        data: recordsData,
      };
    }

    return {
      id,
      data: [],
    };
  });
};

export const fetchBatchData = async ({
  apiKey,
  sheetId,
  sheetsOptions = [],
}: MapperOptions): Promise<ValueRangesResponse> => {
  const sheetsNames = sheetsOptions.map((option: SheetsOption) => option.id);
  const url = getBatchUrl(sheetId, sheetsNames, apiKey);

  return await makeFetch(url);
};

export const fetchAllSheetsData = async ({
  apiKey,
  sheetId,
}: MapperOptions): Promise<ValueRangesResponse> => {
  const urlTitles = getSheetsTitleUrl(sheetId, apiKey);
  const { sheets }: SheetsResponse = await makeFetch(urlTitles);
  const sheetsOptions = sheets.map((sheet: SheetFromResponse) => ({
    id: sheet.properties.title,
  }));

  return await fetchBatchData({ apiKey, sheetId, sheetsOptions });
};
