import {
  LayoutDashboard,
  ClipboardList,
  ToggleLeft,
  Users,
  FolderOpen,
  Bell,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Overview of your privacy rights',
  },
  {
    label: 'My Requests',
    path: '/dsar',
    icon: ClipboardList,
    description: 'Data access, correction & deletion requests',
  },
  {
    label: 'My Consents',
    path: '/consents',
    icon: ToggleLeft,
    description: 'Manage what data you share and why',
  },
  {
    label: 'My Nominees',
    path: '/nominees',
    icon: Users,
    description: 'People who can act on your behalf',
  },
  {
    label: 'My Data',
    path: '/evidence',
    icon: FolderOpen,
    description: 'Download and view your personal data',
  },
  {
    label: 'Preferences',
    path: '/preferences',
    icon: Bell,
    description: 'Notification and communication settings',
  },
];
