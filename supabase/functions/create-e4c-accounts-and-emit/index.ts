import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";

/**
 * EDGE FUNCTION: create-e4c-accounts-and-emit
 * 
 * OBJETIVO: Inicializar la infraestructura de tokens E4C de la institución.
 * 1. Genera un par de claves para el Emisor (Issuer) y otro para el Distribuidor (Distributor).
 * 2. Activa ambas cuentas en la Testnet de Stellar mediante Friendbot.
 * 3. Define el activo (Asset) 'E4C'.
 * 4. Establece un Trustline (vínculo de confianza) en la cuenta del Distribuidor.
 * 5. Emite el primer millón de tokens desde el Emisor al Distribuidor.
 * 6. Persiste las llaves de forma segura en Supabase.
 */
Deno.serve(async (req) => {
  // Manejo de CORS Preflight para permitir llamadas desde el navegador
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // IMPORTACIÓN DINÁMICA: Usamos un bundle de navegador para evitar dependencias nativas incompatibles con Deno
    const StellarBase = await import("https://esm.sh/stellar-base@12.1.0?bundle&target=browser");
    const { Keypair, Asset, Operation, TransactionBuilder, Networks, Account } = StellarBase;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
    )

    const { adminId } = await req.json().catch(() => ({}));
    if (!adminId) throw new Error("adminId es requerido para vincular las cuentas");

    // --- PASO 1: GENERACIÓN DE IDENTIDADES CRIPTOGRÁFICAS ---
    // Creamos pares de claves aleatorios. Issuer es el "banco central", Distributor es la "caja fuerte" institucional.
    const issuer = Keypair.random();
    const distributor = Keypair.random();

    // --- PASO 2: ACTIVACIÓN EN LA RED (FUNDING) ---
    // En Stellar, una cuenta no existe hasta que tiene un balance mínimo de XLM.
    // Friendbot nos regala 10,000 XLM en Testnet para activar las cuentas.
    console.log("Activando cuentas mediante Friendbot...");
    await Promise.all([
      fetch(`https://friendbot.stellar.org?addr=${issuer.publicKey()}`),
      fetch(`https://friendbot.stellar.org?addr=${distributor.publicKey()}`)
    ]);

    // Esperamos a que los nodos de Stellar procesen las nuevas cuentas (sincronización del ledger)
    await new Promise(r => setTimeout(r, 6000));

    // --- PASO 3: DEFINICIÓN DEL ACTIVO E4C ---
    // Un activo en Stellar se define por su código (E4C) y la clave pública de quien lo emite.
    const E4C_ASSET = new Asset('E4C', issuer.publicKey());

    // --- PASO 4: ESTABLECER TRUSTLINE (VÍNCULO DE CONFIANZA) ---
    // Nadie en Stellar puede recibir un token a menos que declare explícitamente que confía en él.
    // Aquí el Distribuidor habilita la recepción del token E4C.
    const distRes = await fetch(`${HORIZON_URL}/accounts/${distributor.publicKey()}`);
    const distData = await distRes.json();
    const distAccount = new Account(distributor.publicKey(), distData.sequence);

    const txTrust = new TransactionBuilder(distAccount, { 
      fee: '1000', 
      networkPassphrase: Networks.TESTNET 
    })
      .addOperation(Operation.changeTrust({ asset: E4C_ASSET })) // Operación de confianza
      .setTimeout(30)
      .build();

    txTrust.sign(distributor); // El distribuidor autoriza la confianza
    await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: txTrust.toXDR() }).toString()
    });

    // --- PASO 4.1: ESTABLECER TRUSTLINE PARA LA CUENTA DE LA BÓVEDA (ESCROW) ---
    // La cuenta de la bóveda también debe confiar en el token E4C para poder recibirlo.
    // Obtener la clave pública y secreta de la bóveda desde la base de datos
    const { data: escrowWallet, error: escrowWalletError } = await supabaseClient
      .from('stellar_wallets')
      .select('secret_key, public_key')
      .eq('role', 'escrow') // Buscar por rol 'escrow'
      .single();

    if (escrowWalletError || !escrowWallet?.secret_key || !escrowWallet?.public_key) {
      throw new Error("No se encontró la clave pública o secreta para la bóveda con rol 'escrow' en la base de datos.");
    }
    const E4C_ESCROW_ACCOUNT_PUBLIC_KEY = escrowWallet.public_key;

    const escrowKeys = Keypair.fromSecret(escrowWallet.secret_key);

    const escrowRes = await fetch(`${HORIZON_URL}/accounts/${escrowKeys.publicKey()}`);
    if (!escrowRes.ok) {
        // Si la cuenta de la bóveda no existe, intentar crearla (similar a friendbot para testnet)
        // Esto solo es válido para testnet. En prod, las cuentas deben estar pre-financiadas.
        console.warn(`La cuenta de la bóveda ${escrowKeys.publicKey()} no existe. Intentando fondear con Friendbot (solo Testnet).`);
        await fetch(`https://friendbot.stellar.org?addr=${escrowKeys.publicKey()}`);
        await new Promise(r => setTimeout(r, 6000)); // Esperar por friendbot
        const retryEscrowRes = await fetch(`${HORIZON_URL}/accounts/${escrowKeys.publicKey()}`);
        if (!retryEscrowRes.ok) {
            throw new Error(`Fallo al activar o cargar la cuenta de la bóveda ${escrowKeys.publicKey()}.`);
        }
    }
    const escrowData = await (await fetch(`${HORIZON_URL}/accounts/${escrowKeys.publicKey()}`)).json(); // Fetch again if it was created
    const escrowAccount = new Account(escrowKeys.publicKey(), escrowData.sequence);

    const txEscrowTrust = new TransactionBuilder(escrowAccount, { 
      fee: '1000', 
      networkPassphrase: Networks.TESTNET 
    })
      .addOperation(Operation.changeTrust({ asset: E4C_ASSET }))
      .setTimeout(30)
      .build();

    txEscrowTrust.sign(escrowKeys);
    await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: txEscrowTrust.toXDR() }).toString()
    });
    console.log("Trustline establecido para la cuenta de la bóveda E4C.");

    // --- PASO 5: EMISIÓN INICIAL (MINTING) ---
    // El Issuer crea tokens de la "nada" al enviarlos a una cuenta que tiene un Trustline.
    // Enviamos 1,000,000 de E4C al Distribuidor.
    const issRes = await fetch(`${HORIZON_URL}/accounts/${issuer.publicKey()}`);
    const issData = await issRes.json();
    const issAccount = new Account(issuer.publicKey(), issData.sequence);

    const txMint = new TransactionBuilder(issAccount, { 
      fee: '1000', 
      networkPassphrase: Networks.TESTNET 
    })
      .addOperation(Operation.payment({
        destination: distributor.publicKey(),
        asset: E4C_ASSET,
        amount: '1000000' // Cantidad inicial
      }))
      .setTimeout(30)
      .build();

    txMint.sign(issuer); // El emisor autoriza la creación/pago
    await fetch(`${HORIZON_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ tx: txMint.toXDR() }).toString()
    });

    // --- PASO 6: PERSISTENCIA EN BASE DE DATOS ---
    // Guardamos las llaves en stellar_wallets. 
    // NOTA: En producción, las secret_keys deberían ir a un Vault encriptado.
    const { error: insertError } = await supabaseClient.from('stellar_wallets').insert([
      { admin_id: adminId, role: 'issuer', public_key: issuer.publicKey(), secret_key: issuer.secret() },
      { admin_id: adminId, role: 'distributor', public_key: distributor.publicKey(), secret_key: distributor.secret() }
    ]);

    if (insertError) {
      console.error("Error al insertar en stellar_wallets:", insertError.message);
      throw new Error(`Error al guardar las cuentas en la base de datos: ${insertError.message}`);
    }

    console.log("Cuentas Issuer y Distributor creadas y guardadas con éxito.");

    return new Response(
      JSON.stringify({ 
        success: true, 
        issuerPublicKey: issuer.publicKey(), 
        issuerSecretKey: issuer.secret(),
        distributorPublicKey: distributor.publicKey(),
        distributorSecretKey: distributor.secret()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("ERROR CRÍTICO INICIALIZACIÓN:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
})
