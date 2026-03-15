import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import SenderDashboard from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import TruckDetail from "@/pages/TruckDetail";

const queryClient = new QueryClient();

// Route Guard Component
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: string }) {
  const { role } = useAuth();
  
  if (!role) {
    return <Redirect to="/login" />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Redirect to={role === 'SENDER' ? '/' : '/receiver'} />;
  }

  return <Component />;
}

function Router() {
  const { role } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {role ? <Redirect to={role === 'SENDER' ? '/' : '/receiver'} /> : <Login />}
      </Route>
      
      {/* Sender Routes */}
      <Route path="/">
        <ProtectedRoute component={SenderDashboard} allowedRole="SENDER" />
      </Route>
      <Route path="/trucks/:id">
        <ProtectedRoute component={TruckDetail} allowedRole="SENDER" />
      </Route>

      {/* Receiver Routes */}
      <Route path="/receiver">
        <ProtectedRoute component={ReceiverDashboard} allowedRole="RECEIVER" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
