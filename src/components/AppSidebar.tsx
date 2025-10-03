import {
  Home,
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  GraduationCap,
  Hotel,
  HeartPulse,
  Sparkles,
  MessageCircle,
  Zap,
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BadgeMenu } from "@/components/ui/badge-menu";

interface MenuItem {
  title: string;
  url: string;
  icon: typeof Home;
  badge?: { text: string; variant: "new" | "beta" | "pro" };
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Operação",
    items: [
      { title: "Painel de Controle", url: "/", icon: Home },
      { title: "Atendimento", url: "/conversas", icon: MessageSquare },
      { title: "Agenda", url: "/agenda", icon: Calendar },
    ]
  },
  {
    title: "Crescimento",
    items: [
      { title: "Família Pet", url: "/clientes", icon: Users },
      { title: "Faturamento", url: "/vendas", icon: TrendingUp },
      {
        title: "Educar Pets",
        url: "/training",
        icon: GraduationCap,
        badge: { text: "Novo", variant: "new" }
      },
      {
        title: "Cuidado Estendido",
        url: "/daycare",
        icon: Hotel,
        badge: { text: "Novo", variant: "new" }
      },
      {
        title: "Bem-Estar 360°",
        url: "/bipe",
        icon: HeartPulse,
        badge: { text: "Novo", variant: "new" }
      },
    ]
  },
  {
    title: "Inteligência",
    items: [
      { title: "Piloto Automático", url: "/ia", icon: Zap },
      {
        title: "Sua Parceira Aurora",
        url: "/aurora/meet",
        icon: Sparkles,
        badge: { text: "Beta", variant: "beta" }
      },
      { title: "Conectar WhatsApp", url: "/whatsapp", icon: MessageCircle },
      { title: "Configurações", url: "/ajustes", icon: Settings },
    ]
  }
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4 md:pt-6">
        {/* Logo/Brand */}
        <div className="px-3 md:px-4 mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xl md:text-2xl">🐾</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="font-bold text-lg md:text-xl text-sidebar-foreground">AuZap</span>
            )}
          </div>
        </div>

        {/* Menu Groups */}
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <SidebarGroup>
              {(!isCollapsed || isMobile) && (
                <div className="px-3 md:px-4 mb-2 mt-2">
                  <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    {group.title}
                  </span>
                </div>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg smooth-transition min-h-[44px] ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`
                          }
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {(!isCollapsed || isMobile) && (
                            <div className="flex items-center justify-between w-full gap-2">
                              <span className="text-sm md:text-base">{item.title}</span>
                              {item.badge && (
                                <BadgeMenu
                                  text={item.badge.text}
                                  variant={item.badge.variant}
                                />
                              )}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Divider entre grupos (exceto último) */}
            {groupIndex < menuGroups.length - 1 && (
              <div className="mx-3 md:mx-4 my-3 border-t border-sidebar-border/30" />
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
