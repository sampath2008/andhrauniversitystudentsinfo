import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, GraduationCap, LogOut } from "lucide-react";

interface HeaderProps {
  isStudentLoggedIn?: boolean;
  isAdminLoggedIn?: boolean;
  onLogout?: () => void;
}

export function Header({
  isStudentLoggedIn,
  isAdminLoggedIn,
  onLogout
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold gradient-text"
          >
            AU Site
          </motion.span>
        </Link>

        <nav className="flex items-center gap-4">
          {isStudentLoggedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </motion.div>
          )}
          
          {isAdminLoggedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
              >
                <LogOut className="h-4 w-4" />
                Admin Logout
              </Button>
            </motion.div>
          )}

          {!isStudentLoggedIn && !isAdminLoggedIn && location.pathname !== "/admin-login" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/admin-login">
                <Button variant="admin" className="gap-2 btn-ripple">
                  <Shield className="h-4 w-4" />
                  Admin Login
                </Button>
              </Link>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
}