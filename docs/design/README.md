# Design System Documentation

Design system and UI guidelines for Regulyn platform.

## Overview

Consistent design language across all Regulyn applications.

## Structure

### Colors
- **Primary**: Brand colors
- **Secondary**: Supporting colors
- **Neutral**: Grays and backgrounds
- **Semantic**: Success, error, warning, info
- **DPDP Specific**: Consent states, compliance status

### Typography
- **Font Family**: Inter (primary), System fonts (fallback)
- **Scale**: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px, 60px
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Scale**: 4px base (0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem)
- **Grid**: 8px baseline grid

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Wide**: 1440px+

### Components

See Storybook for interactive component documentation:
```bash
pnpm --filter @regulyn/ui storybook
```

### Accessibility

- **Color Contrast**: WCAG AA minimum (4.5:1 for text)
- **Focus States**: Visible keyboard focus
- **ARIA**: Proper ARIA labels and roles
- **Screen Readers**: Descriptive labels

### Design Tokens

Design tokens are defined in `packages/ui/src/tokens/`:
- `colors.ts`
- `typography.ts`
- `spacing.ts`
- `shadows.ts`
- `borders.ts`

## Figma

Design files: [Link to Figma workspace]

## Usage

Import tokens in your app:
```typescript
import { tokens } from '@regulyn/ui';

const primaryColor = tokens.colors.primary[600];
const spacing = tokens.spacing[4];
```

## Contributing

Follow design system guidelines when creating new components.
