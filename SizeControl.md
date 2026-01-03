# SizeControl Documentation

## Overview
SizeControl is a React component that allows you to easily control the overall size of your app using a simple number parameter.

## How to Use

### Basic Usage
```tsx
import { SizeControl, APP_SIZES } from './SizeControl';

// Wrap your app with SizeControl
<SizeControl size={15}>
  <YourApp />
</SizeControl>
```

### Size Values
- **10** - Very small app (tiny)
- **12** - Small app
- **15** - Normal size (default)
- **18** - Medium-large
- **20** - Large app
- **25** - Extra large app
- **30** - Maximum size

### Using Presets
```tsx
import { APP_SIZES } from './SizeControl';

// Tiny app
<SizeControl size={APP_SIZES.TINY}>
  <App />
</SizeControl>

// Normal app
<SizeControl size={APP_SIZES.NORMAL}>
  <App />
</SizeControl>

// Large app
<SizeControl size={APP_SIZES.LARGE}>
  <App />
</SizeControl>
```

## How It Works

The SizeControl component calculates all dimensions based on the `size` parameter:

1. **Scale Calculation**: `scale = size / 15` (15 is the normal size)
2. **Width Scaling**: 
   - Medium screens: `640px * scale`
   - Large screens: `800px * scale`
3. **Other Elements**: Margins, border radius, and shadows also scale proportionally

## Examples

### Very Small App (size: 10)
```tsx
<SizeControl size={10}>
  <App />
</SizeControl>
```
- Medium width: ~427px
- Large width: ~533px

### Normal App (size: 15)
```tsx
<SizeControl size={15}>
  <App />
</SizeControl>
```
- Medium width: 640px
- Large width: 800px

### Large App (size: 20)
```tsx
<SizeControl size={20}>
  <App />
</SizeControl>
```
- Medium width: ~853px
- Large width: ~1067px

## Integration with Existing App

To integrate with your existing App.tsx:

1. **Import SizeControl**:
```tsx
import { SizeControl, APP_SIZES } from './SizeControl';
```

2. **Wrap your app**:
```tsx
// In your main render function
<SizeControl size={APP_SIZES.NORMAL}>
  {/* Your existing app content */}
</SizeControl>
```

3. **Or make it configurable**:
```tsx
// Add size state
const [appSize, setAppSize] = useState(APP_SIZES.NORMAL);

// Use it
<SizeControl size={appSize}>
  <App />
</SizeControl>
```

## Benefits

- **Easy Size Control**: One number changes everything
- **Responsive**: Works on all screen sizes
- **Proportional**: All elements scale correctly
- **Presets**: Ready-made sizes for common use cases
- **Customizable**: Use any size value between 10-30