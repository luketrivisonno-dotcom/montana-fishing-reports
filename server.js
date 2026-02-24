// Date standardization function
function standardizeDate(dateString) {
  if (!dateString) return 'Recently updated';
  
  try {
    // Try to parse various date formats
    let date;
    
    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString;
    } 
    // If it contains commas, might be "February 24, 2026" or "Wednesday, February 24, 2026"
    else if (dateString.includes(',')) {
      date = new Date(dateString);
    }
    // If it contains slashes, might be "02/24/2026" or "2/24/26"
    else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY or M/D/YY
        let month = parseInt(parts[0]) - 1;
        let day = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000; // Handle 2-digit years
        date = new Date(year, month, day);
      }
    }
    // Try direct parsing
    else {
      date = new Date(dateString);
    }
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    // Format as "Month Day, Year"
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString; // Return original on error
  }
}
