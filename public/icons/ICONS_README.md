# PWA Icons Generation

## Required Sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Generate:

### Option 1: Using Online Tool
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 PNG logo
3. Download all sizes

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run:

convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Using Node.js Script
```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('logo.png')
    .resize(size, size)
    .toFile(`icon-${size}x${size}.png`);
});
```

## Temporary Placeholder
برای حالا، می‌توانید از لوگوی ساده Next.js استفاده کنید یا یک آیکون موقت با متن "ه" (هوشاگر) بسازید.

## Design Guidelines:
- Use solid background color
- Simple, recognizable icon
- Good contrast
- Works at small sizes (72x72)
- Avoid text (except for badge)
- PNG format with transparency (optional)
- Follow maskable icon guidelines for Android

