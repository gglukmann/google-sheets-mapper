import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GoogleSheetsMapper, { fetchGoogleSheetsData } from "../src/index";
import { mapData } from "../src/utils";
import type { ValueRange } from "../src/types";

describe("mapData", () => {
  it("maps sheet data with headers to objects", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "Sheet1!A1:C3",
        values: [
          ["name", "age", "city"],
          ["Alice", "30", "NYC"],
          ["Bob", "25", "LA"],
        ],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([
      {
        id: "Sheet1",
        data: [
          { name: "Alice", age: "30", city: "NYC" },
          { name: "Bob", age: "25", city: "LA" },
        ],
      },
    ]);
  });

  it("handles sheet names with quotes in range", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "'My Sheet'!A1:B2",
        values: [
          ["id", "value"],
          ["1", "test"],
        ],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([
      {
        id: "My Sheet",
        data: [{ id: "1", value: "test" }],
      },
    ]);
  });

  it("returns empty data array for sheets with no values", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "Empty!A1:A1",
        values: [],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([{ id: "Empty", data: [] }]);
  });

  it("returns empty data for undefined values", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "NoData!A1:A1",
        values: undefined as unknown as string[][],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([{ id: "NoData", data: [] }]);
  });

  it("uses custom headerRowIndex from sheetsOptions", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "Sheet1!A1:B4",
        values: [["metadata row"], ["name", "value"], ["foo", "bar"], ["baz", "qux"]],
      },
    ];

    const result = mapData({
      sheets,
      sheetsOptions: [{ id: "Sheet1", headerRowIndex: 1 }],
    });

    expect(result).toEqual([
      {
        id: "Sheet1",
        data: [
          { name: "foo", value: "bar" },
          { name: "baz", value: "qux" },
        ],
      },
    ]);
  });

  it("filters out empty rows", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "Sheet1!A1:B3",
        values: [["name", "value"], [], ["test", "data"]],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([
      {
        id: "Sheet1",
        data: [{ name: "test", value: "data" }],
      },
    ]);
  });

  it("handles multiple sheets", () => {
    const sheets: ValueRange[] = [
      {
        majorDimensions: "ROWS",
        range: "Users!A1:B2",
        values: [
          ["name", "email"],
          ["Alice", "alice@test.com"],
        ],
      },
      {
        majorDimensions: "ROWS",
        range: "Products!A1:B2",
        values: [
          ["id", "price"],
          ["1", "99"],
        ],
      },
    ];

    const result = mapData({ sheets });

    expect(result).toEqual([
      {
        id: "Users",
        data: [{ name: "Alice", email: "alice@test.com" }],
      },
      {
        id: "Products",
        data: [{ id: "1", price: "99" }],
      },
    ]);
  });
});

describe("GoogleSheetsMapper", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and maps data with sheetsOptions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        spreadsheetId: "test-id",
        valueRanges: [
          {
            majorDimensions: "ROWS",
            range: "Sheet1!A1:B2",
            values: [
              ["name", "value"],
              ["test", "123"],
            ],
          },
        ],
      }),
    });

    const result = await GoogleSheetsMapper.fetchGoogleSheetsData({
      apiKey: "test-api-key",
      sheetId: "test-sheet-id",
      sheetsOptions: [{ id: "Sheet1" }],
    });

    expect(result).toEqual([
      {
        id: "Sheet1",
        data: [{ name: "test", value: "123" }],
      },
    ]);

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("test-sheet-id"), {});
  });

  it("fetches all sheets when no sheetsOptions provided", async () => {
    // First call: get sheet titles
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sheets: [{ properties: { title: "Sheet1" } }, { properties: { title: "Sheet2" } }],
      }),
    });

    // Second call: get batch data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        spreadsheetId: "test-id",
        valueRanges: [
          {
            majorDimensions: "ROWS",
            range: "Sheet1!A1:B2",
            values: [
              ["col1", "col2"],
              ["a", "b"],
            ],
          },
          {
            majorDimensions: "ROWS",
            range: "Sheet2!A1:B2",
            values: [
              ["x", "y"],
              ["1", "2"],
            ],
          },
        ],
      }),
    });

    const result = await fetchGoogleSheetsData({
      apiKey: "test-api-key",
      sheetId: "test-sheet-id",
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("Sheet1");
    expect(result[1].id).toBe("Sheet2");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws error on failed request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      url: "https://sheets.googleapis.com/v4/spreadsheets/test",
    });

    await expect(
      GoogleSheetsMapper.fetchGoogleSheetsData({
        apiKey: "invalid-key",
        sheetId: "test-sheet-id",
        sheetsOptions: [{ id: "Sheet1" }],
      }),
    ).rejects.toThrow("failed with 403: Forbidden");
  });

  it("throws error on 404 without status text", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "",
      url: "https://sheets.googleapis.com/v4/spreadsheets/test",
    });

    await expect(
      GoogleSheetsMapper.fetchGoogleSheetsData({
        apiKey: "test-key",
        sheetId: "nonexistent",
        sheetsOptions: [{ id: "Sheet1" }],
      }),
    ).rejects.toThrow("failed with 404");
  });
});
