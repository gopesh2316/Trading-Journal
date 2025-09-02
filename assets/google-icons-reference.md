# Google Material Icons Reference

This document lists all the Google Material Icons used in the Trading Journal application.

## 🎯 Navigation Icons
- **Dashboard**: `dashboard` - Main overview page
- **Trade Log**: `table_rows` - Trading history table
- **Pre-Trade**: `gps_fixed` - Pre-trade analysis

## 👤 Avatar & Account Icons
- **Person**: `person` - Default user avatar
- **Bull Trader**: `trending_up` - Bullish market avatar
- **Bear Trader**: `trending_down` - Bearish market avatar
- **Diamond Hands**: `diamond` - Long-term holder avatar
- **Star Trader**: `star` - Top performer avatar
- **Money**: `attach_money` - Financial focus avatar

## ⚙️ Action Icons
- **Change Avatar**: `photo_camera` - Upload/change profile picture
- **SVG Avatars**: `auto_awesome` - Choose from preset avatars
- **Use Initials**: `account_circle` - Return to text-based avatar
- **Logout**: `logout` - Sign out of application

## 📅 Calendar Icons
- **Previous**: `chevron_left` - Navigate to previous month/period
- **Next**: `chevron_right` - Navigate to next month/period

## 📱 How to Use Google Material Icons

### Basic Usage
```html
<span class="material-icons">icon_name</span>
```

### With Custom Styling
```html
<span class="material-icons" style="font-size: 24px; color: #3b82f6;">dashboard</span>
```

### In CSS
```css
.my-icon {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
}
.my-icon::after {
  content: 'dashboard';
}
```

## 🎨 Icon Categories Available

### Trading & Finance
- `trending_up` - Upward trend
- `trending_down` - Downward trend
- `trending_flat` - Sideways movement
- `attach_money` - Dollar/money symbol
- `account_balance` - Bank/institution
- `analytics` - Chart analysis
- `assessment` - Performance metrics
- `bar_chart` - Bar charts
- `pie_chart` - Pie charts
- `timeline` - Time-based data

### User & Account
- `person` - Single user
- `people` - Multiple users
- `account_circle` - User profile
- `manage_accounts` - Account management
- `admin_panel_settings` - Admin settings
- `security` - Security features

### Navigation & Interface
- `dashboard` - Dashboard/overview
- `table_rows` - Data tables
- `list` - List view
- `grid_view` - Grid layout
- `menu` - Navigation menu
- `more_vert` - More options (vertical)
- `more_horiz` - More options (horizontal)
- `settings` - Settings/configuration
- `help` - Help/support

### Actions & Controls
- `add` - Add new item
- `edit` - Edit existing
- `delete` - Remove item
- `save` - Save changes
- `cancel` - Cancel action
- `refresh` - Reload/refresh
- `search` - Search function
- `filter_list` - Filter options
- `sort` - Sort data

### Status & Feedback
- `check_circle` - Success/complete
- `error` - Error state
- `warning` - Warning state
- `info` - Information
- `star` - Favorite/rating
- `bookmark` - Saved/bookmarked

## 🔗 Resources

- **Official Icon Library**: https://fonts.google.com/icons
- **Material Design Guidelines**: https://material.io/design/iconography
- **Icon Search**: Search for specific icons by name or category
- **Custom Styling**: All icons can be styled with CSS (color, size, etc.)

## 💡 Best Practices

1. **Consistency**: Use the same icon style throughout the app
2. **Size**: Keep icons consistent in size within the same context
3. **Color**: Use appropriate colors that match your design system
4. **Accessibility**: Ensure icons are accessible with proper labels
5. **Performance**: Material Icons are lightweight and load quickly
6. **Semantic**: Choose icons that clearly represent their function

## 🚀 Quick Implementation

To add a new icon:
1. Find the icon name at https://fonts.google.com/icons
2. Use: `<span class="material-icons">icon_name</span>`
3. Style with CSS as needed

Example:
```html
<!-- Trading chart icon -->
<span class="material-icons">show_chart</span>

<!-- Styled trading chart icon -->
<span class="material-icons" style="color: #10b981; font-size: 20px;">show_chart</span>
```
