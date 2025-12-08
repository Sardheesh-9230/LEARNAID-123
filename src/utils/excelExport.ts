import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - The data object to export
 * @param filename - The name of the file (without extension)
 * @param sheetName - Optional sheet name (default: 'Data')
 */
export const exportToExcel = (data: any, filename: string, sheetName: string = 'Data') => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(
      Array.isArray(data) ? data : [data]
    );
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

/**
 * Export multiple sheets to Excel
 * @param sheets - Array of {name, data} objects
 * @param filename - The name of the file (without extension)
 */
export const exportToExcelMultiSheet = (
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

/**
 * Export complex nested data to Excel with proper formatting
 * @param data - The complex data object
 * @param filename - The name of the file (without extension)
 */
export const exportComplexDataToExcel = (data: any, filename: string) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Function to flatten nested objects
    const flattenObject = (obj: any, prefix = ''): any => {
      return Object.keys(obj).reduce((acc: any, key: string) => {
        const pre = prefix.length ? `${prefix}_` : '';
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(acc, flattenObject(obj[key], pre + key));
        } else if (Array.isArray(obj[key])) {
          acc[pre + key] = JSON.stringify(obj[key]);
        } else {
          acc[pre + key] = obj[key];
        }
        return acc;
      }, {});
    };
    
    // Convert main data
    const flatData = Array.isArray(data) 
      ? data.map(item => flattenObject(item))
      : [flattenObject(data)];
    
    const mainSheet = XLSX.utils.json_to_sheet(flatData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Main Data');
    
    // Add metadata sheet
    const metadata = {
      'Export Date': new Date().toISOString(),
      'Data Type': Array.isArray(data) ? 'Array' : 'Object',
      'Record Count': Array.isArray(data) ? data.length : 1,
      'Exported By': 'LearnAID System'
    };
    
    const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting complex data to Excel:', error);
    return false;
  }
};
