import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HORIZON_URL = "https://horizon-testnet.stellar.org";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // IMPORTACIÓN BLINDADA
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair, Asset, TransactionBuilder, Networks, Account, Operation } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const studentId = payload.record?.id || payload.student_id;

    if (!studentId) throw new Error("student_id es requerido");

    // 1. Obtener datos del estudiante
    const { data: student } = await supabaseClient.from('students').select('*').eq('id', studentId).single();
    if (!student) throw new Error("Estudiante no encontrado");

    // 2. Generar Keypair
    const studentKeys = Keypair.random();
    
    // 3. Fondear cuenta
    console.log(`Fondeando cuenta para ${student.name}...`);
    const fundRes = await fetch(`https://friendbot.stellar.org?addr=${studentKeys.publicKey()}`);
    if (!fundRes.ok) throw new Error("Error al fondear cuenta del estudiante");

    // Esperar sincronización
    await new Promise(r => setTimeout(r, 6000));

    // 4. Obtener el emisor del token E4C para el Trustline
    const { data: issuerWallet } = await supabaseClient
      .from('stellar_wallets')
      .select('public_key')
      .eq('role', 'issuer')
      .limit(1)
      .single();

    if (issuerWallet) {
      console.log("Estableciendo Trustline para E4C...");
      const studentRes = await fetch(`${HORIZON_URL}/accounts/${studentKeys.publicKey()}`);
      const studentData = await studentRes.json();
      const studentAccount = new Account(studentKeys.publicKey(), studentData.sequence);
      
      const E4C_TOKEN = new Asset('E4C', issuerWallet.public_key);

      const txTrust = new TransactionBuilder(studentAccount, {
        fee: '1000',
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(Operation.changeTrust({ asset: E4C_TOKEN }))
        .setTimeout(30)
        .build();

      txTrust.sign(studentKeys);
      await fetch(`${HORIZON_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ tx: txTrust.toXDR() }).toString()
      });
      console.log("Trustline OK.");
    }

    // 5. Guardar datos
    await supabaseClient.from('students').update({ stellar_public_key: studentKeys.publicKey() }).eq('id', studentId);
    await supabaseClient.from('stellar_wallets').insert([{
      student_id: studentId,
      public_key: studentKeys.publicKey(),
      secret_key: studentKeys.secret(),
      role: 'student'
    }]);

    return new Response(JSON.stringify({
      success: true,
      publicKey: studentKeys.publicKey(),
      secretKey: studentKeys.secret()
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("ERROR WALLET:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
