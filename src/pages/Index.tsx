import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";
import { StudentLoginForm } from "@/components/StudentLoginForm";
import { StudentInfoPanel } from "@/components/StudentInfoPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const floatVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

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

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header isStudentLoggedIn={!!loggedInStudent} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <AnimatePresence mode="wait">
          {loggedInStudent ? (
            <motion.div
              key="student-info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center"
            >
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 text-3xl font-bold gradient-text"
              >
                Student Info
              </motion.h1>
              <StudentInfoPanel studentId={loggedInStudent.id} sessionToken={loggedInStudent.sessionToken} />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Hero Section */}
              <motion.div variants={itemVariants} className="mb-12 text-center">
                <motion.div
                  variants={floatVariants}
                  animate="animate"
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg glow-border"
                >
                  <motion.div variants={pulseVariants} animate="animate">
                    <GraduationCap className="h-10 w-10 text-primary-foreground icon-glow" />
                  </motion.div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                  </motion.div>
                  <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
                    Welcome to{" "}
                    <span className="gradient-text">Andhra University Site</span>
                  </h1>
                </motion.div>
                
                <motion.p
                  variants={itemVariants}
                  className="mx-auto max-w-xl text-lg text-muted-foreground"
                >
                  Secure student data management portal. Register or login to access your information.
                  <br />
                  <span className="text-sm text-primary/80">Created By AU Student</span>
                </motion.p>
              </motion.div>

              {/* Tabs for Register/Login */}
              <motion.div variants={itemVariants} className="w-full max-w-lg">
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 p-1">
                    <TabsTrigger 
                      value="register" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                      Register
                    </TabsTrigger>
                    <TabsTrigger 
                      value="login"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground transition-all duration-300"
                    >
                      Login
                    </TabsTrigger>
                  </TabsList>
                  <AnimatePresence mode="wait">
                    <TabsContent value="register" className="flex justify-center">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <StudentRegistrationForm />
                      </motion.div>
                    </TabsContent>
                    <TabsContent value="login" className="flex justify-center">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <StudentLoginForm onLogin={handleStudentLogin} />
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
          />
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
          />
        </div>
      </main>
    </div>
  );
};

export default Index;