# Consent Widget

Lightweight embeddable consent management widget for third-party websites.

## Purpose
- Embeddable JavaScript widget for consent collection
- Cookie consent banner
- Privacy notice display
- Consent preference management
- CDN-optimized bundle
- Framework-agnostic

## Tech Stack
- Vanilla TypeScript
- Rollup (bundler)
- PostCSS
- Web Components
- Zero dependencies in production bundle

## Features
- **Cookie Banner**: Customizable consent banner
- **Preference Center**: Modal for granular consent choices
- **Analytics Integration**: Track consent events
- **Multi-language Support**: i18n ready
- **Theming**: Customizable styles
- **Mobile Responsive**: Works on all devices
- **Performance**: <15KB gzipped

## Bundle Types
- **Full Bundle**: `regulyn-consent.js` (~14KB gzipped)
- **Core Bundle**: `regulyn-consent.core.js` (~8KB gzipped)
- **CSS**: `regulyn-consent.css` (~2KB gzipped)

## Integration

```html
<!-- Add to website -->
<script src="https://cdn.regulyn.io/consent-widget/v1/regulyn-consent.js"></script>
<script>
  ReguLyn.ConsentWidget.init({
    apiKey: 'your-api-key',
    tenantId: 'your-tenant-id',
    language: 'en',
    position: 'bottom-right'
  });
</script>
```

## Configuration Options

```typescript
interface ConsentWidgetConfig {
  apiKey: string;
  tenantId: string;
  language?: 'en' | 'hi' | string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme?: 'light' | 'dark' | 'auto';
  customStyles?: object;
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Testing

```bash
npm run test
```

## CDN Deployment
Built bundle is optimized for CDN distribution.
