import { Toaster } from "@/components/ui/toaster";
import SonnerToaster from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProjectDashboard from "./pages/ProjectDashboard";
import ProjectBrainstorm from "./pages/ProjectBrainstorm";
import ProjectCanvas from "./pages/ProjectCanvas";
import ProjectNotes from "./pages/ProjectNotes";
import ProjectDevAI from "./pages/ProjectDevAI";
import DBViewer from "./pages/DBViewer";
import { FlowchartViewer } from "./pages/FlowchartViewer";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AuthGuard from "./components/AuthGuard";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./utils/themeDebug"; // Add theme debugging utility

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry authentication errors
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          return false;
        }
        // Retry other errors up to 3 times
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry authentication errors
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          return false;
        }
        // Don't retry mutations by default
        return false;
      },
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div>
              <Toaster />
              <SonnerToaster />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/projects" element={<AuthGuard><Projects /></AuthGuard>} />
                <Route path="/project/:id" element={<AuthGuard><ProjectDashboard /></AuthGuard>} />
                <Route path="/project/:id/brainstorm" element={<AuthGuard><ProjectBrainstorm /></AuthGuard>} />
                <Route path="/project/:id/canvas" element={<AuthGuard><ProjectCanvas /></AuthGuard>} />
                <Route path="/project/:id/notes" element={<AuthGuard><ProjectNotes /></AuthGuard>} />
                <Route path="/project/:id/devai" element={<AuthGuard><ProjectDevAI /></AuthGuard>} />
                <Route path="/project/:id/db" element={<AuthGuard><DBViewer /></AuthGuard>} />
                <Route path="/project/:id/flowchart" element={<AuthGuard><FlowchartViewer /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
