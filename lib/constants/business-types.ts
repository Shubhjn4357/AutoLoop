export interface BusinessType {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  popular?: boolean;
}

export const BUSINESS_CATEGORIES = [
  "Food & Dining",
  "Retail & Shopping",
  "Professional Services",
  "Healthcare & Wellness",
  "Home Services",
  "Automotive",
  "Real Estate",
  "Beauty & Personal Care",
  "Entertainment & Recreation",
  "Education & Training",
  "Technology & IT",
  "Financial Services",
  "Construction & Trades",
  "Hospitality & Tourism",
  "Sports & Fitness",
] as const;

export const BUSINESS_TYPES: BusinessType[] = [
  // Food & Dining
  { id: "restaurant-fine", name: "Fine Dining Restaurant", category: "Food & Dining", description: "Upscale dining experience", keywords: ["fine dining", "upscale", "gourmet", "chef", "wine", "reservations"], popular: true },
  { id: "restaurant-casual", name: "Casual Restaurant", category: "Food & Dining", description: "Relaxed dining atmosphere", keywords: ["casual dining", "family friendly", "affordable", "menu"], popular: true },
  { id: "fast-food", name: "Fast Food", category: "Food & Dining", description: "Quick service restaurant", keywords: ["fast food", "quick service", "drive-thru", "takeout"] },
  { id: "cafe-coffee", name: "Café / Coffee Shop", category: "Food & Dining", description: "Coffee and light meals", keywords: ["coffee", "café", "espresso", "pastries", "wifi"], popular: true },
  { id: "bakery", name: "Bakery", category: "Food & Dining", description: "Fresh baked goods", keywords: ["bakery", "bread", "cakes", "pastries", "custom orders"] },
  { id: "bar-pub", name: "Bar / Pub", category: "Food & Dining", description: "Alcoholic beverages and social space", keywords: ["bar", "pub", "drinks", "cocktails", "happy hour"] },
  { id: "food-truck", name: "Food Truck", category: "Food & Dining", description: "Mobile food service", keywords: ["food truck", "mobile", "street food", "catering"] },
  { id: "pizzeria", name: "Pizzeria", category: "Food & Dining", description: "Pizza restaurant", keywords: ["pizza", "italian", "delivery", "takeout"] },
  { id: "sushi", name: "Sushi Restaurant", category: "Food & Dining", description: "Japanese cuisine", keywords: ["sushi", "japanese", "sashimi", "rolls"] },
  { id: "steakhouse", name: "Steakhouse", category: "Food & Dining", description: "Steak-focused restaurant", keywords: ["steak", "beef", "grill", "prime rib"] },

  // Retail & Shopping
  { id: "boutique-clothing", name: "Clothing Boutique", category: "Retail & Shopping", description: "Fashion retail store", keywords: ["boutique", "fashion", "clothing", "apparel", "trends"], popular: true },
  { id: "grocery-store", name: "Grocery Store", category: "Retail & Shopping", description: "Food and household items", keywords: ["grocery", "supermarket", "food", "produce", "organic"] },
  { id: "electronics", name: "Electronics Store", category: "Retail & Shopping", description: "Consumer electronics", keywords: ["electronics", "computers", "phones", "gadgets", "tech"] },
  { id: "bookstore", name: "Bookstore", category: "Retail & Shopping", description: "Books and reading materials", keywords: ["books", "reading", "literature", "bestsellers"] },
  { id: "jewelry", name: "Jewelry Store", category: "Retail & Shopping", description: "Fine jewelry and accessories", keywords: ["jewelry", "diamonds", "watches", "engagement rings"] },
  { id: "furniture", name: "Furniture Store", category: "Retail & Shopping", description: "Home furnishings", keywords: ["furniture", "home decor", "interior design", "custom"] },
  { id: "sporting-goods", name: "Sporting Goods", category: "Retail & Shopping", description: "Sports equipment and apparel", keywords: ["sports", "equipment", "athletic", "fitness gear"] },
  { id: "pet-store", name: "Pet Store", category: "Retail & Shopping", description: "Pet supplies and services", keywords: ["pets", "pet supplies", "grooming", "pet food"] },
  { id: "florist", name: "Florist", category: "Retail & Shopping", description: "Flowers and arrangements", keywords: ["flowers", "florist", "bouquets", "weddings", "delivery"] },
  { id: "gift-shop", name: "Gift Shop", category: "Retail & Shopping", description: "Gifts and novelties", keywords: ["gifts", "souvenirs", "novelties", "unique items"] },

  // Professional Services
  { id: "law-firm", name: "Law Firm", category: "Professional Services", description: "Legal services", keywords: ["lawyer", "attorney", "legal", "litigation", "consultation"], popular: true },
  { id: "accounting", name: "Accounting Firm", category: "Professional Services", description: "Financial and tax services", keywords: ["accounting", "tax", "bookkeeping", "CPA", "financial"] },
  { id: "consulting", name: "Business Consulting", category: "Professional Services", description: "Business strategy and advice", keywords: ["consulting", "strategy", "business advice", "management"] },
  { id: "marketing-agency", name: "Marketing Agency", category: "Professional Services", description: "Marketing and advertising", keywords: ["marketing", "advertising", "digital marketing", "SEO", "social media"], popular: true },
  { id: "insurance", name: "Insurance Agency", category: "Professional Services", description: "Insurance products", keywords: ["insurance", "coverage", "policy", "claims", "agent"] },
  { id: "financial-advisor", name: "Financial Advisor", category: "Professional Services", description: "Investment and financial planning", keywords: ["financial planning", "investment", "retirement", "wealth management"] },
  { id: "architecture", name: "Architecture Firm", category: "Professional Services", description: "Building design services", keywords: ["architect", "design", "buildings", "blueprints", "commercial"] },
  { id: "engineering", name: "Engineering Firm", category: "Professional Services", description: "Engineering services", keywords: ["engineering", "design", "structural", "civil", "mechanical"] },
  { id: "photography", name: "Photography Studio", category: "Professional Services", description: "Professional photography", keywords: ["photography", "photos", "portraits", "weddings", "commercial"] },
  { id: "graphic-design", name: "Graphic Design", category: "Professional Services", description: "Visual design services", keywords: ["graphic design", "branding", "logo", "creative", "design"] },

  // Healthcare & Wellness
  { id: "dental-clinic", name: "Dental Clinic", category: "Healthcare & Wellness", description: "Dental care services", keywords: ["dentist", "dental", "teeth", "cleaning", "orthodontics"], popular: true },
  { id: "medical-clinic", name: "Medical Clinic", category: "Healthcare & Wellness", description: "General medical care", keywords: ["doctor", "clinic", "medical", "healthcare", "primary care"] },
  { id: "chiropractor", name: "Chiropractor", category: "Healthcare & Wellness", description: "Chiropractic care", keywords: ["chiropractor", "spine", "adjustment", "pain relief", "wellness"] },
  { id: "physical-therapy", name: "Physical Therapy", category: "Healthcare & Wellness", description: "Rehabilitation services", keywords: ["physical therapy", "rehab", "injury", "recovery", "sports medicine"] },
  { id: "veterinary", name: "Veterinary Clinic", category: "Healthcare & Wellness", description: "Animal healthcare", keywords: ["vet", "veterinary", "pet care", "animal hospital", "surgery"] },
  { id: "optometry", name: "Optometry", category: "Healthcare & Wellness", description: "Eye care services", keywords: ["optometrist", "eye exam", "glasses", "contacts", "vision"] },
  { id: "pharmacy", name: "Pharmacy", category: "Healthcare & Wellness", description: "Prescription medications", keywords: ["pharmacy", "prescriptions", "medications", "drugstore", "health"] },
  { id: "massage", name: "Massage Therapy", category: "Healthcare & Wellness", description: "Therapeutic massage", keywords: ["massage", "spa", "relaxation", "therapeutic", "wellness"] },
  { id: "mental-health", name: "Mental Health Services", category: "Healthcare & Wellness", description: "Therapy and counseling", keywords: ["therapy", "counseling", "mental health", "psychologist", "psychiatrist"] },
  { id: "urgent-care", name: "Urgent Care Center", category: "Healthcare & Wellness", description: "Walk-in medical care", keywords: ["urgent care", "walk-in", "emergency", "immediate care"] },

  // Home Services
  { id: "plumbing", name: "Plumbing Services", category: "Home Services", description: "Plumbing repairs and installation", keywords: ["plumber", "plumbing", "pipes", "leak repair", "emergency"], popular: true },
  { id: "electrical", name: "Electrical Services", category: "Home Services", description: "Electrical work", keywords: ["electrician", "electrical", "wiring", "installation", "repair"] },
  { id: "hvac", name: "HVAC Services", category: "Home Services", description: "Heating and cooling", keywords: ["HVAC", "heating", "cooling", "AC", "furnace", "repair"] },
  { id: "cleaning", name: "Cleaning Services", category: "Home Services", description: "Professional cleaning", keywords: ["cleaning", "maid service", "janitorial", "house cleaning", "commercial"] },
  { id: "landscaping", name: "Landscaping", category: "Home Services", description: "Lawn and garden services", keywords: ["landscaping", "lawn care", "gardening", "irrigation", "design"] },
  { id: "roofing", name: "Roofing Services", category: "Home Services", description: "Roof installation and repair", keywords: ["roofing", "roof repair", "shingles", "installation", "leak"] },
  { id: "painting", name: "Painting Services", category: "Home Services", description: "Interior and exterior painting", keywords: ["painting", "painter", "interior", "exterior", "commercial"] },
  { id: "handyman", name: "Handyman Services", category: "Home Services", description: "General home repairs", keywords: ["handyman", "repairs", "maintenance", "fixes", "odd jobs"] },
  { id: "pest-control", name: "Pest Control", category: "Home Services", description: "Pest extermination", keywords: ["pest control", "exterminator", "termites", "bugs", "rodents"] },
  { id: "locksmith", name: "Locksmith", category: "Home Services", description: "Lock services", keywords: ["locksmith", "locks", "keys", "security", "emergency"] },

  // Automotive
  { id: "auto-repair", name: "Auto Repair Shop", category: "Automotive", description: "Vehicle repair and maintenance", keywords: ["auto repair", "mechanic", "car service", "maintenance", "brake repair"], popular: true },
  { id: "car-dealership", name: "Car Dealership", category: "Automotive", description: "New and used vehicle sales", keywords: ["car dealer", "auto sales", "new cars", "used cars", "financing"] },
  { id: "auto-detailing", name: "Auto Detailing", category: "Automotive", description: "Car cleaning and detailing", keywords: ["detailing", "car wash", "cleaning", "wax", "interior"] },
  { id: "auto-parts", name: "Auto Parts Store", category: "Automotive", description: "Vehicle parts and accessories", keywords: ["auto parts", "car parts", "accessories", "repairs", "aftermarket"] },
  { id: "tire-shop", name: "Tire Shop", category: "Automotive", description: "Tire sales and service", keywords: ["tires", "tire service", "alignment", "rotation", "installation"] },
  { id: "body-shop", name: "Auto Body Shop", category: "Automotive", description: "Collision repair", keywords: ["body shop", "collision repair", "paint", "dent removal", "insurance"] },
  { id: "oil-change", name: "Oil Change / Lube", category: "Automotive", description: "Quick oil change service", keywords: ["oil change", "lube", "quick service", "maintenance", "filter"] },
  { id: "towing", name: "Towing Service", category: "Automotive", description: "Vehicle towing and recovery", keywords: ["towing", "roadside assistance", "recovery", "emergency", "24/7"] },

  // Real Estate
  { id: "real-estate-agent", name: "Real Estate Agent", category: "Real Estate", description: "Property sales and listings", keywords: ["realtor", "real estate", "homes for sale", "listings", "agent"], popular: true },
  { id: "property-management", name: "Property Management", category: "Real Estate", description: "Rental property management", keywords: ["property management", "rentals", "landlord", "tenants", "maintenance"] },
  { id: "real-estate-developer", name: "Real Estate Developer", category: "Real Estate", description: "Property development", keywords: ["developer", "construction", "new builds", "commercial", "residential"] },
  { id: "mortgage-broker", name: "Mortgage Broker", category: "Real Estate", description: "Home loan services", keywords: ["mortgage", "loans", "home financing", "refinance", "rates"] },
  { id: "home-inspector", name: "Home Inspector", category: "Real Estate", description: "Property inspections", keywords: ["home inspection", "inspector", "evaluation", "report", "pre-purchase"] },

  // Beauty & Personal Care
  { id: "hair-salon", name: "Hair Salon", category: "Beauty & Personal Care", description: "Hair styling and services", keywords: ["salon", "hair", "haircut", "color", "styling"], popular: true },
  { id: "barber-shop", name: "Barber Shop", category: "Beauty & Personal Care", description: "Men's grooming", keywords: ["barber", "haircut", "shave", "beard trim", "mens grooming"] },
  { id: "nail-salon", name: "Nail Salon", category: "Beauty & Personal Care", description: "Nail care services", keywords: ["nail salon", "manicure", "pedicure", "gel nails", "acrylic"] },
  { id: "spa", name: "Day Spa", category: "Beauty & Personal Care", description: "Spa treatments and relaxation", keywords: ["spa", "massage", "facial", "relaxation", "treatments"] },
  { id: "tanning-salon", name: "Tanning Salon", category: "Beauty & Personal Care", description: "Tanning services", keywords: ["tanning", "spray tan", "UV beds", "sunless tanning"] },
  { id: "tattoo-parlor", name: "Tattoo Parlor", category: "Beauty & Personal Care", description: "Tattoo and piercing services", keywords: ["tattoo", "ink", "piercing", "body art", "custom design"] },

  // Entertainment & Recreation
  { id: "movie-theater", name: "Movie Theater", category: "Entertainment & Recreation", description: "Film entertainment", keywords: ["movies", "cinema", "theater", "films", "showtime"] },
  { id: "bowling-alley", name: "Bowling Alley", category: "Entertainment & Recreation", description: "Bowling entertainment", keywords: ["bowling", "lanes", "leagues", "parties", "arcade"] },
  { id: "golf-course", name: "Golf Course", category: "Entertainment & Recreation", description: "Golf facility", keywords: ["golf", "golf course", "tee times", "pro shop", "lessons"] },
  { id: "amusement-park", name: "Amusement Park", category: "Entertainment & Recreation", description: "Theme park entertainment", keywords: ["amusement park", "rides", "attractions", "family fun", "tickets"] },
  { id: "escape-room", name: "Escape Room", category: "Entertainment & Recreation", description: "Interactive puzzle games", keywords: ["escape room", "puzzle", "team building", "game", "adventure"] },

  // Education & Training
  { id: "tutoring", name: "Tutoring Services", category: "Education & Training", description: "Academic tutoring", keywords: ["tutoring", "education", "academic help", "test prep", "learning"], popular: true },
  { id: "music-lessons", name: "Music School", category: "Education & Training", description: "Music instruction", keywords: ["music lessons", "piano", "guitar", "violin", "instruction"] },
  { id: "dance-studio", name: "Dance Studio", category: "Education & Training", description: "Dance classes", keywords: ["dance", "classes", "ballet", "hip hop", "lessons"] },
  { id: "driving-school", name: "Driving School", category: "Education & Training", description: "Driving instruction", keywords: ["driving school", "drivers ed", "lessons", "license", "training"] },
  { id: "language-school", name: "Language School", category: "Education & Training", description: "Language instruction", keywords: ["language", "ESL", "spanish", "french", "bilingual"] },

  // Technology & IT
  { id: "it-services", name: "IT Services", category: "Technology & IT", description: "Technology support", keywords: ["IT support", "tech services", "managed services", "network", "cybersecurity"], popular: true },
  { id: "software-dev", name: "Software Development", category: "Technology & IT", description: "Custom software solutions", keywords: ["software", "development", "programming", "apps", "web development"] },
  { id: "web-design", name: "Web Design", category: "Technology & IT", description: "Website design and development", keywords: ["web design", "website", "responsive", "ecommerce", "wordpress"] },
  { id: "computer-repair", name: "Computer Repair", category: "Technology & IT", description: "Computer maintenance and repair", keywords: ["computer repair", "laptop", "PC", "troubleshooting", "data recovery"] },

  // Financial Services
  { id: "bank", name: "Bank", category: "Financial Services", description: "Banking services", keywords: ["bank", "checking", "savings", "loans", "mortgage"], popular: true },
  { id: "credit-union", name: "Credit Union", category: "Financial Services", description: "Member-owned financial cooperative", keywords: ["credit union", "banking", "loans", "savings", "members"] },
  { id: "tax-preparation", name: "Tax Preparation", category: "Financial Services", description: "Tax filing services", keywords: ["tax preparation", "tax filing", "IRS", "returns", "refund"] },
  { id: "payroll-services", name: "Payroll Services", category: "Financial Services", description: "Payroll processing", keywords: ["payroll", "HR", "employee benefits", "direct deposit", "tax filing"] },

  // Construction & Trades
  { id: "general-contractor", name: "General Contractor", category: "Construction & Trades", description: "Construction management", keywords: ["contractor", "construction", "remodeling", "renovation", "building"], popular: true },
  { id: "carpentry", name: "Carpentry Services", category: "Construction & Trades", description: "Woodworking and carpentry", keywords: ["carpenter", "woodwork", "custom", "cabinets", "framing"] },
  { id: "flooring", name: "Flooring Services", category: "Construction & Trades", description: "Floor installation", keywords: ["flooring", "hardwood", "tile", "carpet", "installation"] },
  { id: "concrete", name: "Concrete Services", category: "Construction & Trades", description: "Concrete work", keywords: ["concrete", "driveway", "patio", "foundation", "flatwork"] },

  // Hospitality & Tourism
  { id: "hotel", name: "Hotel", category: "Hospitality & Tourism", description: "Lodging accommodation", keywords: ["hotel", "rooms", "reservations", "accommodation", "hospitality"], popular: true },
  { id: "bed-breakfast", name: "Bed & Breakfast", category: "Hospitality & Tourism", description: "Small lodging with breakfast", keywords: ["B&B", "bed and breakfast", "inn", "lodging", "getaway"] },
  { id: "tour-operator", name: "Tour Operator", category: "Hospitality & Tourism", description: "Travel and tour services", keywords: ["tours", "travel", "sightseeing", "excursions", "packages"] },
  { id: "event-venue", name: "Event Venue", category: "Hospitality & Tourism", description: "Event and party space", keywords: ["venue", "events", "weddings", "meetings", "celebrations"] },

  // Sports & Fitness
  { id: "gym", name: "Gym / Fitness Center", category: "Sports & Fitness", description: "Fitness facility", keywords: ["gym", "fitness", "workout", "training", "membership"], popular: true },
  { id: "yoga-studio", name: "Yoga Studio", category: "Sports & Fitness", description: "Yoga classes", keywords: ["yoga", "meditation", "classes", "wellness", "mindfulness"] },
  { id: "martial-arts", name: "Martial Arts School", category: "Sports & Fitness", description: "Martial arts training", keywords: ["martial arts", "karate", "jiu-jitsu", "self defense", "training"] },
  { id: "personal-trainer", name: "Personal Training", category: "Sports & Fitness", description: "One-on-one fitness coaching", keywords: ["personal trainer", "fitness coach", "weight loss", "strength training"] },
];

export function getBusinessTypesByCategory(category: string): BusinessType[] {
  return BUSINESS_TYPES.filter(type => type.category === category);
}

export function searchBusinessTypes(query: string): BusinessType[] {
  const lowercaseQuery = query.toLowerCase();
  return BUSINESS_TYPES.filter(type => 
    type.name.toLowerCase().includes(lowercaseQuery) ||
    type.description.toLowerCase().includes(lowercaseQuery) ||
    type.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
  );
}

export function getPopularBusinessTypes(): BusinessType[] {
  return BUSINESS_TYPES.filter(type => type.popular);
}
