#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype, token, Address, BytesN, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AccError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidSignature = 3,
    TokenAddressNotFound = 4,
}

#[contracttype]
pub enum DataKey {
    // Almacenamos la clave pública derivada del Passkey
    PasskeyId,
    // Dirección del contrato SAC del token E4C
    E4cTokenAddress,
}

#[contract]
pub struct EduAccountContract;

#[contractimpl]
impl EduAccountContract {
    /// Inicializa la Smart Account vinculándola a una credencial de Passkey y al token E4C.
    /// Esta función solo puede ser llamada una vez.
    pub fn init(env: Env, passkey_id: BytesN<32>, e4c_address: Address) -> Result<(), AccError> {
        if env.storage().instance().has(&DataKey::PasskeyId) {
            return Err(AccError::AlreadyInitialized);
        }
        
        env.storage()
            .instance()
            .set(&DataKey::PasskeyId, &passkey_id);
            
        // Registramos la dirección del token E4C para que la cuenta sepa qué token manejar
        env.storage()
            .instance()
            .set(&DataKey::E4cTokenAddress, &e4c_address);
            
        Ok(())
    }

    /// Retorna la ID del Passkey asociado a esta cuenta
    pub fn get_passkey_id(env: Env) -> Result<BytesN<32>, AccError> {
        env.storage()
            .instance()
            .get(&DataKey::PasskeyId)
            .ok_or(AccError::NotInitialized)
    }

    /// Consulta el saldo de E4C de esta Smart Account.
    /// Al ser un contrato Soroban, el balance se consulta usando el cliente Token SAC.
    pub fn get_e4c_balance(env: Env) -> Result<i128, AccError> {
        // Recuperar la dirección del token configurada en el init
        let e4c_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::E4cTokenAddress)
            .ok_or(AccError::TokenAddressNotFound)?;

        // Crear un cliente para interactuar con el token
        let token_client = token::Client::new(&env, &e4c_address);
        
        // El balance que pertenece a este contrato (la cuenta del alumno)
        let my_address = env.current_contract_address();
        
        Ok(token_client.balance(&my_address))
    }
}

// Implementación de la interfaz CustomAccount para Account Abstraction
#[contractimpl]
impl CustomAccountInterface for EduAccountContract {
    type Signature = BytesN<64>; // Firma criptográfica (Ed25519 en este MVP)
    type Error = AccError;

    /// Función central que Soroban llama para verificar la autorización de una transacción.
    fn __check_auth(
        env: Env,
        signature_payload: soroban_sdk::crypto::Hash<32>,
        signature: Self::Signature,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), AccError> {
        // 1. Obtener la clave pública registrada en la inicialización
        let passkey_id: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::PasskeyId)
            .ok_or(AccError::NotInitialized)?;

        // 2. Verificar la firma usando las utilidades criptográficas de Soroban
        // Convertimos el Hash<32> a Bytes para la verificación
        let payload_bytes = signature_payload.into();
        
        env.crypto()
            .ed25519_verify(&passkey_id, &payload_bytes, &signature);
            
        // Si la verificación falla, ed25519_verify hace 'panic'.
        Ok(())
    }
}