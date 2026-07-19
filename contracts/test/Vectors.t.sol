// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @notice Request-ID parity vectors (blueprint Appendix A). Each vector recomputes the
///         digest locally from first principles and asserts equality with the contract,
///         then asserts stability against frozen constants so any encoding drift fails
///         loudly. The TypeScript side must reproduce these exact digests (release blocker,
///         blueprint section 22 "Differential parity tests").
///
///         Frozen constants assume: forge test chainId 31337 and vajra deployed first in
///         setUp (address 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f). If the deployment
///         order changes, regenerate the constants with a console2 print of requestId().
contract VectorsTest is Test {
    VajraNativeV1 internal vajra;

    uint64 internal constant T0 = 1_700_000_000;
    address internal constant RECIPIENT = address(0x1111111111111111111111111111111111111111);
    address internal constant PAYER = address(0x2222222222222222222222222222222222222222);
    bytes32 internal constant NONCE = bytes32(uint256(0xC0FFEE));
    bytes32 internal constant MEMO_HASH = keccak256("Dinner");
    bytes32 internal constant MEMO_HASH_UNICODE = keccak256(unicode"晚餐 🍜");

    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 internal constant TYPEHASH = keccak256(
        "PaymentRequest(address recipient,address payer,uint256 amount,uint64 issuedAt,uint64 expiresAt,bytes32 nonce,bytes32 memoHash,uint8 authMode,uint32 authVersion)"
    );

    function setUp() public {
        vm.warp(T0);
        vajra = new VajraNativeV1();
    }

    function _request(
        address payer,
        uint256 amount,
        uint64 issuedAt,
        uint64 expiresAt,
        bytes32 memoHash,
        VajraNativeV1.AuthMode mode,
        uint32 version
    ) internal pure returns (VajraNativeV1.PaymentRequest memory) {
        return VajraNativeV1.PaymentRequest({
            recipient: RECIPIENT,
            payer: payer,
            amount: amount,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            nonce: NONCE,
            memoHash: memoHash,
            authMode: mode,
            authVersion: version
        });
    }

    /// @dev Independent re-derivation of the canonical digest from first principles.
    function _referenceId(VajraNativeV1.PaymentRequest memory req) internal view returns (bytes32) {
        bytes32 domain = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256("Vajra"), keccak256("1"), block.chainid, address(vajra)));
        bytes32 structHash = keccak256(
            abi.encode(
                TYPEHASH,
                req.recipient,
                req.payer,
                req.amount,
                req.issuedAt,
                req.expiresAt,
                req.nonce,
                req.memoHash,
                uint8(req.authMode),
                req.authVersion
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
    }

    function _assertVector(VajraNativeV1.PaymentRequest memory req, bytes32 frozen, string memory label) internal view {
        bytes32 refId = _referenceId(req);
        bytes32 actual = vajra.requestId(req);
        assertEq(actual, refId, string.concat(label, ": contract != first-principles reference"));
        assertEq(actual, frozen, string.concat(label, ": digest drifted from frozen vector"));
    }

    function test_vector_openRequestBaseline() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1 ether, T0, T0 + 1 hours, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0xad0a4e98455338b98b36896c2d54aa4f5d76ff0c4ab5d057e2370511f653a3ee, "open-baseline");
    }

    function test_vector_exactPayer() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(PAYER, 1 ether, T0, T0 + 1 hours, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0xaf57cc6f4940bd60cd9a5938e9578d4da6127cc35759668e9646986c6e77f4ba, "exact-payer");
    }

    function test_vector_minimumAmount() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1, T0, T0 + 1 hours, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0x94a1888a4302c382f778af4e514d75f3d54465fd209b2295d3785f8ab379aa4d, "min-amount");
    }

    function test_vector_maxUint256Amount() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), type(uint256).max, T0, T0 + 1 hours, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0xaee9a4d0f6090b0fad6350b89937408142a19df0012e8856cbd7c1d122abe750, "max-amount");
    }

    function test_vector_minLifetime() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1 ether, T0, T0 + 60, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0x2f21885fe044136d26c671676ef4bb893f37049bcc69f18f41557c69e07e9c4c, "min-lifetime");
    }

    function test_vector_maxLifetime() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1 ether, T0, T0 + 30 days, MEMO_HASH, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0xb82aa2cb4528646a149f62a114c3dc241dc1bbee25d6fcb73e1faf9627dd79ce, "max-lifetime");
    }

    function test_vector_unicodeMemo() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1 ether, T0, T0 + 1 hours, MEMO_HASH_UNICODE, VajraNativeV1.AuthMode.Wallet, 0);
        _assertVector(req, 0x38dc65fcaa0b976f5d12c14b73f4700eef2bb99c185094b433c5fc856789526b, "unicode-memo");
    }

    function test_vector_passkeyMode() public view {
        VajraNativeV1.PaymentRequest memory req =
            _request(address(0), 1 ether, T0, T0 + 1 hours, MEMO_HASH, VajraNativeV1.AuthMode.Passkey, 3);
        _assertVector(req, 0xa0723c89a7c8df958aa575743f0051ad5fab1bc9167d5f90591399d9922659a0, "passkey-mode");
    }

}
