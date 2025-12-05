import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  FolderOpen,
  AlertTriangle,
  Users,
  Settings,
  HelpCircle,
  Shield,
  Search,
  MapPin,
  Activity,
  Database,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  icon: any;
  href: string;
  badge?: string;
  roles?: string[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    title: 'Case Management',
    icon: FolderOpen,
    href: '/cases',
    roles: ['admin', 'case_manager'],
  },
  {
    title: 'Alert Dashboard',
    icon: AlertTriangle,
    href: '/alerts',
    badge: '3',
  },
  {
    title: 'Missing Persons',
    icon: Search,
    href: '/missing-persons',
    roles: ['citizen', 'investigator'], // Only for citizens and investigators (not admin - they have Case Management)
  },
  {
    title: 'Map View',
    icon: MapPin,
    href: '/map',
    roles: ['case_manager', 'investigator'], // Not for admin or citizens
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    roles: ['admin', 'case_manager'],
  },
];

const adminNavigation: NavItem[] = [
  {
    title: 'User Management',
    icon: Users,
    href: '/admin/users',
    roles: ['admin'],
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
    roles: ['admin'],
  },
  {
    title: 'Camera Sources',
    icon: Activity,
    href: '/admin/cameras',
    roles: ['admin'],
  },
  {
    title: 'AI Model Config',
    icon: Database,
    href: '/admin/ai-config',
    roles: ['admin'],
  },
];

function SidebarNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();

  const filteredNavigation = navigation.filter(item => {
    // If no roles specified, show to all authenticated users
    if (!item.roles) {
      return true;
    }
    // If roles specified, check if user's role is included
    return item.roles.includes(user?.role || '');
  });

  const filteredAdminNavigation = adminNavigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Shield className="size-4" />
                </div>
                {state === "expanded" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-0.5 leading-none"
                  >
                    <span className="font-semibold">TraceVision</span>
                    <span className="text-xs text-muted-foreground">Missing Persons Detection</span>
                  </motion.div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <NavLink to={item.href} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminNavigation.length > 0 && (
          <>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredAdminNavigation.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.href}
                      >
                        <NavLink to={item.href} className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <Separator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/help" className="flex items-center gap-2">
                    <HelpCircle className="size-4" />
                    <span>Help & Support</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {state === "expanded" && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-2 text-xs text-muted-foreground"
          >
            <div className="font-medium">{user.name}</div>
            <div>{user.organization}</div>
          </motion.div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar() {
  return <SidebarNav />;
}
