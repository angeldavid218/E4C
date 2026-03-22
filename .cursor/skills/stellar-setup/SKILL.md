# Stellar Smart Contract Setup Skill

Este skill guía a la IA para configurar un entorno de Soroban/Stellar.

## Pasos de Configuración
1. **Instalar Rust:** Verificar si `rustup` está instalado.
2. **Agregar Target WASM:** Ejecutar `rustup target add wasm32v1-none`.
3. **Instalar Stellar CLI:** Usar `cargo install --locked stellar-cli`.
4. **Inicializar Proyecto:** Ejecutar `stellar contract init [nombre-proyecto]`.
5. **Configurar Identidad:** Generar claves con `stellar keys generate --global alice --network testnet`.

## Reglas de Código (Soroban)
- Todos los contratos deben empezar con `#![no_std]`.
- Usar el macro `#[contract]` para definir el contrato principal.
- Usar `#[contractimpl]` para la implementación de funciones.