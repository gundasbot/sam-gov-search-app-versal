// lib/export.ts
export function generateCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or quotes
      const escaped = stringValue.replace(/"/g, '""');
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${escaped}"` 
        : escaped;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

export function generateJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

export function generateExcel(data: any[]): Buffer {
  // Simple TSV/CSV implementation for now
  // Install 'exceljs' or 'xlsx' for proper Excel generation
  const headers = Object.keys(data[0] || {}).join('\t');
  const rows = data.map(row => 
    Object.values(row).map(value => {
      if (value === null || value === undefined) return '';
      return String(value).replace(/\t/g, ' ');
    }).join('\t')
  ).join('\n');
  
  const content = headers + (rows ? '\n' + rows : '');
  return Buffer.from(content, 'utf-8');
}

export function generatePDF(data: any[]): Buffer {
  // Simple implementation - install 'pdfkit' for real PDF generation
  const jsonString = JSON.stringify(data, null, 2);
  return Buffer.from(jsonString, 'utf-8');
}
