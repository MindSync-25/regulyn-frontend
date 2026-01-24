# Consent Widget Integration Guide

Complete guide for integrating Regulyn Consent Widget into your website.

## Quick Start

### CDN Installation

Add to your HTML `<head>`:

```html
<script src="https://cdn.regulyn.io/consent-widget/v1/regulyn-consent.js"></script>
<link rel="stylesheet" href="https://cdn.regulyn.io/consent-widget/v1/regulyn-consent.css">
```

### Basic Initialization

```html
<script>
  ReguLyn.ConsentWidget.init({
    apiKey: 'your-api-key',
    tenantId: 'your-tenant-id'
  });
</script>
```

## Configuration

### Full Configuration Options

```javascript
ReguLyn.ConsentWidget.init({
  // Required
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id',
  
  // Optional
  language: 'en', // en, hi, ta, te, etc.
  position: 'bottom-right', // bottom-left, bottom-right, top-left, top-right
  theme: 'light', // light, dark, auto
  
  // Customization
  customStyles: {
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333'
  },
  
  // Behavior
  autoShow: true,
  showOnce: false,
  cookieExpiry: 365, // days
  
  // Callbacks
  onConsent: (consent) => {
    console.log('Consent granted:', consent);
  },
  onReject: () => {
    console.log('Consent rejected');
  },
  onChange: (preferences) => {
    console.log('Preferences changed:', preferences);
  }
});
```

## API Methods

### Show Widget

```javascript
ReguLyn.ConsentWidget.show();
```

### Hide Widget

```javascript
ReguLyn.ConsentWidget.hide();
```

### Get Consent Status

```javascript
const status = ReguLyn.ConsentWidget.getConsent();
console.log(status);
// {
//   necessary: true,
//   analytics: false,
//   marketing: false,
//   timestamp: '2026-01-24T10:00:00Z'
// }
```

### Update Consent

```javascript
ReguLyn.ConsentWidget.updateConsent({
  necessary: true,
  analytics: true,
  marketing: false
});
```

### Reset Consent

```javascript
ReguLyn.ConsentWidget.reset();
```

## Consent Categories

### Necessary
Always enabled. Essential for website functionality.

### Analytics
Usage analytics and performance monitoring.

### Marketing
Marketing and advertising cookies.

### Preferences
User preferences and personalization.

## Integration Examples

### React

```typescript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    if (window.ReguLyn) {
      window.ReguLyn.ConsentWidget.init({
        apiKey: process.env.REACT_APP_REGULYN_API_KEY,
        tenantId: process.env.REACT_APP_REGULYN_TENANT_ID,
        onConsent: (consent) => {
          // Initialize analytics only if consented
          if (consent.analytics) {
            initializeAnalytics();
          }
        }
      });
    }
  }, []);

  return <YourApp />;
}
```

### Vue

```javascript
export default {
  mounted() {
    if (window.ReguLyn) {
      window.ReguLyn.ConsentWidget.init({
        apiKey: process.env.VUE_APP_REGULYN_API_KEY,
        tenantId: process.env.VUE_APP_REGULYN_TENANT_ID
      });
    }
  }
}
```

### WordPress

Add to theme's `header.php` or use a plugin:

```php
<script>
  window.regulynConfig = {
    apiKey: '<?php echo get_option('regulyn_api_key'); ?>',
    tenantId: '<?php echo get_option('regulyn_tenant_id'); ?>'
  };
</script>
<script src="https://cdn.regulyn.io/consent-widget/v1/regulyn-consent.js"></script>
<script>
  ReguLyn.ConsentWidget.init(window.regulynConfig);
</script>
```

## Conditional Script Loading

Load scripts only after consent:

```javascript
ReguLyn.ConsentWidget.init({
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id',
  onConsent: (consent) => {
    // Load analytics only if consented
    if (consent.analytics) {
      loadScript('https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID');
    }
    
    // Load marketing scripts only if consented
    if (consent.marketing) {
      loadScript('https://connect.facebook.net/en_US/fbevents.js');
    }
  }
});

function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}
```

## Styling

### Custom Themes

```javascript
ReguLyn.ConsentWidget.init({
  apiKey: 'your-api-key',
  tenantId: 'your-tenant-id',
  customStyles: {
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    buttonPadding: '12px 24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
});
```

### CSS Overrides

```css
/* Override default styles */
.regulyn-consent-banner {
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

.regulyn-consent-button {
  font-weight: 600 !important;
}
```

## Testing

### Test Mode

Enable test mode during development:

```javascript
ReguLyn.ConsentWidget.init({
  apiKey: 'test-api-key',
  tenantId: 'test-tenant-id',
  testMode: true // Shows widget on every page load
});
```

## Performance

- **Bundle Size**: ~14KB gzipped
- **Load Time**: <100ms
- **Async Loading**: Non-blocking
- **CDN**: Global edge network

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## GDPR Compliance

The widget helps you comply with:
- GDPR (EU)
- DPDP Act (India)
- CCPA (California)
- Other privacy regulations

## Support

- Documentation: https://docs.regulyn.io
- Email: support@regulyn.io
- GitHub Issues: https://github.com/regulyn/consent-widget/issues

## Troubleshooting

### Widget Not Showing

1. Check API key and tenant ID
2. Verify CDN script is loaded
3. Check browser console for errors
4. Ensure no ad blockers are interfering

### Consent Not Persisting

1. Check cookie settings
2. Verify domain configuration
3. Check localStorage permissions

## Changelog

See [CHANGELOG.md](https://cdn.regulyn.io/consent-widget/CHANGELOG.md) for version history.
