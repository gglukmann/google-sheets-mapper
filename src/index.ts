import type { MapperOptions, MapperState } from "./types";
import { fetchBatchData, fetchAllSheetsData, mapData } from "./utils";

const GoogleSheetsMapper = {
  async fetchGoogleSheetsData({
    apiKey,
    sheetId,
    sheetsOptions = [],
  }: MapperOptions): Promise<MapperState[]> {
    const response = sheetsOptions.length === 0
        ? await fetchAllSheetsData({ apiKey, sheetId })
        : await fetchBatchData({ apiKey, sheetId, sheetsOptions });
    return mapData({ sheets: response.valueRanges, sheetsOptions });
  },
};

export default GoogleSheetsMapper;
export const fetchGoogleSheetsData = GoogleSheetsMapper.fetchGoogleSheetsData;
