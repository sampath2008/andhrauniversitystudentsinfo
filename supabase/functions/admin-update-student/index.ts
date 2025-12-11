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
    const { sessionToken, studentId, updates } = await req.json();
    
    if (!sessionToken || !studentId || !updates) {
      return new Response(
        JSON.stringify({ error: 'Session token, student ID, and updates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: Record<string, string> = {
      student_name: updates.student_name?.trim(),
      registration_number: updates.registration_number?.trim(),
      roll_number: updates.roll_number?.trim(),
      phone_number: updates.phone_number?.trim(),
      email: updates.email?.trim(),
      section: updates.section,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    // Handle password update with bcrypt
    if (updates.new_password) {
      updateData.password_hash = await bcrypt.hash(updates.new_password);
      updateData.password = updates.new_password; // Plain text for admin viewing
    }

    // Update student
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId);

    if (error) {
      console.error('Error updating student:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update student' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin updated student ${studentId}`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin update student error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
