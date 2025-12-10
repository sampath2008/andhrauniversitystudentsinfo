import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/password";
import { UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";

const sections = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];

const registrationSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required").max(100),
  registrationNumber: z.string().trim().min(1, "Registration number is required").max(50),
  rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
  phoneNumber: z.string().trim().min(10, "Valid phone number required").max(15),
  email: z.string().trim().email("Valid email is required").max(255),
  section: z.enum(["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"]),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export function StudentRegistrationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    registrationNumber: "",
    rollNumber: "",
    phoneNumber: "",
    email: "",
    section: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registrationSchema.safeParse(formData);
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
      const passwordHash = await hashPassword(formData.password);

      const { error } = await supabase.from("students").insert({
        student_name: formData.studentName.trim(),
        registration_number: formData.registrationNumber.trim(),
        roll_number: formData.rollNumber.trim(),
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        section: formData.section,
        password_hash: passwordHash,
        password: formData.password,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Registration Failed",
            description: "A student with this registration number already exists.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Registration Successful!",
        description: "You can now login to view your information.",
      });

      setFormData({
        studentName: "",
        registrationNumber: "",
        rollNumber: "",
        phoneNumber: "",
        email: "",
        section: "",
        password: "",
      });

    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg card-elevated border-border/50 animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
          <UserPlus className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Student Registration</CardTitle>
        <CardDescription>Register to access your student portal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              placeholder="Enter your full name"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                placeholder="e.g., REG2024001"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                placeholder="e.g., 101"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData({ ...formData, section: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Register
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
