import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionToken, studentIds } = await req.json();

    if (!sessionToken || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Session token and student IDs are required' }),
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
      .maybeSingle();

    if (sessionError || !session) {
      console.log('Invalid or expired session');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Bulk deleting ${studentIds.length} students`);

    // Delete student sessions first
    const { error: sessionsError } = await supabase
      .from('student_sessions')
      .delete()
      .in('student_id', studentIds);

    if (sessionsError) {
      console.error('Error deleting student sessions:', sessionsError);
    }

    // Delete students
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .in('id', studentIds);

    if (deleteError) {
      console.error('Error deleting students:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete students' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted ${studentIds.length} students`);

    return new Response(
      JSON.stringify({ success: true, deletedCount: studentIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
