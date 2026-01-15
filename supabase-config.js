// Supabase Configuration
const SUPABASE_URL = 'https://pcbkbnxkmjdsbfsyxbev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYmtibnhrbWpkc2Jmc3l4YmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzY0NTksImV4cCI6MjA1MjU1MjQ1OX0.sb_publishable_YWycbGETwFrRPS3EqnquAw_u_JzKcr_';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Sign out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = '/index.html';
    }
}
