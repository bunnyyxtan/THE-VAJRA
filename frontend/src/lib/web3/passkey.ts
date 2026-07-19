/**
 * WebAuthn passkey registration ceremony (web only).
 *
 * Runs navigator.credentials.create with an ES256 (P-256) credential, parses
 * the attestation object's authenticator data with a minimal CBOR reader, and
 * extracts exactly what VajraNativeV1.registerPasskey stores:
 *
 *   qx, qy            P-256 public key coordinates (from the COSE key)
 *   credentialIdHash  keccak256 of the raw credential ID
 *   rpIdHash          the authenticator data's first word (SHA-256 of the RP ID)
 *                     — the contract compares this against future assertions
 *
 * The contract accepts the key without onchain attestation because the wallet
 * transaction itself authorizes the binding (blueprint §12); this module still
 * verifies the registration response structure locally so malformed data is
 * never registered. Nothing here fakes a credential: if WebAuthn is
 * unavailable or the user declines, this throws and the UI shows the
 * designed fallback.
 */

import { Platform } from 'react-native';
import { keccak256, toHex, type Address, type Hex } from 'viem';
import { VajraError } from './errors';
import type { Bytes32 } from './vajra/types';

export interface RegisteredPasskeyMaterial {
  qx: Bytes32;
  qy: Bytes32;
  credentialIdHash: Bytes32;
  rpIdHash: Bytes32;
  /** Raw credential ID, base64url — local display only, never sent onchain. */
  credentialId: string;
}

// ---------------------------------------------------------------------------
// Minimal CBOR reader (only what attestation objects and COSE keys need)
// ---------------------------------------------------------------------------

class CborReader {
  private view: DataView;
  private offset = 0;

  constructor(private bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  done(): boolean {
    return this.offset >= this.bytes.length;
  }

  private readUint(additional: number): bigint {
    if (additional < 24) return BigInt(additional);
    if (additional === 24) return BigInt(this.view.getUint8(this.offset++));
    if (additional === 25) {
      const v = this.view.getUint16(this.offset, false);
      this.offset += 2;
      return BigInt(v);
    }
    if (additional === 26) {
      const v = this.view.getUint32(this.offset, false);
      this.offset += 4;
      return BigInt(v);
    }
    if (additional === 27) {
      const v = this.view.getBigUint64(this.offset, false);
      this.offset += 8;
      return v;
    }
    throw new Error('Unsupported CBOR additional information.');
  }

  private readLength(additional: number): number {
    const len = this.readUint(additional);
    if (len > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('CBOR length too large.');
    return Number(len);
  }

  read(): unknown {
    const initial = this.view.getUint8(this.offset++);
    const major = initial >> 5;
    const additional = initial & 0x1f;
    switch (major) {
      case 0:
        return this.readUint(additional);
      case 1:
        return -1n - this.readUint(additional);
      case 2: {
        const len = this.readLength(additional);
        const out = this.bytes.slice(this.offset, this.offset + len);
        this.offset += len;
        return out;
      }
      case 3: {
        const len = this.readLength(additional);
        const out = new TextDecoder().decode(this.bytes.slice(this.offset, this.offset + len));
        this.offset += len;
        return out;
      }
      case 4: {
        const len = this.readLength(additional);
        const arr: unknown[] = [];
        for (let i = 0; i < len; i++) arr.push(this.read());
        return arr;
      }
      case 5: {
        const len = this.readLength(additional);
        const map = new Map<unknown, unknown>();
        for (let i = 0; i < len; i++) {
          const key = this.read();
          map.set(key, this.read());
        }
        return map;
      }
      case 6:
        return this.read(); // tag: read the tagged value, ignore the tag
      case 7:
        if (additional === 20) return false;
        if (additional === 21) return true;
        if (additional === 22) return null;
        throw new Error('Unsupported CBOR simple value.');
      default:
        throw new Error('Invalid CBOR major type.');
    }
  }
}

function asBytes(value: unknown, what: string): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error(`Attestation ${what} is not a byte string.`);
  return value;
}

function asBytes32(value: unknown, what: string): Bytes32 {
  const bytes = asBytes(value, what);
  if (bytes.length !== 32) throw new Error(`Attestation ${what} must be 32 bytes.`);
  return toHex(bytes) as Bytes32;
}

// ---------------------------------------------------------------------------
// Attestation parsing
// ---------------------------------------------------------------------------

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;
const FLAG_ATTESTED_CREDENTIAL_DATA = 0x40;

interface ParsedAttestation {
  credentialId: Uint8Array;
  qx: Bytes32;
  qy: Bytes32;
  rpIdHash: Bytes32;
}

/**
 * Parses an attestationObject: extracts authData, checks UP/UV/AT flags,
 * then reads the attested credential data (AAGUID, credential ID, COSE key).
 * Rejects anything malformed or any non-ES256 credential — fail closed.
 */
function parseAttestationObject(attestationObject: ArrayBuffer): ParsedAttestation {
  let top: unknown;
  try {
    top = new CborReader(new Uint8Array(attestationObject)).read();
  } catch (err) {
    throw new VajraError('PAYLOAD_INVALID', `The passkey attestation is not valid CBOR.`, err);
  }
  if (!(top instanceof Map)) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey attestation has an unexpected structure.');
  }
  const authData = top.get('authData');
  if (!(authData instanceof Uint8Array) || authData.length < 37 + 16 + 2 + 64) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey attestation is missing authenticator data.');
  }

  const flags = authData[32];
  if ((flags & FLAG_USER_PRESENT) === 0 || (flags & FLAG_USER_VERIFIED) === 0) {
    throw new VajraError(
      'PAYLOAD_INVALID',
      'The passkey ceremony did not confirm user presence and verification.',
    );
  }
  if ((flags & FLAG_ATTESTED_CREDENTIAL_DATA) === 0) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey attestation carries no credential data.');
  }

  const rpIdHash = toHex(authData.slice(0, 32)) as Bytes32;
  const credIdLen = (authData[53] << 8) | authData[54];
  const credIdStart = 55;
  const credIdEnd = credIdStart + credIdLen;
  if (credIdEnd > authData.length) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey credential ID is truncated.');
  }
  const credentialId = authData.slice(credIdStart, credIdEnd);

  let coseKey: unknown;
  try {
    coseKey = new CborReader(authData.slice(credIdEnd)).read();
  } catch (err) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey public key is not valid COSE/CBOR.', err);
  }
  if (!(coseKey instanceof Map)) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey public key has an unexpected structure.');
  }
  // COSE: 1 = kty (must be 2, EC2), 3 = alg (must be -7, ES256), -1 = crv (must be 1, P-256)
  if (coseKey.get(1n) !== 2n || coseKey.get(3n) !== -7n || coseKey.get(-1n) !== 1n) {
    throw new VajraError(
      'PAYLOAD_INVALID',
      'The passkey is not an ES256 (P-256) credential. Vajra requires P-256.',
    );
  }
  const qx = asBytes32(coseKey.get(-2n), 'public key x coordinate');
  const qy = asBytes32(coseKey.get(-3n), 'public key y coordinate');

  return { credentialId, qx, qy, rpIdHash };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** True only where a real WebAuthn ceremony can run (secure-context web). */
export function isWebAuthnAvailable(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    window.isSecureContext === true
  );
}

/**
 * Runs the real WebAuthn registration ceremony and returns the onchain
 * registration material. Throws VajraError WALLET_UNAVAILABLE when WebAuthn
 * is unsupported, WALLET_REJECTED when the user declines, PAYLOAD_INVALID
 * when the authenticator returns something malformed.
 */
export async function createPasskeyCredential(owner: Address): Promise<RegisteredPasskeyMaterial> {
  if (!isWebAuthnAvailable()) {
    throw new VajraError(
      'WALLET_UNAVAILABLE',
      'This browser cannot create passkeys (WebAuthn over a secure connection is required).',
    );
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const userId = new TextEncoder().encode(owner.toLowerCase());

  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge as unknown as BufferSource,
        rp: { name: 'Vajra', id: window.location.hostname },
        user: {
          id: userId as unknown as BufferSource,
          name: owner.toLowerCase(),
          displayName: 'Vajra Touch',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'preferred',
        },
        attestation: 'none',
        timeout: 60_000,
      },
    });
  } catch (err) {
    const name = (err as { name?: unknown })?.name;
    if (name === 'NotAllowedError') {
      throw new VajraError('WALLET_REJECTED', 'The passkey ceremony was declined or timed out.', err);
    }
    if (name === 'NotSupportedError' || name === 'SecurityError') {
      throw new VajraError(
        'WALLET_UNAVAILABLE',
        'This device or browser cannot create the required P-256 passkey.',
        err,
      );
    }
    throw new VajraError('UNKNOWN', 'The passkey ceremony failed unexpectedly.', err);
  }

  if (!credential || credential.type !== 'public-key') {
    throw new VajraError('WALLET_UNAVAILABLE', 'No passkey credential was created.');
  }
  const response = (credential as PublicKeyCredential).response as AuthenticatorAttestationResponse;
  if (!response || !(response.attestationObject instanceof ArrayBuffer)) {
    throw new VajraError('PAYLOAD_INVALID', 'The passkey response is missing its attestation.');
  }

  const parsed = parseAttestationObject(response.attestationObject);
  return {
    qx: parsed.qx,
    qy: parsed.qy,
    credentialIdHash: keccak256(toHex(parsed.credentialId)) as Bytes32,
    rpIdHash: parsed.rpIdHash,
    credentialId: bytesToBase64Url(parsed.credentialId),
  };
}
