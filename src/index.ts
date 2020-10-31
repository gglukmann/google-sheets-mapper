import { MapperOptions, MapperState, ValueRangesResponse } from './types';
import { fetchBatchData, fetchAllSheetsData, mapData } from './utils';

const GoogleSheetsMapper = {
  async fetchGoogleSheetsData({
    apiKey,
    sheetId,
    sheetsNames = [],
  }: MapperOptions): Promise<MapperState[]> {
    try {
      const response: ValueRangesResponse =
        sheetsNames.length === 0
          ? await fetchAllSheetsData({ apiKey, sheetId })
          : await fetchBatchData({ apiKey, sheetId, sheetsNames });

      return mapData(response.valueRanges);
    } catch (error) {
      throw error;
    }
  },
};

export default GoogleSheetsMapper;
export const fetchGoogleSheetsData = GoogleSheetsMapper.fetchGoogleSheetsData;
