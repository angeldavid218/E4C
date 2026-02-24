// supabase/functions/create-escrow-account/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIEND_BOT_URL = "https://friendbot.stellar.org";
const STELLAR_NETWORK = "TESTNET"; // Hardcoded as per user input

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    )

    // --- Verificar si ya existe una cuenta de Escrow ---
    const { data: existingEscrow, error: fetchError } = await supabaseClient
      .from('stellar_wallets')
      .select('*')
      .eq('role', 'escrow')
      .limit(1);

    if (fetchError) throw new Error(`Error al verificar cuenta de escrow existente: ${fetchError.message}`);
    if (existingEscrow && existingEscrow.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "La cuenta de bóveda (escrow) ya existe. Solo se puede crear una vez.",
          publicKey: existingEscrow[0].public_key,
          secretKey: existingEscrow[0].secret_key, // Devolver la clave secreta solo para fines de visualización única
          stellarNetwork: STELLAR_NETWORK
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // --- Generar nuevo Keypair para la Bóveda ---
    const pair = Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();

    // --- Fondear cuenta con Friendbot (solo en Testnet) ---
    if (STELLAR_NETWORK === "TESTNET") {
      console.log(`Fondeando cuenta de escrow ${publicKey} con Friendbot...`);
      const friendbotResponse = await fetch(`${FRIEND_BOT_URL}/?addr=${publicKey}`);
      const friendbotResult = await friendbotResponse.json();
      if (!friendbotResponse.ok) {
        console.error("Error de Friendbot:", friendbotResult);
        throw new Error(`Fallo al fondear la cuenta de escrow con Friendbot: ${JSON.stringify(friendbotResult)}`);
      }
      console.log("Cuenta de escrow fondeada.");
    }

    // --- Guardar en la tabla stellar_wallets ---
    const { data, error } = await supabaseClient
      .from('stellar_wallets')
      .insert([
        { public_key: publicKey, secret_key: secretKey, role: 'escrow' }
      ])
      .select()
      .single();

    if (error) throw new Error(`Error al guardar la cuenta de escrow en DB: ${error.message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Cuenta de bóveda (escrow) creada y fondeada con éxito.",
        publicKey: publicKey,
        secretKey: secretKey,
        stellarNetwork: STELLAR_NETWORK
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("ERROR EN create-escrow-account:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
})