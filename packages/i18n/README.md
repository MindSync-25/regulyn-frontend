# @regulyn/i18n

Internationalization support for Regulyn applications.

## Purpose
- Multi-language support
- Translation management
- Locale formatting
- Date/time localization
- Number/currency formatting
- RTL support

## Tech Stack
- TypeScript
- i18next
- react-i18next
- date-fns

## Supported Languages

- **English (en)** - Default
- **Hindi (hi)** - India
- **Tamil (ta)** - India
- **Telugu (te)** - India
- **Bengali (bn)** - India
- **Marathi (mr)** - India
- **Gujarati (gu)** - India
- **Kannada (kn)** - India
- **Malayalam (ml)** - India
- **Punjabi (pa)** - India

## Usage

### Provider Setup

```typescript
import { I18nProvider } from '@regulyn/i18n';

function App() {
  return (
    <I18nProvider defaultLanguage="en">
      <YourApp />
    </I18nProvider>
  );
}
```

### useTranslation Hook

```typescript
import { useTranslation } from '@regulyn/i18n';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('hi')}>
        हिन्दी
      </button>
    </div>
  );
}
```

### Translation with Variables

```typescript
const { t } = useTranslation();

// Translation: "Welcome, {{name}}!"
t('common.greeting', { name: 'Rajan' });
```

### Pluralization

```typescript
// Translation: "You have {{count}} message" / "You have {{count}} messages"
t('messages.count', { count: 5 });
```

### Date Formatting

```typescript
import { formatDate } from '@regulyn/i18n';

formatDate(new Date(), 'en'); // "January 24, 2026"
formatDate(new Date(), 'hi'); // "24 जनवरी 2026"
```

### Number Formatting

```typescript
import { formatNumber, formatCurrency } from '@regulyn/i18n';

formatNumber(1234567.89, 'en'); // "1,234,567.89"
formatNumber(1234567.89, 'hi'); // "12,34,567.89" (Indian numbering)

formatCurrency(1000, 'en', 'INR'); // "₹1,000.00"
```

## Translation Files Structure

```
src/
  locales/
    en/
      common.json
      consent.json
      dsar.json
      admin.json
    hi/
      common.json
      consent.json
      dsar.json
      admin.json
```

## Adding Translations

1. Add key to translation files
2. Use `t('namespace.key')` in components
3. Run type generation: `npm run generate-types`

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
