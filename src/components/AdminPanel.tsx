import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/password";
import { RefreshCw, Download, Edit, Loader2, Users, Shield } from "lucide-react";

const sections = ["A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];

interface Student {
  id: string;
  student_name: string;
  registration_number: string;
  roll_number: string;
  phone_number: string;
  email: string;
  section: string;
  password_hash: string;
  created_at: string;
}

export function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    studentName: "",
    registrationNumber: "",
    rollNumber: "",
    phoneNumber: "",
    email: "",
    section: "",
    newPassword: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
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

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      studentName: student.student_name,
      registrationNumber: student.registration_number,
      rollNumber: student.roll_number,
      phoneNumber: student.phone_number,
      email: student.email,
      section: student.section,
      newPassword: "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setSaving(true);
    try {
      const updateData: Record<string, string> = {
        student_name: editForm.studentName.trim(),
        registration_number: editForm.registrationNumber.trim(),
        roll_number: editForm.rollNumber.trim(),
        phone_number: editForm.phoneNumber.trim(),
        email: editForm.email.trim(),
        section: editForm.section,
      };

      if (editForm.newPassword) {
        updateData.password_hash = await hashPassword(editForm.newPassword);
      }

      const { error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", editingStudent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student information updated.",
      });

      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = () => {
    // Create CSV content (Excel compatible) - excluding passwords
    const headers = ["Student Name", "Registration Number", "Roll Number", "Phone Number", "Email", "Section", "Created At"];
    const rows = students.map((s) => [
      s.student_name,
      s.registration_number,
      s.roll_number,
      s.phone_number,
      s.email,
      s.section,
      new Date(s.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Export Successful",
      description: "Student data exported to CSV (Excel compatible).",
    });
  };

  // Decode password hash for admin viewing (show original stored hash)
  const getPasswordDisplay = (hash: string) => {
    return hash.substring(0, 16) + "...";
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Admin Panel</CardTitle>
                <CardDescription>Manage all student records</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchStudents} variant="outline" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={exportToExcel} variant="gradient" className="gap-2" disabled={students.length === 0}>
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Total Students: {students.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              No students registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Reg. No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Password Hash</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-secondary/30">
                      <TableCell className="font-medium">{student.student_name}</TableCell>
                      <TableCell className="font-mono text-xs">{student.registration_number}</TableCell>
                      <TableCell>{student.roll_number}</TableCell>
                      <TableCell>{student.phone_number}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{student.email}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                          {student.section}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {getPasswordDisplay(student.password_hash)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(student)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Modify student information. Leave password blank to keep current.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Student Name</Label>
              <Input
                id="edit-name"
                value={editForm.studentName}
                onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-reg">Registration Number</Label>
                <Input
                  id="edit-reg"
                  value={editForm.registrationNumber}
                  onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-roll">Roll Number</Label>
                <Input
                  id="edit-roll"
                  value={editForm.rollNumber}
                  onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Select
                  value={editForm.section}
                  onValueChange={(value) => setEditForm({ ...editForm, section: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
