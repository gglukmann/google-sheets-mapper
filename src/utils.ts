import type {
  MapperOptions,
  MapperState,
  ValueRange,
  SheetsResponse,
  SheetFromResponse,
  ValueRangesResponse,
  SheetsOption,
} from "./types";

const GOOGLE_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";

const getRanges = (sheetNames: string[] = []): string => {
  // ranges=Sheet1&ranges=Sheet2
  return sheetNames.map((sheetName) => `ranges=${sheetName}`).join("&");
};

const getSheetsTitleUrl = (sheetId: string, apiKey: string): string => {
  return `${GOOGLE_API_URL}/${sheetId}?fields=sheets%2Fproperties%2Ftitle&key=${apiKey}`;
};

const getBatchUrl = (sheetId: string, ranges: Array<string>, apiKey: string): string => {
  const rangesQueryString = getRanges(ranges);
  return `${GOOGLE_API_URL}/${sheetId}/values:batchGet?${rangesQueryString}&key=${apiKey}`;
};

const makeFetch = async <T>(url: string, config = {}): Promise<T> => {
  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(
      `Request to '${url}' failed with ${response.status}${
        response.statusText ? `: ${response.statusText}` : ""
      }`,
      {
        cause: {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        },
      },
    );
  }

  return await response.json();
};

const mapRecords = (
  records: ValueRange["values"],
  headerData: string[],
): Record<string, string>[] => {
  return records
    .filter((record: string[]) => record.length > 0)
    .map((record: string[]) =>
      record.reduce((obj: Record<string, string>, item: string, index: number) => {
        const key = headerData[index];
        if (key !== undefined) {
          obj[key] = item;
        }
        return obj;
      }, {}),
    );
};

export const mapData = ({
  sheets = [],
  sheetsOptions = [],
}: {
  sheets?: ValueRange[];
  sheetsOptions?: SheetsOption[];
}): MapperState[] => {
  return sheets.map((sheet: ValueRange) => {
    const id = sheet.range.split("!")[0].replace(/'/g, "");
    const rows = sheet.values || [];

    if (rows.length > 0) {
      const sheetsOptionsSheet = sheetsOptions.find((option: SheetsOption) => option.id === id);
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

  return await makeFetch<ValueRangesResponse>(url);
};

export const fetchAllSheetsData = async ({
  apiKey,
  sheetId,
}: MapperOptions): Promise<ValueRangesResponse> => {
  const urlTitles = getSheetsTitleUrl(sheetId, apiKey);
  const { sheets } = await makeFetch<SheetsResponse>(urlTitles);
  const sheetsOptions = sheets.map((sheet: SheetFromResponse) => ({
    id: sheet.properties.title,
  }));

  return await fetchBatchData({ apiKey, sheetId, sheetsOptions });
};
