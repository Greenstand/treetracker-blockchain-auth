# This is a Backend Bridge

The **Backend Bridge** is a secure linking layer that connects a **Keycloak Identity Provider** with the **Hyperledger Fabric blockchain identity system** (Fabric CA & Wallet). It authenticates users via **JWT tokens** from Keycloak, manages their registration and enrollment with **Fabric CA**, and securely stores identities in a **Fabric Wallet**.

## Table of Contents
- [Role & Purpose](#role--purpose)
- [Architecture](#architecture)
- [System Overview](#system--overview)

## Role & Purpose

The Backend Bridge facilitates seamless integration between Keycloak and Hyperledger Fabric by:

| Feature             | Description                                                                |
|---------------------|---------------------------------------------------------------------------|
| 🛂 **Authenticate** | Verifies JWT tokens issued by Keycloak.                                    |
| 🧾 **Authorize**    | Extracts roles (e.g., `planter`, `verifier`) from Keycloak claims.         |
| 📜 **Register**     | Registers users in Fabric CA if not already enrolled.                      |
| 📥 **Enroll**       | Retrieves signed X.509 certificates from Fabric CA.                        |
| 🔐 **Store**        | Saves identities (certificate + private key) to a Fabric Wallet (file/KMS).|

## Architecture

```plaintext
             +------------+      JWT       +------------------+
   [User] -->| Frontend   |  ------------> |  Backend Bridge  |
             +------------+                +------------------+
                                                    |
                              +---------------------+---------------------+
                              |                     |                     |
                         +---------+          +-------------+       +-------------+
                         | Keycloak|          | Fabric CA   |       | Fabric Wallet|
                         +---------+          +-------------+       +-------------+

```
---

## 🧭 System Overview

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Frontend
    participant Backend Bridge
    participant Keycloak
    participant Fabric Wallet
    participant Fabric CA

    User->>Frontend: Login via Keycloak
    Frontend->>Keycloak: Redirect for authentication
    Keycloak-->>Frontend: Returns JWT token
    Frontend->>Backend Bridge: Sends JWT (Authorization: Bearer <token>)
    Backend Bridge->>Keycloak: Verify JWT using JWKS
    alt Identity not in Fabric Wallet
        Backend Bridge->>Fabric CA: Register & Enroll user
        Fabric CA-->>Backend Bridge: Returns signed cert
        Backend Bridge->>Fabric Wallet: Store identity
    end
    Backend Bridge-->>Frontend: Success + Identity reference


