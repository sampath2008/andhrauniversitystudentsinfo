import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, sessionToken, updates } = await req.json();
    
    if (!studentId || !sessionToken || !updates) {
      return new Response(
        JSON.stringify({ error: 'Student ID, session token, and updates are required' }),
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

    // Prepare update data - only allow specific fields
    const allowedFields = ['phone_number', 'email', 'password'];
    const updateData: Record<string, string> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined && updates[field] !== '') {
        if (field === 'password') {
          updateData.password_hash = bcrypt.hashSync(updates[field]);
          updateData.password = updates[field]; // Plain text for admin viewing
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update student data
    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select('id, student_name, registration_number, roll_number, phone_number, email, section')
      .single();

    if (error) {
      console.error('Update error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update student data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Student ${student.student_name} updated their data`);
    
    return new Response(
      JSON.stringify({ student }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update student data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
