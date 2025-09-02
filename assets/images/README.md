# Custom Icons Guide

## How to Add Custom Icons/Avatars to Your Trading Journal

### Method 1: Upload Custom Avatar (Now Available!)
1. Click on your avatar in the top-right corner
2. Select "Change Avatar" from the dropdown
3. Choose an image file (PNG, JPG, GIF, etc.)
4. The image will be stored locally and persist across sessions

### Method 2: Using Local Image Files
Place your image files in the `assets/images/` folder and reference them:

```css
.user-avatar {
  background-image: url('./assets/images/your-avatar.png');
}
```

### Method 3: Using Base64 Data URIs
Convert your image to base64 and use it directly:

```css
.user-avatar {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
}
```

### Method 4: Using Online Images
Reference images from the web (requires internet):

```css
.user-avatar {
  background-image: url('https://example.com/avatar.png');
}
```

### Method 5: SVG Icons
Use SVG for scalable icons:

```html
<div class="user-avatar">
  <svg viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
</div>
```

## Supported Image Formats
- PNG (recommended for transparency)
- JPG/JPEG
- GIF
- SVG
- WebP

## Size Recommendations
- Maximum file size: 2MB
- Recommended dimensions: 64x64px or higher
- Square aspect ratio works best for circular avatars

## Tools for Image Conversion
- **Base64**: Use online converters like base64-image.de
- **Image Optimization**: Use tools like TinyPNG or ImageOptim
- **SVG Creation**: Use tools like Figma, Adobe Illustrator, or online SVG editors
