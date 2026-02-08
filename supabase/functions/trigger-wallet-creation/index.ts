// supabase/functions/trigger-wallet-creation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle OPTIONS preflight request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // --- MVP Bypass: Authentication and RBAC (REMOVE FOR PRODUCTION) ---
    // Since user login is not implemented for the MVP, we are temporarily bypassing all auth and RBAC.
    // This is INSECURE and must be fully re-enabled and properly implemented for production environments.
    console.warn('ADVERTENCIA: Autenticación y RBAC DESACTIVADOS en trigger-wallet-creation para MVP. ESTO ES INSEGURO Y DEBE SER REEMPLAZADO PARA PRODUCCIÓN.');
    // const authHeader = req.headers.get('Authorization');
    // if (!authHeader) {
    //   return new Response(JSON.stringify({ error: "Authorization header missing." }), {
    //     status: 401,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" }
    //   });
    // }

    // const supabaseClient = createClient(
    //   Deno.env.get("SUPABASE_URL") ?? "",
    //   Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    //   { global: { headers: { Authorization: authHeader } } } // Pass auth header for user validation
    // );

    // // Obtener el usuario autenticado desde el Token (JWT)
    // const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    // if (authError || !user) {
    //   return new Response(JSON.stringify({ error: "No autorizado" }), {
    //     status: 401,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" }
    //   });
    // }

    // // Verificación Granular: Consultar el rol en la base de datos
    // // Usamos el cliente con SERVICE_ROLE para leer la tabla de perfiles
    // const adminClient = createClient(
    //   Deno.env.get("SUPABASE_URL") ?? "",
    //   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    // );

    // const { data: profile, error: profileError } = await adminClient
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // if (profileError || profile?.role !== 'admin') {
    //   console.error("Profile or Role error:", profileError);
    //   return new Response(
    //     JSON.stringify({ error: "Acceso denegado: Se requieren permisos de administrador" }),
    //     { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    //   );
    // }
    // --- END MVP Bypass ---

    const { student_id } = await req.json();

    if (!student_id) {
      return new Response(JSON.stringify({ error: "Student ID is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the internal create-stellar-student-wallet function
    // For MVP, we're assuming this call will proceed without explicit user auth checks
    // as it's triggered internally from this bypassed function.
    const createWalletResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-stellar-student-wallet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass the SERVICE_ROLE_KEY here for internal function-to-function call
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ student_id }),
      }
    );

    const data = await createWalletResponse.json();

    if (!createWalletResponse.ok) {
      console.error("Error from create-stellar-student-wallet:", data);
      return new Response(JSON.stringify({ error: data.error || "Failed to create Stellar wallet internally." }), {
        status: createWalletResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the response from create-stellar-student-wallet, which includes device_secret_key
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge Function internal error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
