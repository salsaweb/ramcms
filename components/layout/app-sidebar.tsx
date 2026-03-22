'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckSquare,
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
  items?: {
    title: string;
    href: string;
    permission?: string;
  }[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.access',
  },
  {
    title: 'CRM',
    href: '/dashboard/crm',
    icon: Briefcase,
    permission: 'crm.access',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard/crm',
        permission: 'crm.access',
      },
      {
        title: 'Contacts',
        href: '/dashboard/crm/contacts',
        permission: 'contacts.read',
      },
      {
        title: 'Companies',
        href: '/dashboard/crm/companies',
        permission: 'companies.read',
      },
      {
        title: 'Deals',
        href: '/dashboard/crm/deals',
        permission: 'deals.read',
      },
      {
        title: 'Tasks',
        href: '/dashboard/crm/tasks',
        permission: 'tasks.read',
      },
      {
        title: 'Analytics',
        href: '/dashboard/crm/analytics',
        permission: 'crm.analytics',
      },
    ],
  },
  {
    title: 'Admin',
    href: '/dashboard/admin',
    icon: Shield,
    items: [
      {
        title: 'Users',
        href: '/dashboard/users',
        permission: 'users.read',
      },
      {
        title: 'Roles',
        href: '/dashboard/roles',
        permission: 'roles.read',
      },
    ],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permission: 'settings.view',
  },
];

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions || [];

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return userPermissions.includes(permission);
  };

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter(item => hasPermission(item.permission))
      .map(item => {
        if (item.items) {
          const filteredSubItems = item.items.filter(subItem => hasPermission(subItem.permission));
          if (filteredSubItems.length === 0) return null;
          return { ...item, items: filteredSubItems };
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  };

  const filteredNavItems = filterNavItems(navItems);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BarChart3 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ram CMS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                if (item.items) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.href}
                                >
                                  <Link href={subItem.href}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="rounded-lg">
                      {user?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || 'User'}</span>
                    <span className="truncate text-xs">{user?.email || 'user@example.com'}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="rounded-lg">
                        {user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name || 'User'}</span>
                      <span className="truncate text-xs">{user?.email || 'user@example.com'}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout">Log out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}