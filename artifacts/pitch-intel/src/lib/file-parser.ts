import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { KbSolution } from "@workspace/api-client-react";

export async function parseKbFile(file: File): Promise<KbSolution[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mapped = mapRowsToKbSolutions(results.data as any[]);
          resolve(mapped);
        },
        error: (error) => reject(error),
      });
    });
  } else if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          const mapped = mapRowsToKbSolutions(json);
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error("Unsupported file format. Please upload CSV or Excel.");
}

function mapRowsToKbSolutions(rows: any[]): KbSolution[] {
  return rows.map(row => {
    // Attempt to map common column names to our KbSolution schema
    const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let solution: KbSolution = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (!value) continue;
      const strValue = String(value).trim();
      const normKey = normalizeKey(key);

      if (normKey.includes('name') || normKey.includes('solution') || normKey.includes('title')) {
        if (!solution.name) solution.name = strValue;
      } else if (normKey.includes('capability') || normKey.includes('feature')) {
        if (!solution.capability) solution.capability = strValue;
      } else if (normKey.includes('industry') || normKey.includes('sector')) {
        if (!solution.industry) solution.industry = strValue;
      } else if (normKey.includes('usecase') || normKey.includes('case')) {
        if (!solution.useCase) solution.useCase = strValue;
      } else if (normKey.includes('value') || normKey.includes('proposition') || normKey.includes('benefit') || normKey.includes('impact')) {
        if (!solution.valueProposition) solution.valueProposition = strValue;
      }
    }

    // If we couldn't find a name, just use the first value as the name
    if (!solution.name) {
      const firstValue = Object.values(row)[0];
      if (firstValue) solution.name = String(firstValue).trim();
    }

    return solution;
  }).filter(s => !!s.name);
}
