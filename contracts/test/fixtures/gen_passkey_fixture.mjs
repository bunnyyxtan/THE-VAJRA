// Generates a REAL WebAuthn assertion fixture for test/PasskeyFixture.t.sol.
// Usage: node test/fixtures/gen_passkey_fixture.mjs <requestId-0xhex>
// Uses a fixed test-only P-256 key so the fixture is reproducible. This key is
// not a secret and is used nowhere else.
import crypto from "node:crypto";

const requestId = process.argv[2];
if (!requestId || !/^0x[0-9a-fA-F]{64}$/.test(requestId)) {
  console.error("usage: node gen_passkey_fixture.mjs <requestId-0xhex>");
  process.exit(1);
}

// Fixed test-only private scalar.
const D = Buffer.from("1a2b3c4d5e6f708192a3b4c5d6e7f8090a1b2c3d4e5f60718293a4b5c6d7e8f9", "hex");

// Derive the public point from the private scalar.
const ecdh = crypto.createECDH("prime256v1");
ecdh.setPrivateKey(D);
const pub = ecdh.getPublicKey(null, "uncompressed"); // 0x04 || x || y
const x = pub.subarray(1, 33);
const y = pub.subarray(33, 65);

const privateKey = crypto.createPrivateKey({
  key: { kty: "EC", crv: "P-256", x: x.toString("base64url"), y: y.toString("base64url"), d: D.toString("base64url") },
  format: "jwk",
});

const rpId = "vajra.xyz";
const rpIdHash = crypto.createHash("sha256").update(rpId, "utf8").digest();

const challengeB64 = Buffer.from(requestId.slice(2), "hex").toString("base64url");
const clientDataJSON = JSON.stringify({ challenge: challengeB64, origin: "https://vajra.xyz", type: "webauthn.get" });
const challengeIndex = clientDataJSON.indexOf('"challenge":"');
const typeIndex = clientDataJSON.indexOf('"type":"webauthn.get"');
if (challengeIndex < 0 || typeIndex < 0) throw new Error("index computation failed");

const flags = 0x05; // UP | UV
const authenticatorData = Buffer.concat([rpIdHash, Buffer.from([flags]), Buffer.alloc(4, 0)]);

const clientHash = crypto.createHash("sha256").update(clientDataJSON, "utf8").digest();
const signedBytes = Buffer.concat([authenticatorData, clientHash]);

let sig = crypto.sign("sha256", signedBytes, { key: privateKey, dsaEncoding: "ieee-p1363" });
let r = sig.subarray(0, 32);
let s = sig.subarray(32, 64);

// Normalize to low-s (OpenZeppelin P256 rejects s > N/2 in its Solidity fallback).
const N = BigInt("0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
let sInt = BigInt("0x" + s.toString("hex"));
if (sInt > N / 2n) {
  sInt = N - sInt;
  s = Buffer.from(sInt.toString(16).padStart(64, "0"), "hex");
}

// Sanity: verify the (possibly low-s-flipped) signature locally before printing.
const ok = crypto.verify(
  "sha256",
  signedBytes,
  { key: crypto.createPublicKey({ key: { kty: "EC", crv: "P-256", x: x.toString("base64url"), y: y.toString("base64url") }, format: "jwk" }), dsaEncoding: "ieee-p1363" },
  Buffer.concat([r, s])
);
if (!ok) throw new Error("self-verification failed");

const hx = (b) => "0x" + Buffer.from(b).toString("hex");
console.log("QX =", hx(x));
console.log("QY =", hx(y));
console.log("RP_ID_HASH =", hx(rpIdHash));
console.log("AUTH_DATA =", hx(authenticatorData));
console.log("CLIENT_DATA_JSON =", hx(Buffer.from(clientDataJSON, "utf8")));
console.log("CHALLENGE_INDEX =", challengeIndex);
console.log("TYPE_INDEX =", typeIndex);
console.log("R =", hx(r));
console.log("S =", hx(s));
console.log("CLIENT_DATA_JSON_STR =", clientDataJSON);
