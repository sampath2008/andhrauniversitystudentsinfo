import { Mail, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-6">
            <a
              href="mailto:sampathlox@gmail.com"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">sampathlox@gmail.com</span>
            </a>
            <a
              href="https://instagram.com/_exotic_sampath.56"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
              <span className="text-sm">_exotic_sampath.56</span>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
