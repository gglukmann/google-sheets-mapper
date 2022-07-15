# Google Sheets Mapper

## A library for getting data from [Google Sheets API v4](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values)

[![Minified file size](https://img.badgesize.io/https://www.unpkg.com/google-sheets-mapper/dist/google-sheets-mapper.esm.js.svg)](https://bundlephobia.com/result?p=google-sheets-mapper) [![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![NPM version](https://img.shields.io/npm/v/google-sheets-mapper)](https://www.npmjs.com/package/google-sheets-mapper)

---

## Installation

Package can be added using **yarn**:

```bash
yarn add google-sheets-mapper
```

Or, use **NPM**:

```bash
npm install google-sheets-mapper
```

UMD build available on [unpkg](https://www.unpkg.com/browse/google-sheets-mapper@1.0.0/dist/google-sheets-mapper.cjs.production.min.js).

---

## Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/) to get API key for Google Sheets API.
2. Create a Google Sheet and add some data. See [example sheet](https://docs.google.com/spreadsheets/d/1zbEyIfga05-gXTCVGejJHpl8ZrlcTYanvgnQBa1t2DM/edit#gid=0).
3. Share it with "Anyone with this link can view".
4. Get sheet id from url of the sheet.

```html
https://docs.google.com/spreadsheets/d/[THIS-IS-THE-SHEET-ID]/
```

5. I suggest adding API key and sheet id to `.env` file

---

## Examples

### Get data from all sheets inside the spreadsheet

```js
import { fetchGoogleSheetsData } from 'google-sheets-mapper';

const getData = async () => {
  try {
    return await fetchGoogleSheetsData({
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID,
    });
  } catch (error) {
    console.error(error);
  }
};
```

### Get data from specific sheets inside the spreadsheet

Don't use single quotes on sheet names, they will be removed because when using space in sheet name it will be returned wrapped with single quotes and plugin will remove them for clean string id.

```js
import { fetchGoogleSheetsData } from 'google-sheets-mapper';

const getData = async () => {
  try {
    return await fetchGoogleSheetsData({
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
      sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID,
      sheetsOptions: [{ id: 'Sheet1' }],
    });
  } catch (error) {
    console.error(error);
  }
};
```

---

## API Documentation

The `GoogleSheetsMapper.fetchGoogleSheetsData` function takes an object with three properties:

| Name          | Value  |
| ------------- | ------ |
| apiKey        | string |
| sheetId       | string |
| sheetsOptions | array  |

- `apiKey` is a Google Sheets API v4 key from [Google Cloud Console](https://console.cloud.google.com/).
- `sheetId` is the id of the sheet.
- `sheetsOptions` is an array of specific objects `{ id, headerRowIndex }`. Can be left out then it will fallback to all sheets inside the spreadsheet and use first row from sheet as header.

### Exposed Data

The function produces an `MapperState` object:

```js
try {
  const data = await GoogleSheetsMapper.fetchGoogleSheetsData({
    apiKey,
    sheetId,
  });
} catch (error) {
  console.error(error);
}
```

| Name  | Value          |
| ----- | -------------- |
| data  | array          |
| error | null or object |

- `data` is an array of mapped data objects.

```js
[
  {
    id: 'Sheet1',
    data: [
      { value: 'et', key: 'language' },
      { value: 'Test sheet', key: 'title' },
    ],
  },
];
```

- `error` lets you know when there is something wrong. It returns an error object where you can get specific error properties from `error.response`

```js
{
  status: '404',
  statusText: '',
  url: 'https://sheets.googleapis.com/v4/spreadsheets/...',
}
```

---

## Migration from v1 to v2

- Change `sheetsNames` array of string to `sheetsOptions` array of objects with `{ id: 'sheetName' }`
