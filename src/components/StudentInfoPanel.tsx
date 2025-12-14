import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Save } from "lucide-react";
import { SpinLoader } from "@/components/ui/spin-loader";

interface StudentInfoPanelProps {
  studentId: string;
  sessionToken: string;
}

interface StudentData {
  id: string;
  student_name: string;
  registration_number: string;
  roll_number: string;
  phone_number: string;
  email: string;
  section: string;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

export function StudentInfoPanel({ studentId, sessionToken }: StudentInfoPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('student-get-data', {
        body: { studentId, sessionToken }
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to load data');
      }

      setStudent(data.student);
      setFormData({
        phoneNumber: data.student.phone_number,
        email: data.student.email,
        newPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: Record<string, string> = {
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim(),
      };

      if (formData.newPassword) {
        if (formData.newPassword.length < 6) {
          toast({
            title: "Validation Error",
            description: "Password must be at least 6 characters.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        updates.password = formData.newPassword;
      }

      const { data, error } = await supabase.functions.invoke('student-update-data', {
        body: { studentId, sessionToken, updates }
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to update');
      }

      toast({
        title: "Success",
        description: "Your information has been updated.",
      });

      setFormData((prev) => ({ ...prev, newPassword: "" }));
      fetchStudentData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <SpinLoader size="lg" className="text-primary" />
      </motion.div>
    );
  }

  if (!student) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="card-elevated border-border/50">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Student data not found.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="w-full max-w-2xl card-elevated border-border/50 overflow-hidden">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <User className="h-7 w-7 text-primary-foreground" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl">Student Info</CardTitle>
            <CardDescription>
              Registration Number: <span className="font-mono text-primary">{student.registration_number}</span>
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Read-only fields */}
            <motion.div
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label>Student Name</Label>
              <Input value={student.student_name} disabled className="bg-muted" />
            </motion.div>

            <motion.div
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input value={student.roll_number} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={student.section} disabled className="bg-muted" />
              </div>
            </motion.div>

            {/* Editable fields */}
            <motion.div
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </motion.div>

            <motion.div
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              <Label htmlFor="newPassword">New Password (leave blank to keep current)</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              custom={4}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <Button 
                type="submit" 
                className="w-full btn-ripple" 
                variant="gradient" 
                size="lg" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <SpinLoader size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
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
