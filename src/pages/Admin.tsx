import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { AdminPanel } from "@/components/AdminPanel";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = sessionStorage.getItem("adminToken");
      
      if (!token) {
        navigate("/admin-login");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('admin-validate-session', {
          body: { sessionToken: token }
        });

        if (error || !data?.valid) {
          sessionStorage.removeItem("adminToken");
          navigate("/admin-login");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Session validation error:', error);
        sessionStorage.removeItem("adminToken");
        navigate("/admin-login");
      }
      
      setLoading(false);
    };

    validateSession();
  }, [navigate]);

  const handleLogout = async () => {
    const token = sessionStorage.getItem("adminToken");
    
    try {
      await supabase.functions.invoke('admin-logout', {
        body: { sessionToken: token }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    sessionStorage.removeItem("adminToken");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAdminLoggedIn onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <AdminPanel />
      </main>

      {/* Background Glow Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </div>
  );
};

export default Admin;
