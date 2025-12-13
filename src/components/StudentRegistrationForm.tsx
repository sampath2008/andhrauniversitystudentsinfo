import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Loader2, Check, X } from "lucide-react";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";

const sections = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];

// Password strength validation
const passwordStrengthChecks = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
  { label: "Contains special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const registrationSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required").max(100),
  registrationNumber: z.string().trim().min(1, "Registration number is required").max(50),
  rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
  phoneNumber: z.string().trim().min(10, "Valid phone number required").max(15),
  email: z.string().trim().email("Valid email is required").max(255),
  section: z.enum(["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"]),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .refine((p) => /[A-Z]/.test(p), "Password must contain an uppercase letter")
    .refine((p) => /[a-z]/.test(p), "Password must contain a lowercase letter")
    .refine((p) => /[0-9]/.test(p), "Password must contain a number"),
});

const formFieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

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

  const passwordStrength = useMemo(() => {
    const passedChecks = passwordStrengthChecks.filter(check => check.test(formData.password));
    return {
      score: passedChecks.length,
      checks: passwordStrengthChecks.map(check => ({
        ...check,
        passed: check.test(formData.password),
      })),
    };
  }, [formData.password]);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return "bg-destructive";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-lime-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return "Very Weak";
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

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
      const { data, error } = await supabase.functions.invoke('student-register', {
        body: {
          student_name: formData.studentName.trim(),
          registration_number: formData.registrationNumber.trim(),
          roll_number: formData.rollNumber.trim(),
          phone_number: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          section: formData.section,
          password: formData.password,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Registration Failed",
          description: data.error,
          variant: "destructive",
        });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="w-full max-w-lg card-elevated border-border/50 glow-border overflow-hidden">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <UserPlus className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl">Student Registration</CardTitle>
            <CardDescription>Register to access your student portal</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              custom={0}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                placeholder="Enter your full name"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              custom={1}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g., REG2024001"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
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
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </motion.div>

            <motion.div
              custom={2}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                >
                  <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20">
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
            </motion.div>

            <motion.div
              custom={3}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              custom={4}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
              
              {/* Password Strength Indicator */}
              <AnimatePresence>
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <motion.span
                        key={passwordStrength.score}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`font-medium ${passwordStrength.score >= 4 ? 'text-green-500' : passwordStrength.score >= 3 ? 'text-yellow-500' : 'text-destructive'}`}
                      >
                        {getStrengthLabel(passwordStrength.score)}
                      </motion.span>
                    </div>
                    <Progress 
                      value={(passwordStrength.score / 5) * 100} 
                      className="h-1.5"
                      indicatorClassName={getStrengthColor(passwordStrength.score)}
                    />
                    <ul className="space-y-1 mt-2">
                      {passwordStrength.checks.map((check, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-center gap-2 text-xs ${check.passed ? 'text-green-500' : 'text-muted-foreground'}`}
                        >
                          <motion.div
                            initial={false}
                            animate={{ scale: check.passed ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {check.passed ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </motion.div>
                          {check.label}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              custom={5}
              variants={formFieldVariants}
              initial="hidden"
              animate="visible"
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
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Register
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
