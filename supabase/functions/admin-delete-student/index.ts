import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken, studentId } = await req.json();

    if (!sessionToken || !studentId) {
      return new Response(
        JSON.stringify({ error: "Session token and student ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate admin session
    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      console.error("Admin session validation failed:", sessionError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete any student sessions first
    const { error: sessionsDeleteError } = await supabase
      .from("student_sessions")
      .delete()
      .eq("student_id", studentId);

    if (sessionsDeleteError) {
      console.error("Error deleting student sessions:", sessionsDeleteError);
    }

    // Delete the student
    const { error: deleteError } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (deleteError) {
      console.error("Error deleting student:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete student" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`Admin deleted student ${studentId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin delete student error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
