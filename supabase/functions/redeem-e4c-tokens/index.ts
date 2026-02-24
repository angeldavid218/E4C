import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { v4 as uuidv4 } from "https://deno.land/std@0.203.0/uuid/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const E4C_ESCROW_ACCOUNT_PUBLIC_KEY = Deno.env.get("E4C_ESCROW_ACCOUNT_PUBLIC_KEY");

Deno.serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Importación dinámica de Stellar
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair, Asset, TransactionBuilder, Networks, Account, Operation } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    )

    const { studentId, amount, rewardId } = await req.json();
    
    // Validaciones iniciales
    if (!studentId || !amount || !rewardId) throw new Error("Datos de canje incompletos");
    if (!E4C_ESCROW_ACCOUNT_PUBLIC_KEY) throw new Error("La clave pública de la bóveda (E4C_ESCROW_ACCOUNT_PUBLIC_KEY) no está configurada en Supabase.");

    console.log(`Iniciando canje: Alumno ${studentId} -> ${amount} E4C`);

    // --- PASO 1: Obtener Wallet del Alumno ---
    const { data: studentWallet, error: walletError } = await supabaseClient
      .from('stellar_wallets')
      .select('secret_key, public_key')
      .eq('student_id', studentId) // Corrected from owner_id to student_id
      .eq('role', 'student')
      .single();

    if (walletError || !studentWallet?.secret_key) {
      throw new Error("No se encontró la wallet del estudiante o su clave secreta.");
    }

    const studentKeys = Keypair.fromSecret(studentWallet.secret_key);

    // --- PASO 2: Obtener Emisor del Activo E4C ---
    const { data: issuerWallet, error: issuerError } = await supabaseClient
      .from('stellar_wallets')
      .select('public_key')
      .eq('role', 'issuer')
      .limit(1)
      .single();

    if (issuerError || !issuerWallet?.public_key) {
      throw new Error("No se pudo encontrar la clave pública del emisor E4C.");
    }
    const E4C_ASSET = new Asset('E4C', issuerWallet.public_key);

    // --- PASO 3: Construir Transacción Stellar ---
    const studentAccountResponse = await fetch(`${HORIZON_URL}/accounts/${studentKeys.publicKey()}`);
    if (!studentAccountResponse.ok) throw new Error("La cuenta de Stellar del alumno no existe o no tiene saldo.");
    
    const studentAccountData = await studentAccountResponse.json();
    const sourceAccount = new Account(studentKeys.publicKey(), studentAccountData.sequence);

    const transactionMemo = uuidv4(); // Este será nuestro voucher_uuid

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: '1000',
      networkPassphrase: Networks.TESTNET
    })
      .addOperation(Operation.payment({
        destination: E4C_ESCROW_ACCOUNT_PUBLIC_KEY,
        asset: E4C_ASSET,
        amount: amount.toString(),
      }))
      .addMemo(StellarBase.Memo.text(transactionMemo.substring(0, 28))) // El memo text tiene límite de 28 bytes
      .setTimeout(30)
      .build();

    // --- PASO 4: Firmar y Enviar a Stellar ---
    transaction.sign(studentKeys);
    
    const submitResponse = await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: transaction.toXDR() }).toString()
    });

    const result = await submitResponse.json();

    if (!submitResponse.ok) {
      throw new Error(`Error en Stellar: ${result.detail || "Transacción fallida"}`);
    }

    // --- PASO 5: Actualizar Base de Datos (Atomic RPC) ---
    // Ajustado a los nombres de parámetros que creamos en el SQL anterior
    const { error: rpcError } = await supabaseClient.rpc('decrement_student_tokens', { 
      user_id: studentId, 
      amount_to_decrement: amount 
    });

    if (rpcError) {
      console.error("Error crítico: Tokens enviados por Stellar pero fallo actualización en DB:", rpcError);
      // Aquí podrías decidir si registrar un log de error grave
    }

    // --- PASO 6: Registrar el Canje en la tabla 'redeems' ---
    const { error: redeemRecordError } = await supabaseClient
      .from('redeems')
      .insert({
        student_id: studentId,
        reward_id: rewardId,
        amount: amount,
        stellar_tx_hash: result.hash,
        voucher_uuid: transactionMemo,
        status: 'completed' 
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        hash: result.hash, 
        voucher_uuid: transactionMemo, 
        message: "Canje exitoso en Blockchain y base de datos" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("ERROR EN PROCESO DE CANJE:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
})