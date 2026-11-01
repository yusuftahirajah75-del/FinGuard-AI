import { sanitizeCsvValue, generateCsvString } from '../../src/utils/csvUtils.js';

describe('CSV Utilities & Formula Injection Sanitization', () => {
  test('prefixes dangerous formula triggers with an apostrophe', () => {
    expect(sanitizeCsvValue('=cmd|"/C calc"!A0')).toBe('\'=cmd|"/C calc"!A0');
    expect(sanitizeCsvValue('+12345')).toBe('\'+12345');
    expect(sanitizeCsvValue('-1000')).toBe('\'-1000');
    expect(sanitizeCsvValue('@SUM(A1:A10)')).toBe('\'@SUM(A1:A10)');
    expect(sanitizeCsvValue('\tTAB_INJECT')).toBe('\'\tTAB_INJECT');
  });

  test('preserves benign numeric and string values untouched', () => {
    expect(sanitizeCsvValue(150.50)).toBe(150.50);
    expect(sanitizeCsvValue('NORMAL_STRING')).toBe('NORMAL_STRING');
    expect(sanitizeCsvValue('TXN-001923')).toBe('TXN-001923');
    expect(sanitizeCsvValue(null)).toBe('');
  });

  test('generates valid sanitized CSV content from objects', async () => {
    const data = [
      { id: '1', name: 'Alice', code: '=1+1' },
      { id: '2', name: 'Bob', code: 'SAFE' },
    ];

    const csv = await generateCsvString(data);
    expect(csv).toContain('id,name,code');
    expect(csv).toContain('\'=1+1');
    expect(csv).toContain('SAFE');
  });
});

