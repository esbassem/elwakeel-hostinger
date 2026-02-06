import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jyzcwjyexvarcyvoxapc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5emN3anlleHZhcmN5dm94YXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mzg4MzcsImV4cCI6MjA4MzMxNDgzN30.S6I3UmOHACeWvgStyMwEjUPGSoJS8HHqon2jZ2ilEKI';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
