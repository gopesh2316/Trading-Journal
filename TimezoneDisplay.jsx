/**
 * React Component for Robust Timezone Display
 * Fixes UTC/GMT sign bugs by using IANA timezones and Intl.DateTimeFormat only
 */

import React, { useState, useEffect } from 'react';
import { createTimezoneUtils, MARKETS } from './timezone-utilities.js';

// Common IANA timezones for the select dropdown
const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' }
];

const TimezoneDisplay = ({ handlerType = 'vanilla', className = '' }) => {
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [timeInfo, setTimeInfo] = useState({ time: '', date: '', weekday: '' });
  const [marketStatuses, setMarketStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize timezone handler
  const timezoneHandler = createTimezoneUtils(handlerType);

  // Update time and market statuses
  const updateTimeAndMarkets = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update current time
      const currentTimeInfo = timezoneHandler.getDetailedTimeInfo(selectedTimezone);
      setTimeInfo(currentTimeInfo);

      // Update market statuses
      const markets = ['NSE', 'NYSE', 'LSE'];
      const statuses = {};
      
      markets.forEach(marketKey => {
        try {
          const status = timezoneHandler.isMarketOpen(marketKey);
          statuses[marketKey] = status;
        } catch (error) {
          console.error(`Error checking ${marketKey}:`, error);
          statuses[marketKey] = {
            open: false,
            nextChangeISO: new Date().toISOString()
          };
        }
      });
      
      setMarketStatuses(statuses);
    } catch (error) {
      console.error('Error updating time and markets:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update every second
  useEffect(() => {
    updateTimeAndMarkets();
    const interval = setInterval(updateTimeAndMarkets, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  // Handle timezone change
  const handleTimezoneChange = (event) => {
    setSelectedTimezone(event.target.value);
  };

  // Format next change time for display
  const formatNextChange = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  // Get market display name
  const getMarketDisplayName = (marketKey) => {
    const market = MARKETS[marketKey];
    return market ? market.name || marketKey : marketKey;
  };

  // Get market timezone
  const getMarketTimezone = (marketKey) => {
    const market = MARKETS[marketKey];
    return market ? market.zone : 'Unknown';
  };

  if (error) {
    return (
      <div className={`timezone-display error ${className}`}>
        <div className="error-message">
          <h3>Error Loading Timezone Data</h3>
          <p>{error}</p>
          <button onClick={updateTimeAndMarkets}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`timezone-display ${className}`}>
      <div className="timezone-selector">
        <label htmlFor="timezone-select">
          <strong>Select Timezone:</strong>
        </label>
        <select
          id="timezone-select"
          value={selectedTimezone}
          onChange={handleTimezoneChange}
          disabled={isLoading}
        >
          {COMMON_TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="current-time">
        <h2>Current Time</h2>
        <div className="time-display">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="time-info">
              <div className="weekday">{timeInfo.weekday}</div>
              <div className="date">{timeInfo.date}</div>
              <div className="time">{timeInfo.time}</div>
            </div>
          )}
        </div>
      </div>

      <div className="market-status">
        <h2>Market Status</h2>
        <div className="markets-table">
          <table>
            <thead>
              <tr>
                <th>Market</th>
                <th>Status</th>
                <th>Next Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(marketStatuses).map(([marketKey, status]) => (
                <tr key={marketKey}>
                  <td>
                    <div className="market-info">
                      <strong>{marketKey}</strong>
                      <small>{getMarketTimezone(marketKey)}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${status.open ? 'open' : 'closed'}`}>
                      {status.open ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </td>
                  <td className="next-change">
                    {formatNextChange(status.nextChangeISO)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="handler-info">
        <small>
          Using {handlerType === 'luxon' ? 'Luxon' : 'Vanilla Intl.DateTimeFormat'} implementation
        </small>
      </div>
    </div>
  );
};

export default TimezoneDisplay;