/**
 * Data source configuration for Google Sheets ingestion
 */

export interface SheetSource {
    packageId: string;
    packageName: string;
    sheetId: string;
    sheetUrl: string;
    publishedXlsxUrl: string; // For direct XLSX access without API key
}

export const SHEET_SOURCES: SheetSource[] = [
    {
        packageId: 'Bemonc7-rehab',
        packageName: 'BEmONC Package 7 Rehabilitation',
        sheetId: '1vRBwi3MLqWQC5SPJsFBS6DHS1SCMlNyxDlVceblbIe3yf4RGYzTueN7T9JKpN1HERVy2qAKKa6ziLvB',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBwi3MLqWQC5SPJsFBS6DHS1SCMlNyxDlVceblbIe3yf4RGYzTueN7T9JKpN1HERVy2qAKKa6ziLvB/pub?output=xlsx',
        publishedXlsxUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBwi3MLqWQC5SPJsFBS6DHS1SCMlNyxDlVceblbIe3yf4RGYzTueN7T9JKpN1HERVy2qAKKa6ziLvB/pub?output=xlsx',
    },
];

export const CONFIG = {
    tabName: 'Data_Entry',
    range: 'A:U',
    cacheIntervalMs: 30 * 60 * 1000, // 30 minutes
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || '', // Optional for public sheets
};
