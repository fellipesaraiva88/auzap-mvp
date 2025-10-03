import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PawLoader } from "@/components/PawLoader";

// Lazy load pages for better code-splitting
const Index = lazy(() => import("./pages/Index"));
const Conversas = lazy(() => import("./pages/Conversas"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClientesKanban = lazy(() => import("./pages/ClientesKanban"));
const Vendas = lazy(() => import("./pages/Vendas"));
const IA = lazy(() => import("./pages/IA"));
const Ajustes = lazy(() => import("./pages/Ajustes"));
const WhatsAppSetup = lazy(() => import("./pages/WhatsAppSetup"));
const AuroraMeetPage = lazy(() => import("./pages/AuroraMeetPage"));
const BipePanel = lazy(() => import("./pages/BipePanel"));
const TrainingPlans = lazy(() => import("./pages/TrainingPlans"));
const DaycareStays = lazy(() => import("./pages/DaycareStays"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Panel
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const LoginAdmin = lazy(() => import("./pages/admin/LoginAdmin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ClientsAdmin = lazy(() => import("./pages/admin/ClientsAdmin"));
const Monitoring = lazy(() => import("./pages/admin/Monitoring"));
const Logs = lazy(() => import("./pages/admin/Logs"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Settings = lazy(() => import("./pages/admin/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PawLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Admin Panel Routes (separate auth) */}
            <Route path="/admin/login" element={<LoginAdmin />} />
            <Route
              path="/admin/*"
              element={
                <AdminLayout />
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<ClientsAdmin />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="logs" element={<Logs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="min-h-screen flex w-full">
                      <AppSidebar />
                      <main className="flex-1">
                        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
                          <div className="flex items-center h-16 px-6">
                            <SidebarTrigger />
                          </div>
                        </div>
                        <Suspense fallback={<PawLoader />}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/conversas" element={<Conversas />} />
                            <Route path="/agenda" element={<Agenda />} />
                            <Route path="/clientes" element={<ClientesKanban />} />
                            <Route path="/clientes-old" element={<Clientes />} />
                            <Route path="/vendas" element={<Vendas />} />
                            <Route path="/ia" element={<IA />} />
                            <Route path="/ajustes" element={<Ajustes />} />
                            <Route path="/whatsapp" element={<WhatsAppSetup />} />
                            <Route path="/aurora/meet" element={<AuroraMeetPage />} />
                            <Route path="/bipe" element={<BipePanel />} />
                            <Route path="/training" element={<TrainingPlans />} />
                            <Route path="/daycare" element={<DaycareStays />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
