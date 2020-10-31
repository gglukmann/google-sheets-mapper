import {
  MapperOptions,
  Sheet,
  ApiResponse,
  ValueRange,
  ValueRangesResponse,
  SheetsResponse,
  SheetFromResponse,
} from './types';

const GOOGLE_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getRanges = (sheetNames: MapperOptions['sheetsNames'] = []): string => {
  // ranges=Sheet1&ranges=Sheet2
  return sheetNames.map(sheetName => `ranges=${sheetName}`).join('&');
};

const getSheetsTitleUrl = (sheetId: string, apiKey: string) => {
  return `${GOOGLE_API_URL}/${sheetId}?fields=sheets%2Fproperties%2Ftitle&key=${apiKey}`;
};

const getBatchUrl = (
  sheetId: string,
  ranges: Array<string>,
  apiKey: string
) => {
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

const makeFetch = async (url: string, config = {}) => {
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
        }
      );
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const mapRecords = (
  records: ValueRange['values'],
  headerData: Array<string>
) => {
  return records
    .filter((record: Array<string>) => record.length > 0)
    .map((record: Array<string>) => {
      return record.reduce((obj: any, item: string, index: number) => {
        obj[headerData[index]] = item;
        return obj;
      }, {});
    });
};

const mapData = (sheets: ValueRange[]): Sheet[] => {
  return sheets.map((sheet: ValueRange) => {
    const id = sheet.range.split('!')[0].replace(/'/g, '');
    const rows = sheet.values || [];

    if (rows.length > 0) {
      const [header, ...records] = rows;
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

const fetchBatchData = async ({
  apiKey,
  sheetId,
  sheetsNames = [],
}: MapperOptions) => {
  const url = getBatchUrl(sheetId, sheetsNames, apiKey);

  return await makeFetch(url);
};

const fetchAllSheetsData = async ({ apiKey, sheetId }: MapperOptions) => {
  const url = getSheetsTitleUrl(sheetId, apiKey);
  const { sheets }: SheetsResponse = await makeFetch(url);
  const batchUrl = getBatchUrl(
    sheetId,
    sheets.map((sheet: SheetFromResponse) => sheet.properties.title),
    apiKey
  );

  return await makeFetch(batchUrl);
};

export const fetchData = async ({
  apiKey,
  sheetId,
  sheetsNames = [],
}: MapperOptions) => {
  try {
    const response: ValueRangesResponse =
      sheetsNames.length === 0
        ? await fetchAllSheetsData({ apiKey, sheetId })
        : await fetchBatchData({ apiKey, sheetId, sheetsNames });

    return mapData(response.valueRanges);
  } catch (error) {
    throw error;
  }
};
