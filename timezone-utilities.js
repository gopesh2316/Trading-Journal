// timezone-utilities.js
export function isValidIanaTZ(tz) {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }).format(0); return true; }
  catch { return false; }
}

// Get all IANA timezones with fallback
export function getAllIanaZones() {
  // Prefer Intl.supportedValuesOf if available
  if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      console.warn('Intl.supportedValuesOf not available, using fallback');
    }
  }
  
  // Fallback: comprehensive IANA timezone list
  return [
    // UTC
    'UTC',
    
    // Africa
    'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers', 'Africa/Asmara',
    'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul', 'Africa/Bissau', 'Africa/Blantyre',
    'Africa/Brazzaville', 'Africa/Bujumbura', 'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta',
    'Africa/Conakry', 'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
    'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare', 'Africa/Johannesburg',
    'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum', 'Africa/Kigali', 'Africa/Kinshasa',
    'Africa/Lagos', 'Africa/Libreville', 'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi',
    'Africa/Lusaka', 'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
    'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena', 'Africa/Niamey',
    'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo', 'Africa/Sao_Tome', 'Africa/Tripoli',
    'Africa/Tunis', 'Africa/Windhoek',
    
    // America
    'America/Adak', 'America/Anchorage', 'America/Anguilla', 'America/Antigua', 'America/Araguaina',
    'America/Argentina/Buenos_Aires', 'America/Argentina/Catamarca', 'America/Argentina/Cordoba',
    'America/Argentina/Jujuy', 'America/Argentina/La_Rioja', 'America/Argentina/Mendoza',
    'America/Argentina/Rio_Gallegos', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
    'America/Argentina/San_Luis', 'America/Argentina/Tucuman', 'America/Argentina/Ushuaia',
    'America/Aruba', 'America/Asuncion', 'America/Atikokan', 'America/Bahia', 'America/Bahia_Banderas',
    'America/Barbados', 'America/Belem', 'America/Belize', 'America/Blanc-Sablon', 'America/Boa_Vista',
    'America/Bogota', 'America/Boise', 'America/Cambridge_Bay', 'America/Campo_Grande', 'America/Cancun',
    'America/Caracas', 'America/Cayenne', 'America/Cayman', 'America/Chicago', 'America/Chihuahua',
    'America/Costa_Rica', 'America/Creston', 'America/Cuiaba', 'America/Curacao', 'America/Danmarkshavn',
    'America/Dawson', 'America/Dawson_Creek', 'America/Denver', 'America/Detroit', 'America/Dominica',
    'America/Edmonton', 'America/Eirunepe', 'America/El_Salvador', 'America/Fort_Nelson', 'America/Fortaleza',
    'America/Glace_Bay', 'America/Goose_Bay', 'America/Grand_Turk', 'America/Grenada', 'America/Guadeloupe',
    'America/Guatemala', 'America/Guayaquil', 'America/Guyana', 'America/Halifax', 'America/Havana',
    'America/Hermosillo', 'America/Indiana/Indianapolis', 'America/Indiana/Knox', 'America/Indiana/Marengo',
    'America/Indiana/Petersburg', 'America/Indiana/Tell_City', 'America/Indiana/Vevay', 'America/Indiana/Vincennes',
    'America/Indiana/Winamac', 'America/Inuvik', 'America/Iqaluit', 'America/Jamaica', 'America/Juneau',
    'America/Kentucky/Louisville', 'America/Kentucky/Monticello', 'America/Kralendijk', 'America/La_Paz',
    'America/Lima', 'America/Los_Angeles', 'America/Lower_Princes', 'America/Maceio', 'America/Managua',
    'America/Manaus', 'America/Marigot', 'America/Martinique', 'America/Matamoros', 'America/Mazatlan',
    'America/Menominee', 'America/Merida', 'America/Metlakatla', 'America/Mexico_City', 'America/Miquelon',
    'America/Moncton', 'America/Monterrey', 'America/Montevideo', 'America/Montserrat', 'America/Nassau',
    'America/New_York', 'America/Nipigon', 'America/Nome', 'America/Noronha', 'America/North_Dakota/Beulah',
    'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/Nuuk', 'America/Ojinaga',
    'America/Panama', 'America/Pangnirtung', 'America/Paramaribo', 'America/Phoenix', 'America/Port-au-Prince',
    'America/Port_of_Spain', 'America/Porto_Velho', 'America/Puerto_Rico', 'America/Punta_Arenas',
    'America/Rainy_River', 'America/Rankin_Inlet', 'America/Recife', 'America/Regina', 'America/Resolute',
    'America/Rio_Branco', 'America/Santarem', 'America/Santiago', 'America/Santo_Domingo', 'America/Sao_Paulo',
    'America/Scoresbysund', 'America/Sitka', 'America/St_Barthelemy', 'America/St_Johns', 'America/St_Kitts',
    'America/St_Lucia', 'America/St_Thomas', 'America/St_Vincent', 'America/Swift_Current', 'America/Tegucigalpa',
    'America/Thule', 'America/Thunder_Bay', 'America/Tijuana', 'America/Toronto', 'America/Tortola',
    'America/Vancouver', 'America/Whitehorse', 'America/Winnipeg', 'America/Yakutat', 'America/Yellowknife',
    
    // Antarctica
    'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/DumontDUrville', 'Antarctica/Macquarie',
    'Antarctica/Mawson', 'Antarctica/McMurdo', 'Antarctica/Palmer', 'Antarctica/Rothera', 'Antarctica/Syowa',
    'Antarctica/Troll', 'Antarctica/Vostok',
    
    // Arctic
    'Arctic/Longyearbyen',
    
    // Asia
    'Asia/Aden', 'Asia/Almaty', 'Asia/Amman', 'Asia/Anadyr', 'Asia/Aqtau', 'Asia/Aqtobe', 'Asia/Ashgabat',
    'Asia/Atyrau', 'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Baku', 'Asia/Bangkok', 'Asia/Barnaul', 'Asia/Beirut',
    'Asia/Bishkek', 'Asia/Brunei', 'Asia/Chita', 'Asia/Choibalsan', 'Asia/Colombo', 'Asia/Damascus',
    'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe', 'Asia/Famagusta', 'Asia/Gaza', 'Asia/Hebron',
    'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd', 'Asia/Irkutsk', 'Asia/Istanbul', 'Asia/Jakarta',
    'Asia/Jayapura', 'Asia/Jerusalem', 'Asia/Kabul', 'Asia/Kamchatka', 'Asia/Karachi', 'Asia/Kathmandu',
    'Asia/Khandyga', 'Asia/Kolkata', 'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching', 'Asia/Kuwait',
    'Asia/Macau', 'Asia/Magadan', 'Asia/Makassar', 'Asia/Manila', 'Asia/Muscat', 'Asia/Nicosia',
    'Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Phnom_Penh', 'Asia/Pontianak',
    'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Riyadh', 'Asia/Sakhalin',
    'Asia/Samarkand', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Srednekolymsk', 'Asia/Taipei',
    'Asia/Tashkent', 'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Thimphu', 'Asia/Tokyo', 'Asia/Tomsk',
    'Asia/Ulaanbaatar', 'Asia/Urumqi', 'Asia/Ust-Nera', 'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk',
    'Asia/Yangon', 'Asia/Yekaterinburg', 'Asia/Yerevan',
    
    // Atlantic
    'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
    'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena',
    'Atlantic/Stanley', 'Atlantic/Tristan_da_Cunha',
    
    // Australia
    'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Darwin', 'Australia/Eucla',
    'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe', 'Australia/Melbourne', 'Australia/Perth',
    'Australia/Sydney',
    
    // Europe
    'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Astrakhan', 'Europe/Athens', 'Europe/Belgrade',
    'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest',
    'Europe/Busingen', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin', 'Europe/Gibraltar',
    'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul', 'Europe/Jersey',
    'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Kirov', 'Europe/Lisbon', 'Europe/Ljubljana',
    'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
    'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris', 'Europe/Podgorica',
    'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara', 'Europe/San_Marino', 'Europe/Sarajevo',
    'Europe/Saratov', 'Europe/Simferopol', 'Europe/Skopje', 'Europe/Sofia', 'Europe/Stockholm',
    'Europe/Tallinn', 'Europe/Tirane', 'Europe/Ulyanovsk', 'Europe/Uzhgorod', 'Europe/Vaduz',
    'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw',
    'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich',
    
    // Indian
    'Indian/Antananarivo', 'Indian/Chagos', 'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro',
    'Indian/Kerguelen', 'Indian/Mahe', 'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte',
    'Indian/Reunion', 'Indian/Seychelles',
    
    // Pacific
    'Pacific/Apia', 'Pacific/Auckland', 'Pacific/Bougainville', 'Pacific/Chatham', 'Pacific/Chuuk',
    'Pacific/Easter', 'Pacific/Efate', 'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti',
    'Pacific/Galapagos', 'Pacific/Gambier', 'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu',
    'Pacific/Kanton', 'Pacific/Kiritimati', 'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro',
    'Pacific/Marquesas', 'Pacific/Midway', 'Pacific/Nauru', 'Pacific/Niue', 'Pacific/Norfolk',
    'Pacific/Noumea', 'Pacific/Pago_Pago', 'Pacific/Palau', 'Pacific/Pitcairn', 'Pacific/Pohnpei',
    'Pacific/Port_Moresby', 'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Tahiti', 'Pacific/Tarawa',
    'Pacific/Tongatapu', 'Pacific/Wake', 'Pacific/Wallis'
  ];
}

// Get GMT offset label for a timezone
export function gmtOffsetLabel(tz, now = Date.now()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart) {
      // Convert "GMT+05:00" to "GMT+05:00" or "GMT-08:00" to "GMT-08:00"
      return offsetPart.value.replace('GMT', 'GMT');
    }
    
    // Fallback: calculate offset manually
    const utc = new Date(now);
    const local = new Date(utc.toLocaleString('en-US', { timeZone: tz }));
    const offset = (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
    
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = Math.round((absOffset - hours) * 60);
    
    return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn(`Error getting offset for ${tz}:`, error);
    return 'GMT+00:00';
  }
}

// Build zone options for dropdown
export function buildZoneOptions(now = Date.now()) {
  const zones = getAllIanaZones();
  const options = [];
  
  // Group zones by region
  const grouped = {};
  
  zones.forEach(zone => {
    const [region, city] = zone.split('/');
    if (!grouped[region]) {
      grouped[region] = [];
    }
    
    const offsetLabel = gmtOffsetLabel(zone, now);
    const cityName = city ? city.replace(/_/g, ' ') : zone;
    
    grouped[region].push({
      value: zone,
      label: `${cityName} (${offsetLabel})`,
      sublabel: zone,
      region: region
    });
  });
  
  // Sort regions and cities
  Object.keys(grouped).sort().forEach(region => {
    grouped[region].sort((a, b) => a.label.localeCompare(b.label));
    options.push(...grouped[region]);
  });
  
  return options;
}

// Legacy SUPPORTED_ZONES for backward compatibility
export const SUPPORTED_ZONES = [
  { value: 'Asia/Kolkata',   label: 'India (IST, UTC+05:30)' },
  { value: 'Asia/Karachi',   label: 'Pakistan (PKT, UTC+05:00)' },
  { value: 'Asia/Dhaka',     label: 'Bangladesh (BST, UTC+06:00)' },
  { value: 'Asia/Kathmandu', label: 'Nepal (NPT, UTC+05:45)' },
  { value: 'Europe/London',  label: 'UK (Europe/London)' },
  { value: 'America/New_York', label: 'US Eastern (America/New_York)' },
  { value: 'Asia/Singapore', label: 'Singapore (Asia/Singapore)' },
];

// Map common aliases/dirty inputs to IANA. Extend if needed.
const ALIAS_MAP = [
  [/^\s*(pakistan|pkt|utc\+?0?5(:?[:.]?0?0)?|gmt\+?0?5)\s*$/i, 'Asia/Karachi'],
  [/^\s*(india|ist \(?india\)?|utc\+?0?5[:.]?30|gmt\+?0?5[:.]?30)\s*$/i, 'Asia/Kolkata'],
  [/^\s*(bangladesh|bst \(?bd\)?|utc\+?0?6)\s*$/i, 'Asia/Dhaka'],
  [/^\s*(nepal|npt|utc\+?0?5[:.]?45)\s*$/i, 'Asia/Kathmandu'],
  [/^\s*(london|uk|bst|gmt|utc)\s*$/i, 'Europe/London'],
  [/^\s*(new\s*york|ny|est|edt|us eastern)\s*$/i, 'America/New_York'],
  [/^\s*(singapore|sgt|utc\+?0?8)\s*$/i, 'Asia/Singapore'],
];

export function normalizeZone(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (isValidIanaTZ(raw)) return raw;
  const hit = ALIAS_MAP.find(([re]) => re.test(raw));
  return hit ? hit[1] : null;
}

// Safe formatter: returns null if invalid
export function formatNowInSafe(userInput, opts = { hour:'2-digit', minute:'2-digit', second:'2-digit' }) {
  const tz = normalizeZone(userInput);
  if (!tz) return null;
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }).format(Date.now()); }
  catch { return null; }
}

// Weekend check in target zone
export function isWeekendInZone(tz, t = Date.now()) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(t);
  return wd === 'Sat' || wd === 'Sun';
}

// UTC epoch ms for "today at HH:MM in tz"
export function zonedTodayAtUTC(tz, hour, minute, base = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' })
    .formatToParts(base).reduce((o,p)=> (o[p.type]=p.value, o), {});
  const y = +parts.year, m = +parts.month, d = +parts.day;
  return Date.UTC(y, m - 1, d, hour, minute, 0, 0);
}

// Trading session detection based on UTC times
export const TRADING_SESSIONS = {
  Sydney: { start: 21, end: 6, name: 'Sydney' }, // 9PM to 6AM UTC
  Tokyo: { start: 0, end: 9, name: 'Tokyo' },   // 12AM to 9AM UTC
  London: { start: 7, end: 16, name: 'London' }, // 7AM to 4PM UTC
  'New York': { start: 12, end: 21, name: 'New York' } // 12PM to 9PM UTC
};

/**
 * Get active trading sessions based on current UTC time
 * @returns {Array} Array of active session names
 */
export function getActiveTradingSessions() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const activeSessions = [];
  
  Object.entries(TRADING_SESSIONS).forEach(([key, session]) => {
    const { start, end, name } = session;
    
    // Handle sessions that cross midnight (like Sydney: 21-6)
    if (start > end) {
      // Session crosses midnight
      if (utcHour >= start || utcHour < end) {
        activeSessions.push(name);
      }
    } else {
      // Normal session within same day
      if (utcHour >= start && utcHour < end) {
        activeSessions.push(name);
      }
    }
  });
  
  return activeSessions;
}

/**
 * Get trading session info for a specific timezone
 * @param {string} timezone - IANA timezone identifier
 * @returns {Object} Session info with active sessions and local time
 */
export function getTradingSessionInfo(timezone) {
  if (!isValidIanaTZ(timezone)) {
    return { activeSessions: [], localTime: null, error: 'Invalid timezone' };
  }
  
  const activeSessions = getActiveTradingSessions();
  const localTime = formatNowInSafe(timezone);
  
  return {
    activeSessions,
    localTime,
    timezone,
    utcTime: new Date().toISOString()
  };
}

// Export functions for global access
if (typeof window !== 'undefined') {
  window.TimezoneUtils = {
    isValidIanaTZ,
    SUPPORTED_ZONES,
    ALIAS_MAP,
    normalizeZone,
    formatNowInSafe,
    isWeekendInZone,
    zonedTodayAtUTC,
    getAllIanaZones,
    gmtOffsetLabel,
    buildZoneOptions,
    getActiveTradingSessions,
    getTradingSessionInfo,
    TRADING_SESSIONS
  };
}