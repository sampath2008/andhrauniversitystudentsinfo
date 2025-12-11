import { Link, useLocation, useNavigate } from "react-router-dom";
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
  return <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text">Andhra University Site </span>
        </Link>

        <nav className="flex items-center gap-4">
          {isStudentLoggedIn && <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>}
          
          {isAdminLoggedIn && <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Admin Logout
            </Button>}

          {!isStudentLoggedIn && !isAdminLoggedIn && location.pathname !== "/admin-login" && <Link to="/admin-login">
              <Button variant="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin Login
              </Button>
            </Link>}
        </nav>
      </div>
    </header>;
}