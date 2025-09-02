// SVG Navigation Icons for Trading Journal
// Use this to replace FontAwesome icons with custom SVG icons

const SVG_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>`,
  
  tradeLog: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
  </svg>`,
  
  preTrade: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`,
  
  trendingUp: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>`,
  
  trendingDown: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
  </svg>`,
  
  settings: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>`,
  
  logout: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>`
};

// Function to replace FontAwesome icons with SVG
function replaceFontAwesomeWithSVG() {
  // Navigation icons
  const dashboardIcon = document.querySelector('[data-view="dashboard"] .nav-icon');
  if (dashboardIcon) dashboardIcon.innerHTML = SVG_ICONS.dashboard;
  
  const tradeLogIcon = document.querySelector('[data-view="trade-log"] .nav-icon');
  if (tradeLogIcon) tradeLogIcon.innerHTML = SVG_ICONS.tradeLog;
  
  const preTradeIcon = document.querySelector('[data-view="pre-trade"] .nav-icon');
  if (preTradeIcon) preTradeIcon.innerHTML = SVG_ICONS.preTrade;
  
  // Dropdown icons
  const settingsIcon = document.querySelector('#btnSettings i');
  if (settingsIcon) settingsIcon.outerHTML = SVG_ICONS.settings;
  
  const logoutIcon = document.querySelector('#btnLogout i');
  if (logoutIcon) logoutIcon.outerHTML = SVG_ICONS.logout;
}

// Usage Examples:

// 1. Replace all FontAwesome icons with SVG on page load
// window.addEventListener('DOMContentLoaded', replaceFontAwesomeWithSVG);

// 2. Use individual SVG icons in CSS
/*
.nav-icon.svg {
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>');
  background-size: 16px;
  background-repeat: no-repeat;
  background-position: center;
}
*/

// 3. Use SVG icons directly in HTML
/*
<span class="nav-icon">
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
</span>
*/
