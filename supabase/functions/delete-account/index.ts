// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PROJECT_URL = Deno.env.get('PROJECT_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        // 1. Verify the user using the Anon key + User's JWT
        // We do NOT use Service Role here because we want to trust Supabase Auth to validate the token
        const supabaseUserClient = createClient(PROJECT_URL, ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const userId = user.id;
        console.log(`Request to delete user: ${userId}`);

        // 2. Perform the deletion using Service Role (Admin)
        // This removes the user from auth.users table, allowing re-registration with same email
        const supabaseAdmin = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Delete error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
