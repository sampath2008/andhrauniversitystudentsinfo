import { useState } from "react";
import { Header } from "@/components/Header";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";
import { StudentLoginForm } from "@/components/StudentLoginForm";
import { StudentInfoPanel } from "@/components/StudentInfoPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
const Index = () => {
  const [loggedInStudent, setLoggedInStudent] = useState<{
    id: string;
    registrationNumber: string;
    sessionToken: string;
  } | null>(null);
  const handleStudentLogin = (studentId: string, registrationNumber: string, sessionToken: string) => {
    setLoggedInStudent({
      id: studentId,
      registrationNumber,
      sessionToken
    });
  };
  const handleLogout = () => {
    setLoggedInStudent(null);
  };
  return <div className="min-h-screen bg-background">
      <Header isStudentLoggedIn={!!loggedInStudent} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {loggedInStudent ? <div className="flex flex-col items-center">
            <h1 className="mb-8 text-3xl font-bold gradient-text">Student Info</h1>
            <StudentInfoPanel studentId={loggedInStudent.id} sessionToken={loggedInStudent.sessionToken} />
          </div> : <div className="flex flex-col items-center">
            {/* Hero Section */}
            <div className="mb-12 text-center animate-fade-in">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent animate-float">
                <GraduationCap className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Welcome to AU

Registration Site<span className="gradient-text">Andhra University Site</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                Secure student data management portal. Register or login to access your information.
                Created By AU Student
              </p>
            </div>

            {/* Tabs for Register/Login */}
            <Tabs defaultValue="register" className="w-full max-w-lg">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>
              <TabsContent value="register" className="flex justify-center">
                <StudentRegistrationForm />
              </TabsContent>
              <TabsContent value="login" className="flex justify-center">
                <StudentLoginForm onLogin={handleStudentLogin} />
              </TabsContent>
            </Tabs>

            {/* Background Glow Effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            </div>
          </div>}
      </main>
    </div>;
};
export default Index;