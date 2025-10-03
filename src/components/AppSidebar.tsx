import { Home, MessageSquare, Calendar, Users, ShoppingCart, Bot, Settings } from "lucide-react";
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

const items = [
  { title: "Início", url: "/", icon: Home },
  { title: "Conversas", url: "/conversas", icon: MessageSquare },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Clientes & Pets", url: "/clientes", icon: Users },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "IA", url: "/ia", icon: Bot },
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4 md:pt-6">
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg smooth-transition min-h-[44px] ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!isCollapsed || isMobile) && <span className="text-sm md:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
