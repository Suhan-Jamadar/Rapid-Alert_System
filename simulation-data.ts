import { SimulatedTweet, IncidentType, Priority, Alert, ProcessingLog, ResponderRole, DataSourceType } from '@/types/simulation';

// Comprehensive Indian locations database with 40+ cities
interface LocationData {
  area: string;
  city: string;
  lat: number;
  lng: number;
  disasters: IncidentType[];
}

const LOCATIONS: LocationData[] = [
  // North India
  { area: "New Delhi", city: "New Delhi", lat: 28.6139, lng: 77.2090, disasters: ['flood', 'fire', 'earthquake', 'infrastructure'] },
  { area: "Connaught Place", city: "New Delhi", lat: 28.6328, lng: 77.1897, disasters: ['infrastructure', 'medical'] },
  { area: "Noida Downtown", city: "Noida", lat: 28.5921, lng: 77.3055, disasters: ['fire', 'rescue'] },
  { area: "Ghaziabad Industrial", city: "Ghaziabad", lat: 28.6692, lng: 77.4538, disasters: ['fire', 'medical'] },
  { area: "Chandigarh Sector 22", city: "Chandigarh", lat: 30.7333, lng: 76.7794, disasters: ['flood', 'storm'] },
  { area: "Jaipur Civil Lines", city: "Jaipur", lat: 26.9124, lng: 75.7873, disasters: ['storm', 'earthquake'] },
  { area: "Lucknow Old City", city: "Lucknow", lat: 26.8467, lng: 80.9462, disasters: ['flood', 'fire'] },
  { area: "Varanasi Ghats", city: "Varanasi", lat: 25.3201, lng: 82.9853, disasters: ['flood', 'rescue'] },

  // West India
  { area: "Mumbai Downtown", city: "Mumbai", lat: 19.0760, lng: 72.8777, disasters: ['fire', 'flood', 'rescue', 'medical'] },
  { area: "Bandra Worli", city: "Mumbai", lat: 19.0596, lng: 72.8295, disasters: ['infrastructure', 'storm'] },
  { area: "Thane Industrial", city: "Thane", lat: 19.2183, lng: 72.9781, disasters: ['fire', 'medical'] },
  { area: "Pune IT Park", city: "Pune", lat: 18.5204, lng: 73.8567, disasters: ['rescue', 'infrastructure'] },
  { area: "Indore Downtown", city: "Indore", lat: 22.7196, lng: 75.8577, disasters: ['fire', 'earthquake'] },
  { area: "Ahmedabad City", city: "Ahmedabad", lat: 23.0225, lng: 72.5714, disasters: ['infrastructure', 'storm'] },
  { area: "Vadodara Downtown", city: "Vadodara", lat: 22.3072, lng: 73.1812, disasters: ['flood', 'fire'] },
  { area: "Surat Diamond Market", city: "Surat", lat: 21.1458, lng: 72.8336, disasters: ['fire', 'rescue'] },
  { area: "Rajkot Industrial", city: "Rajkot", lat: 22.3039, lng: 70.8022, disasters: ['medical', 'fire'] },

  // South India
  { area: "Bangalore IT Hub", city: "Bangalore", lat: 12.9352, lng: 77.6245, disasters: ['infrastructure', 'rescue'] },
  { area: "Hoskote National Highway", city: "Bangalore", lat: 12.9700, lng: 77.5900, disasters: ['rescue', 'medical'] },
  { area: "Mysore Palace Area", city: "Mysore", lat: 12.2958, lng: 76.6394, disasters: ['fire', 'flood'] },
  { area: "Coimbatore Industrial", city: "Coimbatore", lat: 11.0066, lng: 76.9645, disasters: ['fire', 'infrastructure'] },
  { area: "Ooty Hill Station", city: "Ooty", lat: 11.4102, lng: 76.6955, disasters: ['flood', 'storm'] },
  { area: "Kochi Port Area", city: "Kochi", lat: 9.9312, lng: 76.2673, disasters: ['fire', 'rescue', 'flood'] },
  { area: "Thiruvananthapuram Downtown", city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, disasters: ['flood', 'storm'] },
  { area: "Chennai Beach Road", city: "Chennai", lat: 13.0461, lng: 80.2812, disasters: ['storm', 'flood', 'rescue'] },
  { area: "Hyderabad IT Corridor", city: "Hyderabad", lat: 17.3850, lng: 78.4867, disasters: ['infrastructure', 'fire'] },
  { area: "Visakhapatnam Port", city: "Visakhapatnam", lat: 17.6869, lng: 83.2185, disasters: ['fire', 'rescue', 'medical'] },
  { area: "Tiruchirappalli Downtown", city: "Tiruchirappalli", lat: 10.7905, lng: 78.7047, disasters: ['flood', 'fire'] },
  { area: "Vijayawada Downtown", city: "Vijayawada", lat: 16.5062, lng: 80.6480, disasters: ['flood', 'rescue'] },

  // East & Northeast India
  { area: "Kolkata Downtown", city: "Kolkata", lat: 22.5726, lng: 88.3639, disasters: ['flood', 'fire', 'rescue'] },
  { area: "Bhubaneswar Downtown", city: "Bhubaneswar", lat: 20.1809, lng: 85.8830, disasters: ['storm', 'flood'] },
  { area: "Ranchi Downtown", city: "Ranchi", lat: 23.3441, lng: 85.3096, disasters: ['fire', 'rescue'] },
  { area: "Jabalpur Downtown", city: "Jabalpur", lat: 23.1815, lng: 79.9864, disasters: ['flood', 'fire'] },
  { area: "Nagpur Central", city: "Nagpur", lat: 21.1458, lng: 79.0882, disasters: ['fire', 'infrastructure'] },
  { area: "Guwahati Downtown", city: "Guwahati", lat: 26.1445, lng: 91.7362, disasters: ['flood', 'rescue', 'storm'] },
  { area: "Shillong Downtown", city: "Shillong", lat: 25.5788, lng: 91.8933, disasters: ['flood', 'storm'] },
  { area: "Imphal Downtown", city: "Imphal", lat: 24.8170, lng: 94.7885, disasters: ['flood', 'rescue'] },
];

// City name corrections for fuzzy matching
const CITY_CORRECTIONS: Record<string, string> = {
  'banglore': 'Bangalore', 'bangalor': 'Bangalore', 'bengaluru': 'Bangalore',
  'mumbaii': 'Mumbai', 'bombay': 'Mumbai',
  'delhi': 'New Delhi', 'new delhi': 'New Delhi',
  'kolkatta': 'Kolkata', 'calcutta': 'Kolkata',
  'chenai': 'Chennai', 'madras': 'Chennai',
  'hyderabadh': 'Hyderabad',
  'ahmedabadd': 'Ahmedabad',
  'chandigarhh': 'Chandigarh',
  'cochin': 'Kochi',
  'vizag': 'Visakhapatnam',
  'trivandrum': 'Thiruvananthapuram',
  'mysuru': 'Mysore',
  'belagavi': 'Belgaum',
  'udhagamandalam': 'Ooty',
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

// Find best matching location with fuzzy matching
function findBestLocationMatch(locationString: string): { lat: number; lng: number } {
  const words = locationString.toLowerCase().split(/[\s,.-]+/).filter(word => word.length > 2);
  
  // Try exact city match after corrections
  for (const word of words) {
    const correctedWord = CITY_CORRECTIONS[word] || word;
    for (const loc of LOCATIONS) {
      if (loc.city.toLowerCase() === correctedWord.toLowerCase()) {
        return { lat: loc.lat, lng: loc.lng };
      }
    }
  }
  
  // Fuzzy matching as fallback
  let bestMatch: { lat: number; lng: number } | null = null;
  let bestDistance = Infinity;
  
  for (const word of words) {
    for (const loc of LOCATIONS) {
      const distance = levenshteinDistance(word.toLowerCase(), loc.city.toLowerCase());
      if (distance < 3 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = { lat: loc.lat, lng: loc.lng };
      }
    }
  }
  
  return bestMatch || { lat: 20.5937, lng: 78.9629 }; // Default India center
}

// Disaster templates for realistic tweet generation
const DISASTER_TEMPLATES: Array<{ type: IncidentType; prefix: string; msg: string }> = [
  { type: 'flood', prefix: '🌊 FLOOD ALERT', msg: 'Massive flooding reported! Water levels rising fast.' },
  { type: 'fire', prefix: '🔥 FIRE ALERT', msg: 'Major fire outbreak! Building engulfed in flames.' },
  { type: 'earthquake', prefix: '⛰️ EARTHQUAKE', msg: 'Strong tremors felt! Buildings damaged.' },
  { type: 'rescue', prefix: '🚨 RESCUE NEEDED', msg: 'People trapped! Emergency response required.' },
  { type: 'medical', prefix: '🏥 MEDICAL EMERGENCY', msg: 'Multiple casualties reported!' },
  { type: 'infrastructure', prefix: '🔌 INFRASTRUCTURE DAMAGED', msg: 'Power lines down and roads blocked!' },
  { type: 'storm', prefix: '🌪️ STORM WARNING', msg: 'Severe storm damage across area!' },
];

// Random non-emergency tweets for improved feedback history
const RANDOM_TWEETS = [
  "Just had the best coffee ever! ☕ #morningvibes",
  "Beautiful sunset today! 🌅 #nature",
  "Traffic is crazy today #commute",
  "Grabbed lunch at my favorite place 🍝",
  "Movie night! What should I watch? 🎬",
  "Finally Friday! 🎉 #weekendplans",
  "Gym session done! 💪 #fitness",
  "Learning something new today 📚",
  "Great weather for a walk 🚴",
  "Just finished a good book 📖",
];

// Generate realistic varied tweets based on location disaster vulnerabilities
function generateRealisticTweets(): Array<{ text: string; location: string; type: IncidentType }> {
  return LOCATIONS.flatMap(loc => {
    const numScenarios = Math.floor(Math.random() * 3) + 1;
    return Array(numScenarios)
      .fill(null)
      .map(() => {
        const disasterType = loc.disasters[Math.floor(Math.random() * loc.disasters.length)];
        const template = DISASTER_TEMPLATES.find(t => t.type === disasterType) || DISASTER_TEMPLATES[0];
        
        return {
          text: `${template.prefix} in ${loc.area}, ${loc.city}! ${template.msg} #emergency`,
          location: `${loc.area}, ${loc.city}`,
          type: disasterType,
        };
      });
  });
}

let DISASTER_TWEETS = generateRealisticTweets();

const AUTHORS = ["@DisasterWatch", "@CityAlert", "@Citizen_Reporter", "@EmergencyNow", "@FieldCorrespondent", "@StormChaser", "@SafetyFirst", "@BreakingDisaster"];

const ROLE_MAP: Record<IncidentType, ResponderRole[]> = {
  fire: ['fire_department'],
  flood: ['flood_rescue'],
  earthquake: ['fire_department', 'medical', 'police'],
  rescue: ['fire_department', 'police'],
  medical: ['medical'],
  infrastructure: ['police'],
  storm: ['fire_department', 'flood_rescue'],
};

const PRIORITY_MAP: Record<IncidentType, Priority> = {
  fire: 'HIGH',
  flood: 'HIGH',
  earthquake: 'CRITICAL',
  rescue: 'MEDIUM',
  medical: 'HIGH',
  infrastructure: 'MEDIUM',
  storm: 'MEDIUM',
};

let tweetIndex = 0;

export function generateTweet(): SimulatedTweet {
  // 70% chance of emergency tweet, 30% chance of random tweet (for feedback history)
  const isRandomTweet = Math.random() < 0.3;
  
  if (isRandomTweet) {
    const randomText = RANDOM_TWEETS[Math.floor(Math.random() * RANDOM_TWEETS.length)];
    const randomLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    return {
      id: `tweet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: randomText,
      author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
      timestamp: new Date(),
      location: `${randomLocation.area}, ${randomLocation.city}`,
      isRandom: true,
    } as any;
  } else {
    const template = DISASTER_TWEETS[tweetIndex % DISASTER_TWEETS.length];
    tweetIndex++;
    return {
      id: `tweet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: template.text,
      author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
      timestamp: new Date(),
      location: template.location,
      isRandom: false,
    } as any;
  }
}

// Disaster keyword lists with confidence scoring
const DISASTER_KEYWORDS = {
  CRITICAL: ['explosion', 'earthquake', 'tremor', 'collapse', 'casualties', 'fatalities', 'mass casualties'],
  HIGH: ['fire', 'flood', 'wildfire', 'blaze', 'inundation', 'tsunami', 'landslide', 'avalanche'],
  MEDIUM: ['rescue', 'trapped', 'evacuation', 'emergency', 'disaster', 'crisis', 'danger', 'help needed'],
  LOW: ['accident', 'collision', 'crash', 'hazard', 'warning', 'alert'],
};

// Negative keywords that indicate non-emergency content
const NEGATIVE_KEYWORDS = [
  'movie', 'film', 'cinema', 'party', 'celebration', 'birthday', 'wedding',
  'game', 'sports', 'match', 'concert', 'festival', 'dinner', 'lunch', 'breakfast',
  'coffee', 'food', 'restaurant', 'travel', 'vacation', 'holiday', 'weekend',
  'shopping', 'sale', 'discount', 'music', 'dance', 'fun', 'enjoy', 'happy',
  'good morning', 'good night', 'good evening', 'sunset', 'sunrise', 'weather',
  'traffic', 'delay', 'late', 'appointment', 'meeting', 'work', 'office',
  'school', 'college', 'exam', 'result', 'grade', 'learning', 'study',
  'book', 'read', 'watch', 'listen', 'play', 'game', 'win', 'lose',
  'love', 'friend', 'family', 'baby', 'pet', 'dog', 'cat', 'cute', 'adorable',
  'beautiful', 'amazing', 'awesome', 'great', 'best', 'wonderful', 'fantastic',
  'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow', 'yesterday',
];

// Analyze text for disaster keywords and return confidence score
function analyzeDisasterContent(text: string): { score: number; matchedKeywords: string[]; highestPriority: Priority } {
  const lowerText = text.toLowerCase();
  let highestPriority: Priority = 'LOW';
  const matchedKeywords: string[] = [];
  let score = 0;

  // Check for CRITICAL keywords
  for (const keyword of DISASTER_KEYWORDS.CRITICAL) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += 40;
      highestPriority = 'CRITICAL';
    }
  }

  // Check for HIGH keywords
  for (const keyword of DISASTER_KEYWORDS.HIGH) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += 30;
      if (highestPriority !== 'CRITICAL') highestPriority = 'HIGH';
    }
  }

  // Check for MEDIUM keywords
  for (const keyword of DISASTER_KEYWORDS.MEDIUM) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += 20;
      if (highestPriority === 'LOW') highestPriority = 'MEDIUM';
    }
  }

  // Check for LOW keywords
  for (const keyword of DISASTER_KEYWORDS.LOW) {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += 10;
    }
  }

  return { score, matchedKeywords, highestPriority };
}

// Check if text is dominated by negative keywords
function hasNegativeKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  let negativeCount = 0;
  
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      negativeCount++;
    }
  }
  
  // If more than 2 negative keywords, likely non-emergency
  return negativeCount >= 2;
}

// Extract incident type from text
function extractIncidentType(text: string): IncidentType {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('earthquake') || lowerText.includes('tremor')) return 'earthquake';
  if (lowerText.includes('explosion') || lowerText.includes('blast')) return 'fire'; // Map explosion to fire
  if (lowerText.includes('fire') || lowerText.includes('blaze') || lowerText.includes('flame')) return 'fire';
  if (lowerText.includes('flood') || lowerText.includes('inundat') || lowerText.includes('water')) return 'flood';
  if (lowerText.includes('medical') || lowerText.includes('injury') || lowerText.includes('casualt')) return 'medical';
  if (lowerText.includes('rescue') || lowerText.includes('trapped')) return 'rescue';
  if (lowerText.includes('storm') || lowerText.includes('cyclone') || lowerText.includes('wind')) return 'storm';
  if (lowerText.includes('collapse') || lowerText.includes('building') || lowerText.includes('structure')) return 'infrastructure';
  
  return 'rescue'; // Default
}

export function classifyTweet(tweet: SimulatedTweet): { type: IncidentType; priority: Priority; shouldIgnore?: boolean } {
  const text = tweet.text || '';
  
  // Skip if already marked as random tweet
  if ((tweet as any).isRandom) {
    return { type: 'rescue', priority: 'LOW', shouldIgnore: true };
  }
  
  // Check for negative keywords first - if dominant, ignore
  if (hasNegativeKeywords(text)) {
    return { type: 'rescue', priority: 'LOW', shouldIgnore: true };
  }
  
  // Analyze disaster content
  const analysis = analyzeDisasterContent(text);
  
  // If no disaster keywords found, ignore
  if (analysis.score === 0) {
    return { type: 'rescue', priority: 'LOW', shouldIgnore: true };
  }
  
  // If negative keywords present along with disaster keywords, check balance
  const negativeCount = NEGATIVE_KEYWORDS.filter(k => text.toLowerCase().includes(k)).length;
  if (negativeCount > 0 && analysis.score < 30) {
    return { type: 'rescue', priority: 'LOW', shouldIgnore: true };
  }
  
  // Extract incident type from text
  const type = extractIncidentType(text);
  const priority = PRIORITY_MAP[type];
  
  return { type, priority, shouldIgnore: false };
}

export function generateProcessingLogs(
  sourceId: string,
  sourceType: DataSourceType,
  content: string,
  classification: { type: IncidentType; priority: Priority; shouldIgnore?: boolean },
  location?: string
): ProcessingLog[] {
  const base = Date.now();
  
  if (classification.shouldIgnore) {
    return [{
      id: `log-${base}-1`,
      timestamp: new Date(base),
      source: sourceType,
      sourceId,
      stage: 'edge_filter',
      message: `${sourceType === 'tweet' ? '🐦 Tweet' : sourceType === 'image' ? '📸 Image' : '📋 Report'} received from ${location || 'Unknown'}. Running keyword filter...`,
      result: `Non-emergency content detected. Filtered out - not disaster-related.`,
    }];
  }
  
  return [
    {
      id: `log-${base}-1`,
      timestamp: new Date(base),
      source: sourceType,
      sourceId,
      stage: 'edge_filter',
      message: `${sourceType === 'tweet' ? '🐦 Tweet' : sourceType === 'image' ? '📸 Image' : '📋 Report'} received from ${location || 'Unknown'}. Running keyword filter...`,
      result: `Disaster-related content detected at ${location}. Forwarding to AI module.`,
    },
    {
      id: `log-${base}-2`,
      timestamp: new Date(base + 150),
      source: sourceType,
      sourceId,
      stage: 'ai_analysis',
      message: `AI NLP analysis: "${content.slice(0, 60)}..." Location: ${location}`,
      result: `${classification.type.charAt(0).toUpperCase() + classification.type.slice(1)} detected → Priority: ${classification.priority}`,
      priority: classification.priority,
      incidentType: classification.type,
    },
    {
      id: `log-${base}-3`,
      timestamp: new Date(base + 300),
      source: sourceType,
      sourceId,
      stage: 'alert_generation',
      message: `Generating structured alert for ${classification.type} incident at ${location}`,
      result: `Alert created with ${classification.priority} priority`,
      priority: classification.priority,
      incidentType: classification.type,
    },
    {
      id: `log-${base}-4`,
      timestamp: new Date(base + 450),
      source: sourceType,
      sourceId,
      stage: 'queue_distribution',
      message: `Publishing to message queue → ${ROLE_MAP[classification.type].join(', ')} channels. Location: ${location}`,
      result: `Distributed to ${ROLE_MAP[classification.type].length} responder channel(s) for ${location}`,
      priority: classification.priority,
      incidentType: classification.type,
    },
  ];
}

export function createAlert(
  sourceId: string,
  sourceType: DataSourceType,
  location: string,
  description: string,
  classification: { type: IncidentType; priority: Priority; shouldIgnore?: boolean }
): Alert | null {
  // Don't create alerts for ignored tweets
  if (classification.shouldIgnore) {
    return null;
  }
  
  const coords = findBestLocationMatch(location);
  
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    priority: classification.priority,
    incidentType: classification.type,
    location,
    description,
    timestamp: new Date(),
    coordinates: coords,
    sourceType,
    sourceId,
    responderRoles: ['all', ...ROLE_MAP[classification.type]],
  };
}
