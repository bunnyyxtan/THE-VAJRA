// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {SignatureChecker} from "openzeppelin-contracts/contracts/utils/cryptography/SignatureChecker.sol";
import {WebAuthn} from "openzeppelin-contracts/contracts/utils/cryptography/WebAuthn.sol";

/// @title VajraNativeV1
/// @notice Recipient-authenticated one-time native-MON payment requests on Monad mainnet.
/// @dev Implements the Vajra PRD/TRD/Security Blueprint v1.0, sections 11-14.
///      Non-upgradeable. No owner, no roles, no fees, no pause, no delegatecall,
///      no token approvals, no user-balance accounting, no admin sweep.
contract VajraNativeV1 is ReentrancyGuard {
    // ------------------------------------------------------------------
    // Enums (blueprint section 11)
    // ------------------------------------------------------------------

    enum AuthMode {
        Wallet,
        Passkey
    }

    enum RequestStatus {
        Unused,
        Paid,
        Revoked
    }

    /// @dev Validation codes returned by {inspect} (blueprint Appendix B).
    enum ValidationCode {
        Valid,
        ZeroRecipient,
        ZeroAmount,
        InvalidNonce,
        InvalidTimeWindow,
        Expired,
        AlreadyPaid,
        Revoked,
        WrongPayer,
        InactivePasskey,
        WrongPasskeyVersion,
        InvalidWalletSignature,
        InvalidPasskeyProof,
        IncorrectValue
    }

    // ------------------------------------------------------------------
    // Structs (blueprint section 11)
    // ------------------------------------------------------------------

    struct PaymentRequest {
        address recipient;
        address payer; // zero address = any payer
        uint256 amount; // wei
        uint64 issuedAt;
        uint64 expiresAt;
        bytes32 nonce;
        bytes32 memoHash;
        AuthMode authMode;
        uint32 authVersion; // 0 for wallet mode; active key version for passkey mode
    }

    struct PasskeyCredential {
        bytes32 qx;
        bytes32 qy;
        bytes32 credentialIdHash;
        bytes32 rpIdHash;
        uint32 version;
        bool active;
    }

    struct Settlement {
        address payer;
        address recipient;
        uint256 amount;
        uint64 paidAt;
        bytes32 memoHash;
        AuthMode authMode;
        uint32 authVersion;
    }

    /// @dev Authentication evidence presented at fulfillment time.
    ///      Wallet mode: only `signature` is used (EIP-712 signature by the recipient,
    ///      EOA or ERC-1271). Passkey mode: the WebAuthn assertion fields are used.
    ///      challengeIndex / typeIndex are byte-offset hints into clientDataJSON that
    ///      are validated onchain; a wrong hint simply fails verification.
    struct AuthProof {
        bytes signature;
        bytes authenticatorData;
        bytes clientDataJSON;
        uint256 challengeIndex;
        uint256 typeIndex;
        bytes32 r;
        bytes32 s;
    }

    // ------------------------------------------------------------------
    // Custom errors (blueprint section 13)
    // ------------------------------------------------------------------

    error ZeroRecipient();
    error ZeroAmount();
    error InvalidNonce();
    error MemoTooLong();
    error InvalidTimeWindow();
    error RequestExpired();
    error RequestAlreadyPaid();
    error RequestRevoked();
    error WrongPayer(address expected, address actual);
    error InvalidWalletSignature();
    error InvalidPasskeyProof();
    error InactivePasskey();
    error WrongPasskeyVersion(uint32 expected, uint32 actual);
    error IncorrectValue(uint256 expected, uint256 actual);
    error NativeTransferFailed();
    error DirectPaymentsDisabled();

    // ------------------------------------------------------------------
    // Events (blueprint section 14)
    // ------------------------------------------------------------------

    event PasskeyRegistered(address indexed recipient, uint32 indexed version, bytes32 credentialIdHash, bytes32 rpIdHash);
    event PasskeyRotated(address indexed recipient, uint32 indexed version, bytes32 credentialIdHash, bytes32 rpIdHash);
    event PasskeyDeactivated(address indexed recipient, uint32 indexed version);
    event PaymentFulfilled(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint64 paidAt,
        bytes32 memoHash,
        AuthMode authMode,
        uint32 authVersion
    );
    event PaymentRevoked(bytes32 indexed requestId, address indexed recipient, uint64 revokedAt);

    // ------------------------------------------------------------------
    // Constants
    // ------------------------------------------------------------------

    /// @dev Blueprint FR-004: request lifetime must be at least 60 seconds and at most 30 days.
    uint64 public constant MIN_LIFETIME = 60 seconds;
    uint64 public constant MAX_LIFETIME = 30 days;

    /// @dev Maximum tolerated clock skew for `issuedAt` lying in the future.
    uint64 public constant MAX_FUTURE_SKEW = 5 minutes;

    /// @dev Blueprint FR-005: memo limited to 96 UTF-8 bytes after normalization.
    uint256 public constant MAX_MEMO_BYTES = 96;

    /// @dev Explicit bounded limits for decoded WebAuthn proof components (blueprint section 17).
    uint256 public constant MAX_AUTHENTICATOR_DATA_BYTES = 1024;
    uint256 public constant MAX_CLIENT_DATA_JSON_BYTES = 1024;

    /// @dev EIP-712 domain (blueprint Appendix A). Name "Vajra", version "1",
    ///      chainId and verifyingContract bound at deployment.
    bytes32 private constant _DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant _NAME_HASH = keccak256(bytes("Vajra"));
    bytes32 private constant _VERSION_HASH = keccak256(bytes("1"));

    /// @dev EIP-712 typehash for the canonical payment request (blueprint Appendix A).
    bytes32 public constant PAYMENT_REQUEST_TYPEHASH = keccak256(
        "PaymentRequest(address recipient,address payer,uint256 amount,uint64 issuedAt,uint64 expiresAt,bytes32 nonce,bytes32 memoHash,uint8 authMode,uint32 authVersion)"
    );

    bytes32 private immutable _DOMAIN_SEPARATOR;

    // ------------------------------------------------------------------
    // Storage (blueprint section 11)
    // ------------------------------------------------------------------

    mapping(bytes32 requestId => RequestStatus) public statusOf;
    mapping(bytes32 requestId => Settlement) public settlementOf;
    mapping(address recipient => PasskeyCredential) public passkeyOf;

    constructor() {
        _DOMAIN_SEPARATOR = keccak256(abi.encode(_DOMAIN_TYPEHASH, _NAME_HASH, _VERSION_HASH, block.chainid, address(this)));
    }

    // ------------------------------------------------------------------
    // Hashing
    // ------------------------------------------------------------------

    /// @notice The EIP-712 domain separator bound at deployment.
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }

    /// @notice Canonical request identifier (blueprint section 11, Appendix A).
    function requestId(PaymentRequest calldata request) external view returns (bytes32) {
        return _requestId(request);
    }

    function _requestId(PaymentRequest calldata request) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                PAYMENT_REQUEST_TYPEHASH,
                request.recipient,
                request.payer,
                request.amount,
                request.issuedAt,
                request.expiresAt,
                request.nonce,
                request.memoHash,
                request.authMode,
                request.authVersion
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, structHash));
    }

    /// @notice Hash a plaintext memo for use in a request. Reverts if the normalized
    ///         memo exceeds 96 bytes (blueprint FR-005). Normalization (NFC) happens offchain.
    function memoHashOf(bytes calldata memo) external pure returns (bytes32) {
        if (memo.length > MAX_MEMO_BYTES) revert MemoTooLong();
        return keccak256(memo);
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /// @notice Dry-run validation for a prospective payer (blueprint section 11, Appendix B).
    /// @dev The msg.value check is skipped here because `inspect` is a non-payable view;
    ///      `fulfill` enforces exact value at payment time. Validation order matches
    ///      the fulfillment order in blueprint section 13.
    function inspect(
        PaymentRequest calldata request,
        AuthProof calldata proof,
        address prospectivePayer
    ) external view returns (bytes32 id, ValidationCode code) {
        return _validate(request, proof, prospectivePayer, 0, false);
    }

    // ------------------------------------------------------------------
    // Settlement
    // ------------------------------------------------------------------

    /// @notice Pay a request. Transfers exactly `amount` wei of native MON to the recipient.
    /// @dev Checks-effects-interactions, nonReentrant, exact msg.value (blueprint section 13).
    function fulfill(PaymentRequest calldata request, AuthProof calldata proof) external payable nonReentrant {
        (bytes32 id, ValidationCode code) = _validate(request, proof, msg.sender, msg.value, true);
        if (code != ValidationCode.Valid) _revertFor(code, request);

        statusOf[id] = RequestStatus.Paid;
        settlementOf[id] = Settlement({
            payer: msg.sender,
            recipient: request.recipient,
            amount: request.amount,
            paidAt: uint64(block.timestamp),
            memoHash: request.memoHash,
            authMode: request.authMode,
            authVersion: request.authVersion
        });

        (bool ok,) = payable(request.recipient).call{value: request.amount}("");
        if (!ok) revert NativeTransferFailed();

        emit PaymentFulfilled(
            id,
            msg.sender,
            request.recipient,
            request.amount,
            uint64(block.timestamp),
            request.memoHash,
            request.authMode,
            request.authVersion
        );
    }

    /// @notice Revoke an unused request. Callable only by the request recipient.
    function revoke(PaymentRequest calldata request) external {
        require(msg.sender == request.recipient, "Vajra: caller is not the recipient");
        bytes32 id = _requestId(request);
        RequestStatus status = statusOf[id];
        if (status == RequestStatus.Paid) revert RequestAlreadyPaid();
        if (status == RequestStatus.Revoked) revert RequestRevoked();
        statusOf[id] = RequestStatus.Revoked;
        emit PaymentRevoked(id, request.recipient, uint64(block.timestamp));
    }

    // ------------------------------------------------------------------
    // Passkey registry (blueprint section 12)
    // ------------------------------------------------------------------

    /// @notice Register a P-256 passkey for the calling recipient wallet.
    /// @dev The wallet transaction itself authorizes the binding; no onchain attestation.
    ///      Requires no currently active credential (use rotatePasskey to replace one).
    ///      Versions are monotonic per recipient so stale requests can never revive.
    function registerPasskey(bytes32 qx, bytes32 qy, bytes32 credentialIdHash, bytes32 rpIdHash) external {
        PasskeyCredential storage cred = passkeyOf[msg.sender];
        require(!cred.active, "Vajra: active passkey exists");
        uint32 version = cred.version + 1;
        passkeyOf[msg.sender] = PasskeyCredential({
            qx: qx,
            qy: qy,
            credentialIdHash: credentialIdHash,
            rpIdHash: rpIdHash,
            version: version,
            active: true
        });
        emit PasskeyRegistered(msg.sender, version, credentialIdHash, rpIdHash);
    }

    /// @notice Replace the active passkey. Increments the version, invalidating all
    ///         unpaid passkey requests carrying the previous version.
    function rotatePasskey(bytes32 qx, bytes32 qy, bytes32 credentialIdHash, bytes32 rpIdHash) external {
        PasskeyCredential storage cred = passkeyOf[msg.sender];
        if (!cred.active) revert InactivePasskey();
        uint32 version = cred.version + 1;
        passkeyOf[msg.sender] = PasskeyCredential({
            qx: qx,
            qy: qy,
            credentialIdHash: credentialIdHash,
            rpIdHash: rpIdHash,
            version: version,
            active: true
        });
        emit PasskeyRotated(msg.sender, version, credentialIdHash, rpIdHash);
    }

    /// @notice Deactivate the current passkey. Increments the version, invalidating all
    ///         unpaid passkey requests carrying the previous version.
    function deactivatePasskey() external {
        PasskeyCredential storage cred = passkeyOf[msg.sender];
        if (!cred.active) revert InactivePasskey();
        uint32 version = cred.version + 1;
        cred.version = version;
        cred.active = false;
        emit PasskeyDeactivated(msg.sender, version);
    }

    // ------------------------------------------------------------------
    // Direct-payment guard
    // ------------------------------------------------------------------

    receive() external payable {
        revert DirectPaymentsDisabled();
    }

    fallback() external payable {
        revert DirectPaymentsDisabled();
    }

    // ------------------------------------------------------------------
    // Internal validation (order follows blueprint section 13)
    // ------------------------------------------------------------------

    function _validate(
        PaymentRequest calldata request,
        AuthProof calldata proof,
        address payer,
        uint256 value,
        bool checkValue
    ) internal view returns (bytes32 id, ValidationCode code) {
        // 1. Static request fields and bounded time window.
        if (request.recipient == address(0)) return (bytes32(0), ValidationCode.ZeroRecipient);
        if (request.amount == 0) return (bytes32(0), ValidationCode.ZeroAmount);
        if (request.nonce == bytes32(0)) return (bytes32(0), ValidationCode.InvalidNonce);
        if (
            request.expiresAt <= request.issuedAt || request.expiresAt - request.issuedAt < MIN_LIFETIME
                || request.expiresAt - request.issuedAt > MAX_LIFETIME || request.issuedAt > block.timestamp + MAX_FUTURE_SKEW
        ) return (bytes32(0), ValidationCode.InvalidTimeWindow);

        // 2. Canonical request ID.
        id = _requestId(request);

        // 3. Request status must be Unused.
        RequestStatus status = statusOf[id];
        if (status == RequestStatus.Paid) return (id, ValidationCode.AlreadyPaid);
        if (status == RequestStatus.Revoked) return (id, ValidationCode.Revoked);

        // 4. Expiry.
        if (block.timestamp > request.expiresAt) return (id, ValidationCode.Expired);

        // 5. Passkey state and version.
        if (request.authMode == AuthMode.Passkey) {
            PasskeyCredential storage cred = passkeyOf[request.recipient];
            if (!cred.active) return (id, ValidationCode.InactivePasskey);
            if (request.authVersion != cred.version) {
                return (id, ValidationCode.WrongPasskeyVersion);
            }
        }

        // 6. Payer restriction.
        if (request.payer != address(0) && request.payer != payer) return (id, ValidationCode.WrongPayer);

        // 7. Authentication.
        if (request.authMode == AuthMode.Wallet) {
            if (!SignatureChecker.isValidSignatureNow(request.recipient, id, proof.signature)) {
                return (id, ValidationCode.InvalidWalletSignature);
            }
        } else {
            if (!_verifyPasskey(request, proof, id)) return (id, ValidationCode.InvalidPasskeyProof);
        }

        // 8. Exact value (checked by fulfill; skipped by inspect).
        if (checkValue && value != request.amount) return (id, ValidationCode.IncorrectValue);

        return (id, ValidationCode.Valid);
    }

    /// @dev WebAuthn assertion verification against the registered P-256 credential.
    ///      Checks: bounded proof sizes, rpIdHash match, UP+UV flags, type "webauthn.get",
    ///      challenge == base64url(requestId) at validated hints, P-256 signature via the
    ///      EIP-7951 precompile at 0x0100 (OpenZeppelin P256, with audited Solidity fallback).
    function _verifyPasskey(PaymentRequest calldata request, AuthProof calldata proof, bytes32 id)
        internal
        view
        returns (bool)
    {
        PasskeyCredential storage cred = passkeyOf[request.recipient];
        bytes calldata authData = proof.authenticatorData;
        if (authData.length < 37 || authData.length > MAX_AUTHENTICATOR_DATA_BYTES) return false;
        if (proof.clientDataJSON.length == 0 || proof.clientDataJSON.length > MAX_CLIENT_DATA_JSON_BYTES) return false;
        if (_firstWord(authData) != cred.rpIdHash) return false;

        WebAuthn.WebAuthnAuth memory auth = WebAuthn.WebAuthnAuth({
            r: proof.r,
            s: proof.s,
            challengeIndex: proof.challengeIndex,
            typeIndex: proof.typeIndex,
            authenticatorData: authData,
            clientDataJSON: string(proof.clientDataJSON)
        });
        // requireUV = true: production requests require user verification (blueprint section 12).
        return WebAuthn.verify(abi.encodePacked(id), auth, cred.qx, cred.qy, true);
    }

    /// @dev Reads the first 32 bytes of a calldata byte array (the authenticatorData rpIdHash).
    function _firstWord(bytes calldata data) internal pure returns (bytes32 word) {
        assembly {
            word := calldataload(data.offset)
        }
    }

    /// @dev Maps a failed validation code to its spec'd custom error.
    function _revertFor(ValidationCode code, PaymentRequest calldata request) internal view {
        if (code == ValidationCode.ZeroRecipient) revert ZeroRecipient();
        if (code == ValidationCode.ZeroAmount) revert ZeroAmount();
        if (code == ValidationCode.InvalidNonce) revert InvalidNonce();
        if (code == ValidationCode.InvalidTimeWindow) revert InvalidTimeWindow();
        if (code == ValidationCode.Expired) revert RequestExpired();
        if (code == ValidationCode.AlreadyPaid) revert RequestAlreadyPaid();
        if (code == ValidationCode.Revoked) revert RequestRevoked();
        if (code == ValidationCode.WrongPayer) revert WrongPayer(request.payer, msg.sender);
        if (code == ValidationCode.InactivePasskey) revert InactivePasskey();
        if (code == ValidationCode.WrongPasskeyVersion) {
            revert WrongPasskeyVersion(passkeyOf[request.recipient].version, request.authVersion);
        }
        if (code == ValidationCode.InvalidWalletSignature) revert InvalidWalletSignature();
        if (code == ValidationCode.InvalidPasskeyProof) revert InvalidPasskeyProof();
        if (code == ValidationCode.IncorrectValue) revert IncorrectValue(request.amount, msg.value);
        revert("Vajra: unknown validation code");
    }
}
