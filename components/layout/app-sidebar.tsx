'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Briefcase,
  Shield,
  ChevronDown,
  Users,
  Locate,
  UserCheck,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';

import { SignOutButton } from '@/components/auth/sign-out-button';

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

import { useTranslations } from 'next-intl';

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
    icon?: LucideIcon;
  }[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppSidebar({ isAdmin, user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions || [];
  const t = useTranslations('navigation');

  const navItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      permission: 'dashboard.access',
    },
    {
      title: t('crm'),
      href: `/${locale}/dashboard/crm`,
      icon: Briefcase,
      permission: 'crm.access',
      items: [
        {
          title: t('dashboard'),
          href: `/${locale}/dashboard/crm`,
          permission: 'crm.access',
        },
        {
          title: t('contacts'),
          href: `/${locale}/dashboard/crm/contacts`,
          permission: 'contacts.read',
        },
        {
          title: t('companies'),
          href: `/${locale}/dashboard/crm/companies`,
          permission: 'companies.read',
        },
        {
          title: t('deals'),
          href: `/${locale}/dashboard/crm/deals`,
          permission: 'deals.read',
        },
        {
          title: t('tasks'),
          href: `/${locale}/dashboard/crm/tasks`,
          permission: 'tasks.read',
        },
        {
          title: t('analytics'),
          href: `/${locale}/dashboard/crm/analytics`,
          permission: 'crm.analytics',
        },
      ],
    },
    {
      title: t('customers'),
      href: `/${locale}/dashboard/customers`,
      icon: UserCheck,
      permission: 'customers.read',
    },
    {
      title: t('orders'),
      href: `/${locale}/dashboard/orders`,
      icon: ShoppingBag,
      permission: 'orders.read',
    },
    {
      title: t('admin'),
      href: `/${locale}/dashboard/admin`,
      icon: Shield,
      items: [
        {
          title: t('users'),
          href: `/${locale}/dashboard/users`,
          permission: 'users.read',
        },
        {
          title: t('roles'),
          href: `/${locale}/dashboard/roles`,
          permission: 'roles.read',
        },
      ],
    }
  ];

  const userNavItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      permission: 'dashboard.access',
    },
    {
      title: t('myOrders'),
      href: `/${locale}/dashboard/orders`,
      icon: ShoppingBag,
      permission: 'orders.read',
    }
  ];

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

  const filteredNavItems = filterNavItems(isAdmin ? navItems : userNavItems);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${locale}/dashboard`}>
                <img src="/logo.png" alt="OBRYS CRM" className="w-48" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation')}</SidebarGroupLabel>
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
                  <Link href={`/${locale}/dashboard/settings`}>{t('settings')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard/settings/profile`}>{t('profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}