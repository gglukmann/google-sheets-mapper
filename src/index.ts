import { MapperOptions, MapperState, ValueRangesResponse } from './types';
import { fetchBatchData, fetchAllSheetsData, mapData } from './utils';

const GoogleSheetsMapper = {
  async fetchGoogleSheetsData({
    apiKey,
    sheetId,
    sheetsOptions = [],
  }: MapperOptions): Promise<MapperState[]> {
    try {
      const response: ValueRangesResponse =
        sheetsOptions.length === 0
          ? await fetchAllSheetsData({ apiKey, sheetId })
          : await fetchBatchData({ apiKey, sheetId, sheetsOptions });

      return mapData({ sheets: response.valueRanges, sheetsOptions });
    } catch (error) {
      throw error;
    }
  },
};

export default GoogleSheetsMapper;
export const fetchGoogleSheetsData = GoogleSheetsMapper.fetchGoogleSheetsData;
