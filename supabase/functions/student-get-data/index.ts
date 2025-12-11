import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, sessionToken } = await req.json();
    
    if (!studentId || !sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Student ID and session token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token - must belong to the claimed student and not be expired
    const { data: session, error: sessionError } = await supabase
      .from('student_sessions')
      .select('student_id, expires_at')
      .eq('session_token', sessionToken)
      .eq('student_id', studentId)
      .single();

    if (sessionError || !session) {
      console.log('Invalid session token for student:', studentId);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      console.log('Session expired for student:', studentId);
      // Clean up expired session
      await supabase
        .from('student_sessions')
        .delete()
        .eq('session_token', sessionToken);
      
      return new Response(
        JSON.stringify({ error: 'Session expired, please login again' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student data (excluding password fields)
    const { data: student, error } = await supabase
      .from('students')
      .select('id, student_name, registration_number, roll_number, phone_number, email, section, created_at, updated_at')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ student }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get student data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
