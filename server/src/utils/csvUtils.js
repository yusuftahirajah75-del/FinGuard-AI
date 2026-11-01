import * as fastCsv from 'fast-csv';

/**
 * Sanitizes cell values to prevent CSV Formula Injection attacks
 * (CVE-style exploits where spreadsheet programs execute commands starting with =, +, -, @, \t, \r).
 * 
 * @param {any} value
 * @returns {any}
 */
export function sanitizeCsvValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  const str = String(value);
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];

  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    // Prefix with single apostrophe so spreadsheet treats it strictly as text
    return `'${str}`;
  }

  return str;
}

/**
 * Generates CSV string from an array of objects with sanitized fields.
 * 
 * @param {Array<Object>} rows
 * @returns {Promise<string>}
 */
export async function generateCsvString(rows) {
  if (!rows || rows.length === 0) {
    return '';
  }

  const sanitizedRows = rows.map((row) => {
    const sanitized = {};
    for (const [key, val] of Object.entries(row)) {
      if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeCsvValue(JSON.stringify(val));
      } else {
        sanitized[key] = sanitizeCsvValue(val);
      }
    }
    return sanitized;
  });

  return fastCsv.writeToString(sanitizedRows, { headers: true });
}

export default {
  sanitizeCsvValue,
  generateCsvString,
};
