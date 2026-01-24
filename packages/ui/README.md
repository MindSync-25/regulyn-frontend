# @regulyn/ui

Shared UI component library for all Regulyn applications.

## Purpose
- Reusable React components
- Consistent design system
- Accessible components (WCAG 2.1 AA)
- Theme support
- Component documentation

## Tech Stack
- React 18
- TypeScript
- TailwindCSS
- Radix UI primitives
- Shadcn UI patterns
- Storybook (documentation)

## Components

### Layout
- `Layout` - Main application layout
- `Header` - Application header
- `Sidebar` - Navigation sidebar
- `Footer` - Application footer
- `Container` - Content container

### Forms
- `Input` - Text input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `Radio` - Radio button
- `Switch` - Toggle switch
- `Textarea` - Multi-line text input
- `DatePicker` - Date selection
- `Form` - Form wrapper with validation

### Data Display
- `Table` - Data table with sorting, filtering
- `Card` - Content card
- `Badge` - Status badge
- `Tooltip` - Contextual tooltip
- `Avatar` - User avatar
- `Tag` - Tag/label

### Feedback
- `Alert` - Alert messages
- `Toast` - Toast notifications
- `Modal` - Modal dialog
- `ConfirmDialog` - Confirmation dialog
- `Progress` - Progress indicator
- `Spinner` - Loading spinner

### Navigation
- `Tabs` - Tab navigation
- `Breadcrumb` - Breadcrumb trail
- `Pagination` - Page navigation
- `Menu` - Dropdown menu

### DPDP Specific
- `ConsentCard` - Consent display card
- `DSARStatus` - DSAR request status
- `DataInventoryTable` - Data inventory table
- `ComplianceScore` - Compliance score display

## Usage

```typescript
import { Button, Card, Table } from '@regulyn/ui';

function MyComponent() {
  return (
    <Card>
      <Table data={data} columns={columns} />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

## Development

```bash
npm install
npm run dev
npm run storybook
```

## Build

```bash
npm run build
```

## Storybook

```bash
npm run storybook
```

View at: `http://localhost:6006`
