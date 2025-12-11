import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legacy hash function for migration (will be removed after all passwords are migrated)
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = "au_site_salt_2024";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    
    if (storedHash.startsWith('$2')) {
      // Bcrypt hash (using sync version as Workers not available in edge runtime)
      passwordValid = bcrypt.compareSync(password, storedHash);
    } else {
      // Legacy SHA-256 hash - verify and migrate to bcrypt
      const legacyHash = await legacyHashPassword(password);
      if (legacyHash === storedHash) {
        passwordValid = true;
        // Migrate to bcrypt on successful login
        const newHash = bcrypt.hashSync(password);
        await supabase
          .from('students')
          .update({ password_hash: newHash })
          .eq('id', student.id);
        console.log(`Migrated password hash to bcrypt for student ${student.id}`);
      }
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
