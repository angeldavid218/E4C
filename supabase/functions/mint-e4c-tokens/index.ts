import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // IMPORTACIÓN BLINDADA
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair, Asset, Operation, TransactionBuilder, Networks, Account } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
    )

    const { adminId, amount } = await req.json().catch(() => ({}));
    if (!adminId || !amount) throw new Error("adminId y amount son requeridos");

    // Obtener emisor y distribuidor
    const { data: wallets } = await supabaseClient
      .from('stellar_wallets')
      .select('*')
      .eq('admin_id', adminId);

    const issuerWallet = wallets?.find(w => w.role === 'issuer');
    const distWallet = wallets?.find(w => w.role === 'distributor');

    if (!issuerWallet || !distWallet) throw new Error("Cuentas no encontradas");

    const issuerKeys = Keypair.fromSecret(issuerWallet.secret_key);

    // Emisión
    const issRes = await fetch(`${HORIZON_URL}/accounts/${issuerKeys.publicKey()}`);
    const issData = await issRes.json();
    const issAccount = new Account(issuerKeys.publicKey(), issData.sequence);

    const E4C_ASSET = new Asset('E4C', issuerKeys.publicKey());

    const txMint = new TransactionBuilder(issAccount, { 
      fee: '1000', 
      networkPassphrase: Networks.TESTNET 
    })
      .addOperation(Operation.payment({
        destination: distWallet.public_key,
        asset: E4C_ASSET,
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();

    txMint.sign(issuerKeys);
    
    await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: txMint.toXDR() }).toString()
    });

    return new Response(
      JSON.stringify({ success: true, message: `${amount} E4C emitidos` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
})
