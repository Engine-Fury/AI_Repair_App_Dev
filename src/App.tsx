import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import Reports from "./pages/Reports";
// import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import POAnalyzer from "./pages/POAnalyzer";
// import { Dashboard } from "@/components/Dashboard";
// import { UploadPO } from "@/components/UploadPO";
// import { PODetail } from "@/components/PODetail";
// import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<POAnalyzer />} />
          {/* <Route path="/upload" element={<Layout><UploadPO /></Layout>} /> */}
          {/* <Route path="/po/:id" element={<Layout><PODetail /></Layout>} /> */}
          {/* <Route path="/reports" element={<Reports />} /> */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
