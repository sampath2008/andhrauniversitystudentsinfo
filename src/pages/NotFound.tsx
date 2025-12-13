import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/20"
          >
            <AlertCircle className="h-10 w-10 text-destructive" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-2 text-7xl font-bold gradient-text"
          >
            404
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-xl text-muted-foreground"
          >
            Oops! Page not found
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/">
              <Button variant="gradient" size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Background Effect */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-destructive/10 blur-3xl"
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
