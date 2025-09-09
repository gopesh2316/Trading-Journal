# Robust Timezone Handler for Trading Applications

A production-ready timezone handling library for trading applications that supports both Vanilla JavaScript (Intl.DateTimeFormat) and Luxon implementations. Handles market hours, DST transitions, and weekend calculations correctly.

## Features

- ✅ **IANA Timezone Support** - Uses proper timezone identifiers (e.g., "America/New_York", "Asia/Kolkata")
- ✅ **Market Hours Calculation** - Accurate open/close times for major markets (NYSE, LSE, NSE)
- ✅ **DST Handling** - Automatic daylight saving time transitions
- ✅ **Weekend Detection** - Proper weekend calculation in market timezones
- ✅ **Dual Implementation** - Both Vanilla JS and Luxon versions
- ✅ **React Component** - Ready-to-use React component
- ✅ **Production Ready** - Clean, commented, and well-tested code

## Quick Start

### 1. Include the Library

```html
<!-- For Vanilla JS -->
<script src="timezone-handler.js"></script>

<!-- For Luxon (optional) -->
<script src="https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js"></script>
```

### 2. Basic Usage

```javascript
// Create handler instance
const handler = createTimezoneHandler('vanilla'); // or 'luxon'

// Get current time in a timezone
const currentTime = handler.getZonedNow('America/New_York');

// Check if it's weekend
const isWeekend = handler.isWeekend(currentTime);

// Check market status
const marketStatus = handler.isMarketOpen({
  marketKey: 'NYSE',
  userTimeZone: 'America/New_York'
});

console.log(marketStatus);
// { open: true, nextChangeISO: '2024-01-15T21:00:00.000Z' }
```

### 3. React Component

```jsx
import TimezoneDisplay from './TimezoneDisplay.jsx';
import './timezone-display.css';

function App() {
  return (
    <div>
      <h1>Trading Dashboard</h1>
      <TimezoneDisplay handlerType="vanilla" />
    </div>
  );
}
```

## API Reference

### Core Functions

#### `getZonedNow(timeZone)`
Get current time in specified timezone.

**Parameters:**
- `timeZone` (string): IANA timezone identifier

**Returns:**
- `Date`: Date object representing current time in timezone

**Example:**
```javascript
const nyTime = handler.getZonedNow('America/New_York');
console.log(nyTime); // 2024-01-15T14:30:00.000Z
```

#### `isWeekend(zonedDate)`
Check if a date falls on weekend.

**Parameters:**
- `zonedDate` (Date): Date in the target timezone

**Returns:**
- `boolean`: True if weekend

**Example:**
```javascript
const isWeekend = handler.isWeekend(new Date());
console.log(isWeekend); // false (if it's a weekday)
```

#### `isMarketOpen({ marketKey, now, userTimeZone })`
Check if market is open and get next change time.

**Parameters:**
- `marketKey` (string): Market identifier ('NYSE', 'LSE', 'NSE')
- `now` (Date, optional): Current time (defaults to new Date())
- `userTimeZone` (string): User's timezone

**Returns:**
- `Object`: `{ open: boolean, nextChangeISO: string }`

**Example:**
```javascript
const status = handler.isMarketOpen({
  marketKey: 'NYSE',
  userTimeZone: 'America/New_York'
});
console.log(status);
// { open: true, nextChangeISO: '2024-01-15T21:00:00.000Z' }
```

### Supported Markets

| Market | Code | Timezone | Hours | Days |
|--------|------|----------|-------|------|
| New York Stock Exchange | NYSE | America/New_York | 09:30-16:00 | Mon-Fri |
| London Stock Exchange | LSE | Europe/London | 08:00-16:30 | Mon-Fri |
| National Stock Exchange of India | NSE | Asia/Kolkata | 09:15-15:30 | Mon-Fri |

## Implementation Details

### Vanilla Implementation
- Uses `Intl.DateTimeFormat` for timezone conversion
- No external dependencies
- Smaller bundle size
- Good browser support

### Luxon Implementation
- Uses Luxon library for advanced date/time operations
- More features and better API
- Requires Luxon dependency
- Better handling of edge cases

## Installation

### NPM
```bash
npm install robust-timezone-handler
```

### CDN
```html
<script src="https://cdn.jsdelivr.net/npm/robust-timezone-handler@1.0.0/timezone-handler.js"></script>
```

### Manual
Download the files and include them in your project:
- `timezone-handler.js` - Core library
- `TimezoneDisplay.jsx` - React component
- `timezone-display.css` - Styles

## Examples

### Basic Time Display
```javascript
const handler = createTimezoneHandler('vanilla');

// Display current time in different timezones
const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

timezones.forEach(tz => {
  const time = handler.getFormattedTime(tz);
  console.log(`${tz}: ${time}`);
});
```

### Market Status Dashboard
```javascript
const handler = createTimezoneHandler('vanilla');
const markets = ['NYSE', 'LSE', 'NSE'];

markets.forEach(market => {
  const status = handler.isMarketOpen({
    marketKey: market,
    userTimeZone: 'America/New_York'
  });
  
  console.log(`${market}: ${status.open ? 'Open' : 'Closed'}`);
  console.log(`Next change: ${new Date(status.nextChangeISO).toLocaleString()}`);
});
```

### React Integration
```jsx
import React, { useState, useEffect } from 'react';
import { createTimezoneHandler } from './timezone-handler.js';

function TradingClock({ timezone }) {
  const [time, setTime] = useState('');
  const handler = createTimezoneHandler('vanilla');

  useEffect(() => {
    const updateTime = () => {
      const currentTime = handler.getFormattedTime(timezone);
      setTime(currentTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="trading-clock">
      <h2>{timezone}</h2>
      <div className="time">{time}</div>
    </div>
  );
}
```

## Browser Support

### Vanilla Implementation
- Chrome 24+
- Firefox 29+
- Safari 10+
- Edge 12+

### Luxon Implementation
- Chrome 24+
- Firefox 29+
- Safari 10+
- Edge 12+
- Requires Luxon library

## Testing

Run the test suite:

```bash
npm test
```

Or open `timezone-example.html` in your browser to see the interactive demo.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Vanilla and Luxon implementations
- React component
- Market hours support
- DST handling
- Weekend detection

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/robust-timezone-handler/issues)
- Documentation: [View docs](https://github.com/your-org/robust-timezone-handler#readme)

## Roadmap

- [ ] Additional markets (ASX, TSE, etc.)
- [ ] Holiday calendar support
- [ ] Pre-market and after-hours trading
- [ ] Timezone conversion utilities
- [ ] Performance optimizations
