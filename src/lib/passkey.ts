/**
 * utilidades de Passkey (WebAuthn) para Stellar Account Abstraction.
 * Permite registrar y autenticar usuarios usando biometría.
 */

import { Keypair } from '@stellar/stellar-sdk';

// Configuración básica para WebAuthn
const rpName = "Edu-Chain Hackathon";
const rpId = window.location.hostname;

/**
 * Genera un desafío aleatorio para WebAuthn
 */
function generateChallenge(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Registra un nuevo Passkey en el dispositivo del usuario
 */
export async function registerPasskey(email: string, name: string) {
  const challenge = generateChallenge();
  const userId = window.crypto.getRandomValues(new Uint8Array(16));

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge as unknown as BufferSource,
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: userId,
      name: email,
      displayName: name,
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }], // ES256 y RS256
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Forzar FaceID/TouchID/Windows Hello
      userVerification: "required",
      residentKey: "required",
    },
    timeout: 60000,
    attestation: "none",
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) throw new Error("No se pudo crear la credencial.");

    // En una implementación real de Soroban, enviaríamos el 'credential.response.attestationObject'
    // al contrato para registrar la clave pública.
    // Por ahora, simularemos la creación de una wallet vinculada a esta ID de credencial.
    
    console.log("Passkey registrado exitosamente:", credential.id);
    
    return {
      credentialId: credential.id,
      publicKey: (credential.response as AuthenticatorAttestationResponse).getPublicKey(),
      rawId: credential.rawId,
    };
  } catch (error) {
    console.error("Error al registrar Passkey:", error);
    throw error;
  }
}

/**
 * Firma un hash de transacción de Stellar usando el Passkey del usuario.
 * @param transactionHash El hash de la transacción a firmar.
 */
export async function signStellarTransactionWithPasskey(transactionHash: Buffer | Uint8Array) {
  const challenge = transactionHash; // Usamos el hash de la transacción como desafío

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge as unknown as BufferSource,
    rpId,
    userVerification: "required",
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion) throw new Error("No se pudo obtener la firma biométrica.");

    const response = assertion.response as AuthenticatorAssertionResponse;
    
    return {
      credentialId: assertion.id,
      signature: response.signature,
      authenticatorData: response.authenticatorData,
      clientDataJSON: response.clientDataJSON,
    };
  } catch (error) {
    console.error("Error al firmar con Passkey:", error);
    throw error;
  }
}

/**
 * Autentica al usuario usando su Passkey
 */
export async function authenticateWithPasskey() {
  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge as unknown as BufferSource,
    rpId,
    userVerification: "required",
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion) throw new Error("No se pudo obtener la aserción.");

    // La 'assertion.response.signature' sería enviada al Smart Account de Soroban
    // para validar la transacción o el login.
    console.log("Passkey autenticado:", assertion.id);

    return {
      credentialId: assertion.id,
      signature: (assertion.response as AuthenticatorAssertionResponse).signature,
      authenticatorData: (assertion.response as AuthenticatorAssertionResponse).authenticatorData,
      clientDataJSON: (assertion.response as AuthenticatorAssertionResponse).clientDataJSON,
    };
  } catch (error) {
    console.error("Error al autenticar con Passkey:", error);
    throw error;
  }
}

/**
 * Utilidad para derivar una clave de Stellar (simulada) a partir de un Passkey
 * NOTA: En producción, el Smart Account de Soroban usa directamente la clave del Passkey.
 */
export function deriveStellarAddressFromPasskey(credentialId: string): string {
  // Hash determinístico del credentialId para generar una dirección de Stellar pública
  // Esto es un puente mientras migramos a Smart Accounts nativos.
  const hash = Array.from(credentialId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = new Uint8Array(32).fill(hash % 256);
  return Keypair.fromRawEd25519Seed(Buffer.from(seed)).publicKey();
}
