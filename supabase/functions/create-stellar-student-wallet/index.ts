import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as StellarSdk from 'https://esm.sh/stellar-sdk@12.3.0';

const horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function fundWithFriendbot(publicKey: string) {
  try {
    await horizonServer.friendbot(publicKey).call();
    console.log("SUCCESS! Stellar Testnet account funded.");
  } catch (e) {
    console.error("ERROR! Failed to fund Stellar Testnet account:", e);
    throw new Error("Failed to fund Stellar Testnet account.");
  }
}

serve(async (req) => {
  // Handle OPTIONS preflight request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let studentId: string;
    let newStudent: any;

    try {
      const payload = await req.json();
      if (payload.record && payload.record.id) {
        // Webhook payload structure
        studentId = payload.record.id;
        newStudent = payload.record;
      } else if (payload.student_id) {
        // Direct call structure (e.g., from another Edge Function)
        studentId = payload.student_id;
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (error || !data) {
          console.error("Error fetching student for direct call:", error);
          return new Response(JSON.stringify({ error: "Student not found or failed to fetch." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        newStudent = data;
      } else {
        return new Response(JSON.stringify({ error: "Invalid payload: missing 'record.id' or 'student_id'." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("Error parsing request payload:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!newStudent || !newStudent.id || !newStudent.name || !newStudent.email) {
      return new Response(JSON.stringify({ error: "Invalid student data received." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deconstruct student data from newStudent (which could be from webhook or direct fetch)
    const { name, email, curso, division, escuela } = newStudent;


    // 1. Create a new Stellar keypair
    const masterKeypair = StellarSdk.Keypair.random();
    const masterPublicKey = masterKeypair.publicKey();
    const masterSecret = masterKeypair.secret();

    const deviceKeypair = StellarSdk.Keypair.random();
    const devicePublicKey = deviceKeypair.publicKey();
    const deviceSecret = deviceKeypair.secret();

    const recoverySigner1Keypair = StellarSdk.Keypair.random();
    const recoverySigner1PublicKey = recoverySigner1Keypair.publicKey();

    const recoverySigner2Keypair = StellarSdk.Keypair.random();
    const recoverySigner2PublicKey = recoverySigner2Keypair.publicKey();

    // 2. Fund the new account
    await fundWithFriendbot(masterPublicKey);

    // 3. Configure multi-signature
    try {
      const account = await horizonServer.loadAccount(masterPublicKey);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE
      })
        .addOperation(StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: devicePublicKey,
            weight: 1
          }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: recoverySigner1PublicKey,
            weight: 1
          }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: recoverySigner2PublicKey,
            weight: 1
          }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
          masterWeight: 0, // "Secure erase" the master key
          lowThreshold: 1, // Device key alone can perform low-security operations
          mediumThreshold: 2, // Device + 1 Recovery, or 2 Recovery
          highThreshold: 2 // Device + 1 Recovery, or 2 Recovery
        }))
        .setTimeout(30)
        .build();

      transaction.sign(masterKeypair); // Sign with the master key
      await horizonServer.submitTransaction(transaction);
      console.log("Multi-signature configured successfully.");
    } catch (e) {
      console.error("ERROR! Failed to configure multi-signature:", e);
      throw new Error("Failed to configure multi-signature.");
    }

    // 4. Update the existing student row with the stellar_public_key
    const { error: updateError } = await supabaseClient
      .from('students')
      .update({ stellar_public_key: masterPublicKey })
      .eq('id', studentId);

    if (updateError) {
      console.error("Supabase student update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update student with Stellar public key." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Store the Stellar public key and signers info securely in 'stellar_wallets' table
    const { error: walletError } = await supabaseClient
      .from('stellar_wallets')
      .insert([{
        student_id: studentId,
        public_key: masterPublicKey,
        signers_info: {
          device_public_key: devicePublicKey,
          recovery_signer_1_public_key: recoverySigner1PublicKey,
          recovery_signer_2_public_key: recoverySigner2PublicKey,
        }
      }]);

    if (walletError) {
      console.error("Supabase wallet insertion error:", walletError);
      // NOTE: Student is already created, so we don't roll back.
      return new Response(JSON.stringify({ error: "Failed to securely store Stellar wallet secret." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the updated student data (or a success message)
    return new Response(JSON.stringify({
      message: "Stellar wallet created and linked successfully for student",
      student_id: studentId,
      stellar_public_key: masterPublicKey,
      device_secret_key: deviceSecret, // Return device secret key for local storage
    }), {
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
