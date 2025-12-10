import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/password";
import { User, Save, Loader2 } from "lucide-react";

const sections = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];

interface StudentInfoPanelProps {
  studentId: string;
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

export function StudentInfoPanel({ studentId }: StudentInfoPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState({
    studentName: "",
    rollNumber: "",
    phoneNumber: "",
    email: "",
    section: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_name, registration_number, roll_number, phone_number, email, section")
        .eq("id", studentId)
        .single();

      if (error) throw error;

      setStudent(data);
      setFormData({
        studentName: data.student_name,
        rollNumber: data.roll_number,
        phoneNumber: data.phone_number,
        email: data.email,
        section: data.section,
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
      const updateData: Record<string, string> = {
        student_name: formData.studentName.trim(),
        roll_number: formData.rollNumber.trim(),
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        section: formData.section,
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
        updateData.password_hash = await hashPassword(formData.newPassword);
      }

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", studentId);

      if (error) throw error;

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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <Card className="card-elevated border-border/50">
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Student data not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl card-elevated border-border/50 animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
          <User className="h-7 w-7 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Student Info</CardTitle>
        <CardDescription>
          Registration Number: <span className="font-mono text-primary">{student.registration_number}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name</Label>
            <Input
              id="studentName"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password (leave blank to keep current)</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
