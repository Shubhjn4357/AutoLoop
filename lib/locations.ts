/**
 * Location data for autocomplete
 * Includes major cities and countries worldwide
 */

export const cities = [
  // United States
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Charlotte, NC",
  "San Francisco, CA",
  "Indianapolis, IN",
  "Seattle, WA",
  "Denver, CO",
  "Boston, MA",
  "Miami, FL",
  "Atlanta, GA",
  "Las Vegas, NV",
  "Detroit, MI",
  "Portland, OR",

  // Canada
  "Toronto, ON, Canada",
  "Vancouver, BC, Canada",
  "Montreal, QC, Canada",
  "Calgary, AB, Canada",
  "Ottawa, ON, Canada",

  // UK
  "London, UK",
  "Manchester, UK",
  "Birmingham, UK",
  "Leeds, UK",
  "Glasgow, UK",
  "Edinburgh, UK",

  // Europe
  "Paris, France",
  "Berlin, Germany",
  "Rome, Italy",
  "Madrid, Spain",
  "Barcelona, Spain",
  "Amsterdam, Netherlands",
  "Vienna, Austria",
  "Dublin, Ireland",
  "Brussels, Belgium",
  "Prague, Czech Republic",

  // Asia
  "Tokyo, Japan",
  "Singapore",
  "Mumbai, India",
  "Delhi, India",
  "Bangalore, India",
  "Shanghai, China",
  "Beijing, China",
  "Hong Kong",
  "Seoul, South Korea",
  "Bangkok, Thailand",
  "Dubai, UAE",

  // Australia
  "Sydney, Australia",
  "Melbourne, Australia",
  "Brisbane, Australia",
  "Perth, Australia",

  // Other
  "Mexico City, Mexico",
  "São Paulo, Brazil",
  "Buenos Aires, Argentina",
];

export const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "China",
  "India",
  "Netherlands",
  "Sweden",
  "Switzerland",
  "Mexico",
  "Brazil",
];

// Combine and ensure uniqueness
export const allLocations = Array.from(new Set([...cities, ...countries]));
