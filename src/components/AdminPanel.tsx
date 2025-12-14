import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Download, Edit, Users, Shield, Trash2, Search, X, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { SpinLoader } from "@/components/ui/spin-loader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

const ITEMS_PER_PAGE = 10;

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
  password: string | null;
  created_at: string;
}

interface AdminPanelProps {
  sessionToken: string;
}

export function AdminPanel({ sessionToken }: AdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [showPasswords, setShowPasswords] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
      const { data, error } = await supabase.functions.invoke('admin-get-students', {
        body: { sessionToken },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setStudents(data?.students || []);
      setSelectedStudents(new Set());
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

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = searchQuery === "" || 
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone_number.includes(searchQuery);
      
      const matchesSection = filterSection === "all" || student.section === filterSection;
      
      return matchesSearch && matchesSection;
    });
  }, [students, searchQuery, filterSection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    
    setBulkDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-bulk-delete-students', {
        body: { sessionToken, studentIds: Array.from(selectedStudents) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: `Deleted ${data.deletedCount} students successfully.`,
      });

      setSelectedStudents(new Set());
      fetchStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete students.",
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
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
      const updates: Record<string, string> = {
        student_name: editForm.studentName.trim(),
        registration_number: editForm.registrationNumber.trim(),
        roll_number: editForm.rollNumber.trim(),
        phone_number: editForm.phoneNumber.trim(),
        email: editForm.email.trim(),
        section: editForm.section,
      };

      if (editForm.newPassword) {
        updates.new_password = editForm.newPassword;
      }

      const { data, error } = await supabase.functions.invoke('admin-update-student', {
        body: { sessionToken, studentId: editingStudent.id, updates },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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

  const handleDelete = async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-student', {
        body: { sessionToken, studentId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "Student deleted successfully.",
      });

      fetchStudents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student.",
        variant: "destructive",
      });
    } finally {
      setDeletingStudentId(null);
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

  // Get password display for admin
  const getPasswordDisplay = (student: Student) => {
    if (!student.password) return "N/A";
    return showPasswords ? student.password : "••••••••";
  };

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id));
  const isSomeSelected = filteredStudents.some(s => selectedStudents.has(s.id));

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
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Total Students: {students.length}</span>
              {filteredStudents.length !== students.length && (
                <span className="text-primary">({filteredStudents.length} shown)</span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-primary/10 p-3">
              <span className="text-sm font-medium">
                {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? (
                      <SpinLoader size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedStudents.size} Students</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudents(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <SpinLoader size="lg" className="text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              No students registered yet.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              No students match your search criteria.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={isSomeSelected && !isAllSelected ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Reg. No.</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Password
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id} className={`hover:bg-secondary/30 ${selectedStudents.has(student.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                          aria-label={`Select ${student.student_name}`}
                        />
                      </TableCell>
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
                      <TableCell className="font-mono text-xs text-primary">
                        {getPasswordDisplay(student)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(student)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingStudentId === student.id}
                              >
                                {deletingStudentId === student.id ? (
                                  <SpinLoader size="sm" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {student.student_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
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
                    <SpinLoader size="sm" />
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
