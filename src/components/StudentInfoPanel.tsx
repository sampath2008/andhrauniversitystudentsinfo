import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Save, Loader2 } from "lucide-react";

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
          {/* Read-only fields */}
          <div className="space-y-2">
            <Label>Student Name</Label>
            <Input value={student.student_name} disabled className="bg-muted" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input value={student.roll_number} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={student.section} disabled className="bg-muted" />
            </div>
          </div>

          {/* Editable fields */}
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
