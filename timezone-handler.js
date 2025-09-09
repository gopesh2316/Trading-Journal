// timezone-handler.js
import { isWeekendInZone, zonedTodayAtUTC } from './timezone-utilities.js';

export const MARKETS = {
  NSE:  { zone: 'Asia/Kolkata',     open: [9,15],  close: [15,30] },
  NYSE: { zone: 'America/New_York', open: [9,30],  close: [16,0]  },
  LSE:  { zone: 'Europe/London',    open: [8,0],   close: [16,30] },
};

export function isMarketOpen(marketKey, now = Date.now()) {
  const m = MARKETS[marketKey];
  if (!m) throw new Error('Unknown market: ' + marketKey);

  if (isWeekendInZone(m.zone, now)) return nextWeekdayOpen(m, now);

  const openUTC  = zonedTodayAtUTC(m.zone, ...m.open, now);
  const closeUTC = zonedTodayAtUTC(m.zone, ...m.close, now);

  if (now < openUTC)   return { open:false, nextChangeISO: new Date(openUTC).toISOString() };
  if (now <= closeUTC) return { open:true,  nextChangeISO: new Date(closeUTC).toISOString() };
  return nextWeekdayOpen(m, now);
}

function nextWeekdayOpen(m, now) {
  let t = now + 24*3600e3;
  while (isWeekendInZone(m.zone, t)) t += 24*3600e3;
  const nextOpenUTC = zonedTodayAtUTC(m.zone, ...m.open, t);
  return { open:false, nextChangeISO: new Date(nextOpenUTC).toISOString() };
}