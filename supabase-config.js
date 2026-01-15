// Supabase Configuration
const SUPABASE_URL = 'https://pcbkbnxkmjdsbfsyxbev.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYmtibnhrbWpkc2Jmc3l4YmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDcwNDcsImV4cCI6MjA4NDA4MzA0N30.Ijq1SNZ9OztPKTYlionl1dnsSn6JVRG7rLHagK2MDMs';

// Initialize Supabase client
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Use the global client
const supabaseClient = window.supabaseClient;

// Check if user is logged in
async function getCurrentUser() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
}

// Sign out
async function signOut() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = '/index.html';
    }
}
