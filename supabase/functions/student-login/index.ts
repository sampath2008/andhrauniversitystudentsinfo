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
    const { registration_number, password } = await req.json();
    
    if (!registration_number || !password) {
      return new Response(
        JSON.stringify({ error: 'Registration number and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find student by registration number
    const { data: student, error } = await supabase
      .from('students')
      .select('id, registration_number, password_hash, student_name')
      .eq('registration_number', registration_number)
      .single();

    if (error || !student) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password - support both bcrypt and legacy hashes
    let passwordValid = false;
    const storedHash = student.password_hash;
    
    // All passwords should now be bcrypt hashed
    if (storedHash.startsWith('$2')) {
      passwordValid = bcrypt.compareSync(password, storedHash);
    } else {
      // Legacy hashes are no longer supported
      console.error(`Student ${student.id} has unsupported legacy hash format`);
      passwordValid = false;
    }
    
    if (!passwordValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const sessionToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    // Clear any existing sessions for this student
    await supabase
      .from('student_sessions')
      .delete()
      .eq('student_id', student.id);

    // Store the session token in the database
    const { error: sessionError } = await supabase
      .from('student_sessions')
      .insert({
        student_id: student.id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Student ${student.student_name} logged in successfully`);
    
    return new Response(
      JSON.stringify({ 
        sessionToken, 
        studentId: student.id,
        studentName: student.student_name 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Student login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
