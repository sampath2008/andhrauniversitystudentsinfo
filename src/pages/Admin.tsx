import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminPanel } from "@/components/AdminPanel";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { SpinLoader } from "@/components/ui/spin-loader";

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string>("");

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
        setSessionToken(token);
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SpinLoader size="lg" className="text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header isAdminLoggedIn onLogout={handleLogout} />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AdminPanel sessionToken={sessionToken} />
          </motion.div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Admin;
