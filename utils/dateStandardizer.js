/**
 * Date Standardization Utility
 * 
 * All scrapers should use this to ensure consistent date handling.
 * Goals:
 * 1. Extract actual report dates from websites (not "today")
 * 2. Standardize to ISO format for database storage
 * 3. Provide consistent display formatting
 */

const MONTHS = {
  'jan': 0, 'january': 0, 'feb': 1, 'february': 1,
  'mar': 2, 'march': 2, 'apr': 3, 'april': 3,
  'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
  'aug': 7, 'august': 7, 'sep': 8, 'sept': 8, 'september': 8,
  'oct': 9, 'october': 9, 'nov': 10, 'november': 10,
  'dec': 11, 'december': 11
};

/**
 * Extracts date from page text using multiple patterns
 * Returns null if no date found (does NOT default to today)
 */
function extractDateFromText(text, sourceHint = '') {
  if (!text) return null;
  
  const cleanText = text.replace(/\s+/g, ' ');
  
  // Date patterns to try, in order of preference
  const patterns = [
    // ISO format: 2026-03-10 or 2026-03-10T12:00:00Z
    {
      regex: /(\d{4})-(\d{1,2})-(\d{1,2})(?:T|\s|$)/,
      parser: (m) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
    },
    // Full month name: March 10, 2026 or March 10 2026
    {
      regex: /([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/,
      parser: (m) => {
        const month = MONTHS[m[1].toLowerCase()];
        if (month === undefined) return null;
        return new Date(parseInt(m[3]), month, parseInt(m[2]));
      }
    },
    // Short year format: 3/10/26 or 03/10/26
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{2})(?:\D|$)/,
      parser: (m) => {
        const year = parseInt(m[3]);
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        return new Date(fullYear, parseInt(m[1]) - 1, parseInt(m[2]));
      }
    },
    // Full year slash format: 3/10/2026
    {
      regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      parser: (m) => new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]))
    },
    // Dot format: 03.10.2026
    {
      regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
      parser: (m) => new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]))
    },
    // Month abbreviation + day (current year): Mar 10
    {
      regex: /([A-Za-z]{3})\s+(\d{1,2})(?:\D|$)/,
      parser: (m) => {
        const month = MONTHS[m[1].toLowerCase()];
        if (month === undefined) return null;
        return new Date(new Date().getFullYear(), month, parseInt(m[2]));
      }
    }
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern.regex);
    if (match) {
      try {
        const date = pattern.parser(match);
        if (date && !isNaN(date.getTime())) {
          // Validate date is reasonable (not in future, not too old)
          const now = new Date();
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          
          if (date > now) {
            // Future date - likely parsed wrong, skip
            continue;
          }
          if (date < oneYearAgo) {
            // More than a year old - might be wrong, but keep looking
            continue;
          }
          return date;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Standardizes any date input to ISO string format
 * Returns null if date cannot be parsed (does NOT default to today)
 */
function standardizeDate(dateInput) {
  if (!dateInput) return null;
  
  // If already a Date object
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput.toISOString();
  }
  
  // Try direct parsing
  const direct = new Date(dateInput);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString();
  }
  
  // Try extraction from text
  const extracted = extractDateFromText(String(dateInput));
  if (extracted) {
    return extracted.toISOString();
  }
  
  return null;
}

/**
 * Formats date for display in mobile app
 * "Mar 10" for current year, "Mar 10, 2025" for past years
 */
function formatForDisplay(isoDateString) {
  if (!isoDateString) return 'Date unknown';
  
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return 'Date unknown';
    
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();
    
    if (isCurrentYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {
    return 'Date unknown';
  }
}

/**
 * Gets relative time description
 * "Today", "Yesterday", "3 days ago", etc.
 */
function getRelativeTime(isoDateString) {
  if (!isoDateString) return 'Unknown';
  
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Validates if a date string is recent (within last X days)
 */
function isRecent(isoDateString, days = 7) {
  if (!isoDateString) return false;
  
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return diffDays <= days;
  } catch (e) {
    return false;
  }
}

module.exports = {
  extractDateFromText,
  standardizeDate,
  formatForDisplay,
  getRelativeTime,
  isRecent
};
