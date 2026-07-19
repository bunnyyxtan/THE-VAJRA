// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @notice inspect() must report the correct ValidationCode for every Appendix B state.
contract InspectTest is Test {
    VajraNativeV1 internal vajra;

    uint256 internal constant RECIPIENT_KEY = 0xA11CE;
    address internal recipient;
    address internal payer = makeAddr("payer");
    address internal stranger = makeAddr("stranger");

    uint64 internal constant T0 = 1_700_000_000;
    uint64 internal constant LIFETIME = 1 hours;

    function setUp() public {
        vm.warp(T0);
        vajra = new VajraNativeV1();
        recipient = vm.addr(RECIPIENT_KEY);
        vm.deal(payer, 100 ether);
    }

    function _req() internal view returns (VajraNativeV1.PaymentRequest memory) {
        return VajraNativeV1.PaymentRequest({
            recipient: recipient,
            payer: address(0),
            amount: 1 ether,
            issuedAt: T0,
            expiresAt: T0 + LIFETIME,
            nonce: bytes32(uint256(1)),
            memoHash: keccak256("memo"),
            authMode: VajraNativeV1.AuthMode.Wallet,
            authVersion: 0
        });
    }

    function _proof(VajraNativeV1.PaymentRequest memory req) internal view returns (VajraNativeV1.AuthProof memory p) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, vajra.requestId(req));
        p.signature = abi.encodePacked(r, s, v);
    }

    function _code(VajraNativeV1.PaymentRequest memory req, VajraNativeV1.AuthProof memory p, address who)
        internal
        view
        returns (VajraNativeV1.ValidationCode)
    {
        (, VajraNativeV1.ValidationCode c) = vajra.inspect(req, p, who);
        return c;
    }

    function test_inspect_valid() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        (bytes32 id, VajraNativeV1.ValidationCode c) = vajra.inspect(req, _proof(req), payer);
        assertEq(uint256(c), uint256(VajraNativeV1.ValidationCode.Valid));
        assertEq(id, vajra.requestId(req));
    }

    function test_inspect_zeroRecipient() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.recipient = address(0);
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.ZeroRecipient));
    }

    function test_inspect_zeroAmount() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.amount = 0;
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.ZeroAmount));
    }

    function test_inspect_invalidNonce() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.nonce = bytes32(0);
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.InvalidNonce));
    }

    function test_inspect_invalidTimeWindow() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.expiresAt = req.issuedAt + 10; // below 60s minimum
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.InvalidTimeWindow));
    }

    function test_inspect_expired() public {
        VajraNativeV1.PaymentRequest memory req = _req();
        vm.warp(T0 + LIFETIME + 1);
        assertEq(uint256(_code(req, _proof(req), payer)), uint256(VajraNativeV1.ValidationCode.Expired));
    }

    function test_inspect_alreadyPaid() public {
        VajraNativeV1.PaymentRequest memory req = _req();
        VajraNativeV1.AuthProof memory p = _proof(req);
        vm.prank(payer);
        vajra.fulfill{value: 1 ether}(req, p);
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.AlreadyPaid));
    }

    function test_inspect_revoked() public {
        VajraNativeV1.PaymentRequest memory req = _req();
        vm.prank(recipient);
        vajra.revoke(req);
        assertEq(uint256(_code(req, _proof(req), payer)), uint256(VajraNativeV1.ValidationCode.Revoked));
    }

    function test_inspect_wrongPayer() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.payer = payer;
        assertEq(uint256(_code(req, _proof(req), stranger)), uint256(VajraNativeV1.ValidationCode.WrongPayer));
    }

    function test_inspect_inactivePasskey() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        req.authMode = VajraNativeV1.AuthMode.Passkey;
        req.authVersion = 1;
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.InactivePasskey));
    }

    function test_inspect_wrongPasskeyVersion() public {
        vm.prank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4))); // v1
        VajraNativeV1.PaymentRequest memory req = _req();
        req.authMode = VajraNativeV1.AuthMode.Passkey;
        req.authVersion = 7;
        VajraNativeV1.AuthProof memory p;
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.WrongPasskeyVersion));
    }

    function test_inspect_invalidWalletSignature() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        VajraNativeV1.AuthProof memory p;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xDEAD, vajra.requestId(req));
        p.signature = abi.encodePacked(r, s, v);
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.InvalidWalletSignature));
    }

    function test_inspect_invalidPasskeyProof() public {
        vm.prank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        VajraNativeV1.PaymentRequest memory req = _req();
        req.authMode = VajraNativeV1.AuthMode.Passkey;
        req.authVersion = 1;
        VajraNativeV1.AuthProof memory p;
        p.authenticatorData = new bytes(37);
        p.authenticatorData[32] = 0x05;
        p.clientDataJSON = bytes('{"type":"webauthn.get"}');
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.InvalidPasskeyProof));
    }

    /// @dev inspect is non-payable, so the msg.value check is skipped there by design;
    ///      fulfill remains the sole enforcer of IncorrectValue. This pins that behavior.
    function test_inspect_skipsValueCheck() public view {
        VajraNativeV1.PaymentRequest memory req = _req();
        (, VajraNativeV1.ValidationCode c) = vajra.inspect(req, _proof(req), payer);
        assertEq(uint256(c), uint256(VajraNativeV1.ValidationCode.Valid));
    }

    /// @dev Validation precedence: static-field errors come before state errors.
    function test_inspect_precedence_staticBeforeState() public {
        VajraNativeV1.PaymentRequest memory req = _req();
        VajraNativeV1.AuthProof memory p = _proof(req);
        vm.prank(payer);
        vajra.fulfill{value: 1 ether}(req, p);
        req.amount = 0; // now also statically invalid; ZeroAmount must win over AlreadyPaid
        assertEq(uint256(_code(req, p, payer)), uint256(VajraNativeV1.ValidationCode.ZeroAmount));
    }
}
