import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required"),
  password: z.string().min(1, "Password is required"),
});

interface StudentLoginFormProps {
  onLogin: (studentId: string, registrationNumber: string, sessionToken: string) => void;
}

const inputVariants = {
  focus: { scale: 1.02, transition: { duration: 0.2 } },
  blur: { scale: 1, transition: { duration: 0.2 } },
};

export function StudentLoginForm({ onLogin }: StudentLoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('student-login', {
        body: { 
          registration_number: formData.registrationNumber.trim(),
          password: formData.password 
        }
      });

      if (error || data?.error) {
        toast({
          title: "Login Failed",
          description: data?.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login Successful!",
        description: `Welcome, ${data.studentName}!`,
      });

      onLogin(data.studentId, formData.registrationNumber.trim(), data.sessionToken);

    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="w-full max-w-md card-elevated border-border/50 glow-border overflow-hidden">
        <CardHeader className="text-center relative">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <LogIn className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl">Student Login</CardTitle>
            <CardDescription>Access your student information</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <motion.div whileFocus="focus" variants={inputVariants}>
                <Input
                  id="registrationNumber"
                  placeholder="Enter your registration number"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                type="submit" 
                className="w-full btn-ripple" 
                variant="gradient" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
