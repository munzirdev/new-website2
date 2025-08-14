/**
 * Formats a date string to dd.mm.yyyy format with Latin characters
 * @param dateString - The date string to format
 * @returns Formatted date string in dd.mm.yyyy format
 */
export const formatDateToDDMMYYYY = (dateString: string | Date): string => {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

/**
 * Formats a date for display in the application
 * Always uses Gregorian calendar with Latin characters
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDisplayDate = (dateString: string | Date): string => {
  return formatDateToDDMMYYYY(dateString);
};

/**
 * Test function to verify date formatting
 * This function can be used to test the date formatting in the browser console
 */
export const testDateFormatting = () => {
  const testDates = [
    new Date(),
    new Date('2024-01-15'),
    new Date('2024-12-31'),
    new Date('2023-06-01')
  ];
  
  console.log('Testing date formatting:');
  testDates.forEach(date => {
    console.log(`${date.toISOString()} -> ${formatDisplayDate(date)}`);
  });
};
