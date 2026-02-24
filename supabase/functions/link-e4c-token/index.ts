import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";

/**
 * EDGE FUNCTION: link-e4c-token
 * 
 * OBJETIVO: Permitir que un alumno habilite el token E4C en su billetera (Trustline).
 * 
 * POR QUÉ ES NECESARIO:
 * En Stellar, no puedes enviar un activo personalizado a alguien que no ha dicho
 * que "confía" en él. Esto previene el spam de tokens basura.
 * Esta función es una herramienta de "autocorrección" para alumnos antiguos 
 * o procesos que fallaron inicialmente.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair, Asset, TransactionBuilder, Networks, Account, Operation } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    )

    const { studentId } = await req.json();
    if (!studentId) throw new Error("ID de alumno no proporcionado");

    // --- PASO 1: RECUPERAR IDENTIDAD DEL ALUMNO ---
    const { data: wallet } = await supabaseClient
      .from('stellar_wallets')
      .select('secret_key, public_key')
      .eq('student_id', studentId)
      .single();

    if (!wallet?.secret_key) throw new Error("No se encontró la llave privada para autorizar la vinculación");

    const studentKeys = Keypair.fromSecret(wallet.secret_key);

    // --- PASO 2: RECUPERAR IDENTIDAD DEL TOKEN ---
    const { data: issuerWallet } = await supabaseClient
      .from('stellar_wallets')
      .select('public_key')
      .eq('role', 'issuer')
      .limit(1)
      .single();

    if (!issuerWallet) throw new Error("El sistema de tokens no ha sido inicializado por el Admin");

    const E4C_TOKEN = new Asset('E4C', issuerWallet.public_key);

    // --- PASO 3: REGISTRAR CONFIANZA (CHANGE TRUST) ---
    // Obtenemos la secuencia actual de la cuenta del alumno.
    const res = await fetch(`${HORIZON_URL}/accounts/${studentKeys.publicKey()}`);
    const data = await res.json();
    const account = new Account(studentKeys.publicKey(), data.sequence);

    // Creamos la operación 'changeTrust'.
    // Esto reserva 0.5 XLM en la cuenta del alumno (es el costo base de Stellar por cada Trustline).
    const tx = new TransactionBuilder(account, { 
      fee: '1000', 
      networkPassphrase: Networks.TESTNET 
    })
      .addOperation(Operation.changeTrust({ asset: E4C_TOKEN }))
      .setTimeout(30)
      .build();

    // El ALUMNO firma la transacción (él es quien declara la confianza).
    tx.sign(studentKeys);
    
    // Enviamos a Stellar.
    const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: tx.toXDR() }).toString()
    });

    if (!submitRes.ok) throw new Error("Fallo al registrar la confianza en Stellar");

    return new Response(
      JSON.stringify({ success: true, message: "Token E4C vinculado con éxito" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
})
