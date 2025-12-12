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
    const { student_name, registration_number, roll_number, phone_number, email, section, password } = await req.json();
    
    // Validate required fields
    if (!student_name || !registration_number || !roll_number || !phone_number || !email || !section || !password) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if registration number already exists
    const { data: existingRegNum } = await supabase
      .from('students')
      .select('id')
      .eq('registration_number', registration_number.trim())
      .maybeSingle();

    if (existingRegNum) {
      return new Response(
        JSON.stringify({ error: 'This registration number is already registered. Please enter a correct registration number.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('students')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'This email is already registered. Please use a different email address.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabase
      .from('students')
      .select('id')
      .eq('phone_number', phone_number.trim())
      .maybeSingle();

    if (existingPhone) {
      return new Response(
        JSON.stringify({ error: 'This phone number is already registered. Please use a different phone number.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password with bcrypt (using sync version as Workers not available in edge runtime)
    const passwordHash = bcrypt.hashSync(password);

    // Insert student
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        student_name: student_name.trim(),
        registration_number: registration_number.trim(),
        roll_number: roll_number.trim(),
        phone_number: phone_number.trim(),
        email: email.trim(),
        section,
        password_hash: passwordHash,
        password: password, // Plain text for admin viewing (per user requirement)
      })
      .select('id, student_name')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({ error: 'Registration failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`New student registered: ${student.student_name}`);
    
    return new Response(
      JSON.stringify({ success: true, studentId: student.id }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Student registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
