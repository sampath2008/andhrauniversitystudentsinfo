import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { verifyPassword } from "@/lib/password";
import { LogIn, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required"),
  password: z.string().min(1, "Password is required"),
});

interface StudentLoginFormProps {
  onLogin: (studentId: string, registrationNumber: string) => void;
}

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
      const { data: student, error } = await supabase
        .from("students")
        .select("id, password_hash, registration_number")
        .eq("registration_number", formData.registrationNumber.trim())
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        toast({
          title: "Login Failed",
          description: "No student found with this registration number.",
          variant: "destructive",
        });
        return;
      }

      const isValid = await verifyPassword(formData.password, student.password_hash);

      if (!isValid) {
        toast({
          title: "Login Failed",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login Successful!",
        description: "Welcome to your student portal.",
      });

      onLogin(student.id, student.registration_number);

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
    <Card className="w-full max-w-md card-elevated border-border/50 animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
          <LogIn className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Student Login</CardTitle>
        <CardDescription>Access your student information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              placeholder="Enter your registration number"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
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
        </form>
      </CardContent>
    </Card>
  );
}
