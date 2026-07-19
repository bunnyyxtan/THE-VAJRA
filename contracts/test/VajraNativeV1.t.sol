// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test, Vm} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";
import {
    ValidERC1271Wallet,
    AlwaysInvalidERC1271Wallet,
    RevertingERC1271Wallet,
    RevocableERC1271Wallet,
    RejectingRecipient,
    GasHeavyRecipient,
    ReentrantRecipient
} from "./mocks/Mocks.sol";

contract VajraNativeV1Test is Test {
    VajraNativeV1 internal vajra;

    uint256 internal constant RECIPIENT_KEY = 0xA11CE;
    uint256 internal constant WRONG_KEY = 0xB0B;
    address internal recipient;
    address internal payer = makeAddr("payer");
    address internal stranger = makeAddr("stranger");

    uint64 internal constant T0 = 1_700_000_000;
    uint64 internal constant LIFETIME = 1 hours;
    bytes32 internal constant NONCE = bytes32(uint256(0xC0FFEE));
    bytes32 internal constant MEMO_HASH = keccak256("Dinner");

    bytes32 internal constant FULFILLED_SIG =
        keccak256("PaymentFulfilled(bytes32,address,address,uint256,uint64,bytes32,uint8,uint32)");

    function setUp() public virtual {
        vm.warp(T0);
        vajra = new VajraNativeV1();
        recipient = vm.addr(RECIPIENT_KEY);
        vm.deal(address(this), 10_000 ether);
        vm.deal(payer, 10_000 ether);
        vm.deal(stranger, 10_000 ether);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function _openRequest() internal view returns (VajraNativeV1.PaymentRequest memory) {
        return VajraNativeV1.PaymentRequest({
            recipient: recipient,
            payer: address(0),
            amount: 1 ether,
            issuedAt: T0,
            expiresAt: T0 + LIFETIME,
            nonce: NONCE,
            memoHash: MEMO_HASH,
            authMode: VajraNativeV1.AuthMode.Wallet,
            authVersion: 0
        });
    }

    function _sign(VajraNativeV1.PaymentRequest memory req, uint256 key)
        internal
        view
        returns (VajraNativeV1.AuthProof memory proof)
    {
        bytes32 id = vajra.requestId(req);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, id);
        proof.signature = abi.encodePacked(r, s, v);
    }

    function _id(VajraNativeV1.PaymentRequest memory req) internal view returns (bytes32) {
        return vajra.requestId(req);
    }

    function _countFulfilledEvents(Vm.Log[] memory logs) internal pure returns (uint256 n) {
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == FULFILLED_SIG) n++;
        }
    }

    function _passkeyRequest(address recip, uint32 version)
        internal
        view
        returns (VajraNativeV1.PaymentRequest memory req)
    {
        req = _openRequest();
        req.recipient = recip;
        req.authMode = VajraNativeV1.AuthMode.Passkey;
        req.authVersion = version;
    }

    // ------------------------------------------------------------------
    // Wallet-auth fulfillment
    // ------------------------------------------------------------------

    function test_fulfill_openWalletRequest() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        bytes32 id = _id(req);

        uint256 before = recipient.balance;
        vm.recordLogs();
        vm.prank(payer);
        vajra.fulfill{value: 1 ether}(req, proof);

        assertEq(recipient.balance - before, 1 ether, "recipient must receive exact amount");
        assertEq(uint256(vajra.statusOf(id)), uint256(VajraNativeV1.RequestStatus.Paid));

        (address sPayer, address sRecipient, uint256 sAmount, uint64 sPaidAt, bytes32 sMemo, VajraNativeV1.AuthMode sMode, uint32 sVersion) =
            vajra.settlementOf(id);
        assertEq(sPayer, payer);
        assertEq(sRecipient, recipient);
        assertEq(sAmount, 1 ether);
        assertEq(sPaidAt, T0);
        assertEq(sMemo, MEMO_HASH);
        assertEq(uint256(sMode), uint256(VajraNativeV1.AuthMode.Wallet));
        assertEq(sVersion, 0);

        // Exactly one PaymentFulfilled event, fully matching.
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(_countFulfilledEvents(logs), 1, "exactly one PaymentFulfilled");
        assertEq(logs[0].topics.length, 4);
        assertEq(logs[0].topics[1], id);
        assertEq(logs[0].topics[2], bytes32(uint256(uint160(payer))));
        assertEq(logs[0].topics[3], bytes32(uint256(uint160(recipient))));
        (uint256 amt, uint64 paidAt, bytes32 memo, VajraNativeV1.AuthMode mode, uint32 ver) =
            abi.decode(logs[0].data, (uint256, uint64, bytes32, VajraNativeV1.AuthMode, uint32));
        assertEq(amt, 1 ether);
        assertEq(paidAt, T0);
        assertEq(memo, MEMO_HASH);
        assertEq(uint256(mode), 0);
        assertEq(ver, 0);
    }

    function test_fulfill_payerRestricted_rightPayer() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.payer = payer;
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.prank(payer);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function test_fulfill_payerRestricted_wrongPayer() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.payer = payer;
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.WrongPayer.selector, payer, stranger));
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_openRequest_anyPayer() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.prank(stranger);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function test_fulfill_wrongSignerReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, WRONG_KEY);
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    // ------------------------------------------------------------------
    // ERC-1271 smart-wallet recipients
    // ------------------------------------------------------------------

    function test_fulfill_erc1271_valid() public {
        ValidERC1271Wallet wallet = new ValidERC1271Wallet();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(wallet);
        VajraNativeV1.AuthProof memory proof; // signature content irrelevant for this mock
        proof.signature = hex"deadbeef";
        vm.deal(address(wallet), 0);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(address(wallet).balance, 1 ether);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function test_fulfill_erc1271_alwaysInvalid() public {
        AlwaysInvalidERC1271Wallet wallet = new AlwaysInvalidERC1271Wallet();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(wallet);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"deadbeef";
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_erc1271_reverting() public {
        RevertingERC1271Wallet wallet = new RevertingERC1271Wallet();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(wallet);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"deadbeef";
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_erc1271_revocable() public {
        RevocableERC1271Wallet wallet = new RevocableERC1271Wallet();
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"deadbeef";

        VajraNativeV1.PaymentRequest memory req1 = _openRequest();
        req1.recipient = address(wallet);
        req1.nonce = bytes32(uint256(1));
        vajra.fulfill{value: 1 ether}(req1, proof);

        wallet.setValid(false);
        VajraNativeV1.PaymentRequest memory req2 = _openRequest();
        req2.recipient = address(wallet);
        req2.nonce = bytes32(uint256(2));
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req2, proof);
        assertEq(uint256(vajra.statusOf(_id(req2))), uint256(VajraNativeV1.RequestStatus.Unused));
    }

    // ------------------------------------------------------------------
    // Passkey registry
    // ------------------------------------------------------------------

    function test_registerPasskey() public {
        bytes32 qx = bytes32(uint256(11));
        bytes32 qy = bytes32(uint256(22));
        bytes32 credHash = bytes32(uint256(33));
        bytes32 rpHash = bytes32(uint256(44));
        vm.expectEmit(true, true, true, true);
        emit VajraNativeV1.PasskeyRegistered(recipient, 1, credHash, rpHash);
        vm.prank(recipient);
        vajra.registerPasskey(qx, qy, credHash, rpHash);

        (bytes32 qx_, bytes32 qy_, bytes32 c_, bytes32 r_, uint32 v_, bool a_) = vajra.passkeyOf(recipient);
        assertEq(qx_, qx);
        assertEq(qy_, qy);
        assertEq(c_, credHash);
        assertEq(r_, rpHash);
        assertEq(v_, 1);
        assertTrue(a_);
    }

    function test_registerPasskey_whileActiveReverts() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        vm.expectRevert("Vajra: active passkey exists");
        vajra.registerPasskey(bytes32(uint256(5)), bytes32(uint256(6)), bytes32(uint256(7)), bytes32(uint256(8)));
        vm.stopPrank();
    }

    function test_rotatePasskey() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        vm.expectEmit(true, true, true, true);
        emit VajraNativeV1.PasskeyRotated(recipient, 2, bytes32(uint256(7)), bytes32(uint256(8)));
        vajra.rotatePasskey(bytes32(uint256(5)), bytes32(uint256(6)), bytes32(uint256(7)), bytes32(uint256(8)));
        vm.stopPrank();
        (,,,, uint32 v_, bool a_) = vajra.passkeyOf(recipient);
        assertEq(v_, 2);
        assertTrue(a_);
    }

    function test_rotatePasskey_withoutActiveReverts() public {
        vm.prank(recipient);
        vm.expectRevert(VajraNativeV1.InactivePasskey.selector);
        vajra.rotatePasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
    }

    function test_deactivatePasskey() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        vm.expectEmit(true, true, true, true);
        emit VajraNativeV1.PasskeyDeactivated(recipient, 2);
        vajra.deactivatePasskey();
        vm.stopPrank();
        (,,,, uint32 v_, bool a_) = vajra.passkeyOf(recipient);
        assertEq(v_, 2);
        assertFalse(a_);
    }

    function test_deactivatePasskey_withoutActiveReverts() public {
        vm.prank(recipient);
        vm.expectRevert(VajraNativeV1.InactivePasskey.selector);
        vajra.deactivatePasskey();
    }

    function test_deactivateThenReregister_versionMonotonic() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4))); // v1
        vajra.deactivatePasskey(); // v2, inactive
        vajra.registerPasskey(bytes32(uint256(5)), bytes32(uint256(6)), bytes32(uint256(7)), bytes32(uint256(8))); // v3
        vm.stopPrank();
        (,,,, uint32 v_, bool a_) = vajra.passkeyOf(recipient);
        assertEq(v_, 3, "versions must never reset, or stale requests could revive");
        assertTrue(a_);
    }

    // ------------------------------------------------------------------
    // Passkey-mode fulfillment state checks (valid proof fixture lives in PasskeyFixture.t.sol)
    // ------------------------------------------------------------------

    function test_fulfill_passkey_inactiveReverts() public {
        VajraNativeV1.PaymentRequest memory req = _passkeyRequest(recipient, 1);
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InactivePasskey.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_passkey_staleVersionReverts() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4))); // v1
        vajra.rotatePasskey(bytes32(uint256(5)), bytes32(uint256(6)), bytes32(uint256(7)), bytes32(uint256(8))); // v2
        vm.stopPrank();

        VajraNativeV1.PaymentRequest memory req = _passkeyRequest(recipient, 1); // carries old version
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.WrongPasskeyVersion.selector, 2, 1));
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_passkey_deactivatedReverts() public {
        vm.startPrank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4))); // v1
        vajra.deactivatePasskey(); // v2 inactive
        vm.stopPrank();
        VajraNativeV1.PaymentRequest memory req = _passkeyRequest(recipient, 1);
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InactivePasskey.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_passkey_invalidProofReverts() public {
        vm.prank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        VajraNativeV1.PaymentRequest memory req = _passkeyRequest(recipient, 1);
        VajraNativeV1.AuthProof memory proof;
        proof.authenticatorData = new bytes(37);
        proof.authenticatorData[32] = 0x05; // UP|UV
        proof.clientDataJSON = bytes('{"type":"webauthn.get","challenge":"AAAA"}');
        proof.r = bytes32(uint256(1));
        proof.s = bytes32(uint256(2));
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_passkey_oversizedProofReverts() public {
        vm.prank(recipient);
        vajra.registerPasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)));
        VajraNativeV1.PaymentRequest memory req = _passkeyRequest(recipient, 1);
        VajraNativeV1.AuthProof memory proof;
        proof.authenticatorData = new bytes(1025); // over the explicit bound
        proof.clientDataJSON = bytes("{}");
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    // ------------------------------------------------------------------
    // Revocation
    // ------------------------------------------------------------------

    function test_revoke_recipient() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        bytes32 id = _id(req);
        vm.expectEmit(true, true, true, true);
        emit VajraNativeV1.PaymentRevoked(id, recipient, T0);
        vm.prank(recipient);
        vajra.revoke(req);
        assertEq(uint256(vajra.statusOf(id)), uint256(VajraNativeV1.RequestStatus.Revoked));
    }

    function test_revoke_nonRecipientReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        vm.prank(stranger);
        vm.expectRevert("Vajra: caller is not the recipient");
        vajra.revoke(req);
    }

    function test_revoke_thenFulfillReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        vm.prank(recipient);
        vajra.revoke(req);
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.expectRevert(VajraNativeV1.RequestRevoked.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_doubleRevokeReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        vm.startPrank(recipient);
        vajra.revoke(req);
        vm.expectRevert(VajraNativeV1.RequestRevoked.selector);
        vajra.revoke(req);
        vm.stopPrank();
    }

    function test_revokePaidReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vajra.fulfill{value: 1 ether}(req, proof);
        vm.prank(recipient);
        vm.expectRevert(VajraNativeV1.RequestAlreadyPaid.selector);
        vajra.revoke(req);
    }

    // ------------------------------------------------------------------
    // Settlement guards
    // ------------------------------------------------------------------

    function test_doubleFulfillReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vajra.fulfill{value: 1 ether}(req, proof);
        vm.expectRevert(VajraNativeV1.RequestAlreadyPaid.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_expiredReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.warp(T0 + LIFETIME + 1);
        vm.expectRevert(VajraNativeV1.RequestExpired.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_atExpiryBoundarySucceeds() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.warp(T0 + LIFETIME); // "not later than expiresAt"
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function test_fulfill_zeroRecipientReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(0);
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.ZeroRecipient.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_zeroAmountReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.amount = 0;
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.ZeroAmount.selector);
        vajra.fulfill{value: 0}(req, proof);
    }

    function test_fulfill_zeroNonceReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.nonce = bytes32(0);
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InvalidNonce.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_expiryNotAfterIssueReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.expiresAt = req.issuedAt;
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InvalidTimeWindow.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_lifetimeTooShortReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.expiresAt = req.issuedAt + 59;
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InvalidTimeWindow.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_lifetimeTooLongReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.expiresAt = req.issuedAt + 30 days + 1;
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InvalidTimeWindow.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_issuedAtTooFarFutureReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.issuedAt = T0 + 6 minutes;
        req.expiresAt = T0 + 6 minutes + LIFETIME;
        VajraNativeV1.AuthProof memory proof;
        vm.expectRevert(VajraNativeV1.InvalidTimeWindow.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    function test_fulfill_issuedAtWithinSkewSucceeds() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.issuedAt = T0 + 4 minutes;
        req.expiresAt = T0 + 4 minutes + LIFETIME;
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function test_fulfill_underpayReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.IncorrectValue.selector, 1 ether, 0.5 ether));
        vajra.fulfill{value: 0.5 ether}(req, proof);
    }

    function test_fulfill_overpayReverts() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        VajraNativeV1.AuthProof memory proof = _sign(req, RECIPIENT_KEY);
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.IncorrectValue.selector, 1 ether, 2 ether));
        vajra.fulfill{value: 2 ether}(req, proof);
    }

    // ------------------------------------------------------------------
    // Hostile recipients
    // ------------------------------------------------------------------

    function test_fulfill_rejectingRecipientLeavesUnused() public {
        Rejecting1271 rej = new Rejecting1271();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(rej);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"00";
        uint256 before = address(this).balance;
        vm.expectRevert(VajraNativeV1.NativeTransferFailed.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Unused), "must stay Unused");
        assertEq(address(this).balance, before, "payer funds must not move");
        assertEq(address(vajra).balance, 0, "contract must not hold funds");
        assertEq(address(rej).balance, 0);
    }

    function test_fulfill_reentrantRecipient_propagatingFails() public {
        ReentrantRecipient attacker = new ReentrantRecipient(vajra);
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(attacker);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"00";
        attacker.arm(req, proof, false);

        vm.recordLogs();
        vm.expectRevert(VajraNativeV1.NativeTransferFailed.selector);
        vajra.fulfill{value: 1 ether}(req, proof);

        // Note: the full revert also rolls back attacker.attempted; the only durable
        // evidence is that no settlement state or event survived.
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Unused));
        assertEq(_countFulfilledEvents(vm.getRecordedLogs()), 0, "no settlement event may escape");
        assertEq(address(vajra).balance, 0);
        assertEq(address(attacker).balance, 0);
    }

    function test_fulfill_reentrantRecipient_swallowingSettlesOnce() public {
        ReentrantRecipient attacker = new ReentrantRecipient(vajra);
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(attacker);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"00";
        attacker.arm(req, proof, true);

        vm.recordLogs();
        vajra.fulfill{value: 1 ether}(req, proof);

        assertTrue(attacker.attempted(), "reentrancy was attempted and swallowed");
        assertEq(uint256(vajra.statusOf(_id(req))), uint256(VajraNativeV1.RequestStatus.Paid));
        assertEq(address(attacker).balance, 1 ether, "exactly one settlement may land");
        assertEq(_countFulfilledEvents(vm.getRecordedLogs()), 1, "exactly one settlement event");
    }

    function test_fulfill_gasHeavyRecipientSucceeds() public {
        GasHeavyRecipient heavy = new GasHeavyRecipient();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        req.recipient = address(heavy);
        VajraNativeV1.AuthProof memory proof;
        proof.signature = hex"00";
        // GasHeavyRecipient has no isValidSignature; use ERC-1271 accepting variant instead.
        GasHeavy1271 heavy1271 = new GasHeavy1271();
        req.recipient = address(heavy1271);
        vajra.fulfill{value: 1 ether}(req, proof);
        assertEq(address(heavy1271).balance, 1 ether);
    }

    function test_receive_revertsDirectPaymentsDisabled() public {
        (bool ok, bytes memory ret) = address(vajra).call{value: 1 wei}("");
        assertFalse(ok);
        assertEq(bytes4(ret), VajraNativeV1.DirectPaymentsDisabled.selector);
    }

    function test_fallback_revertsDirectPaymentsDisabled() public {
        (bool ok, bytes memory ret) = address(vajra).call{value: 1 wei}(hex"deadbeef");
        assertFalse(ok);
        assertEq(bytes4(ret), VajraNativeV1.DirectPaymentsDisabled.selector);
        (bool ok2,) = address(vajra).call(hex"deadbeef"); // no value, unmatched selector
        assertFalse(ok2);
    }

    // ------------------------------------------------------------------
    // Domain separation
    // ------------------------------------------------------------------

    function test_domainSeparator_boundAtDeployment() public view {
        bytes32 expected = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Vajra")),
                keccak256(bytes("1")),
                block.chainid,
                address(vajra)
            )
        );
        assertEq(vajra.DOMAIN_SEPARATOR(), expected);
    }

    function test_domainSeparation_wrongChainIdFails() public {
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        bytes32 honestId = _id(req);

        // Forge a digest as if the domain lived on another chain.
        uint256 wrongChain = block.chainid + 999;
        bytes32 wrongDomain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Vajra")),
                keccak256(bytes("1")),
                wrongChain,
                address(vajra)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                vajra.PAYMENT_REQUEST_TYPEHASH(),
                req.recipient, req.payer, req.amount, req.issuedAt, req.expiresAt, req.nonce, req.memoHash,
                req.authMode, req.authVersion
            )
        );
        bytes32 forgedId = keccak256(abi.encodePacked("\x19\x01", wrongDomain, structHash));
        assertFalse(forgedId == honestId);

        VajraNativeV1.AuthProof memory proof;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, forgedId);
        proof.signature = abi.encodePacked(r, s, v);
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req, proof);

        // Flipping the test environment's chain id must not move the deployed domain.
        vm.chainId(wrongChain);
        assertEq(_id(req), honestId, "domain is bound at deployment");
        vm.chainId(wrongChain - 999);
    }

    function test_domainSeparation_wrongContractFails() public {
        VajraNativeV1 other = new VajraNativeV1();
        VajraNativeV1.PaymentRequest memory req = _openRequest();
        // Signature over the OTHER contract's digest.
        bytes32 otherId = other.requestId(req);
        VajraNativeV1.AuthProof memory proof;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, otherId);
        proof.signature = abi.encodePacked(r, s, v);
        vm.expectRevert(VajraNativeV1.InvalidWalletSignature.selector);
        vajra.fulfill{value: 1 ether}(req, proof);
    }

    // ------------------------------------------------------------------
    // Memo hashing helper
    // ------------------------------------------------------------------

    function test_memoHashOf() public view {
        bytes memory memo = new bytes(96);
        assertEq(vajra.memoHashOf(memo), keccak256(memo));
    }

    function test_memoHashOf_tooLongReverts() public {
        bytes memory memo = new bytes(97);
        vm.expectRevert(VajraNativeV1.MemoTooLong.selector);
        vajra.memoHashOf(memo);
    }
}

/// @dev ERC-1271-accepting recipient that rejects incoming MON.
contract Rejecting1271 {
    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return 0x1626ba7e;
    }

    receive() external payable {
        revert("no MON wanted");
    }
}

/// @dev ERC-1271-accepting recipient that burns bounded gas on receipt.
contract GasHeavy1271 {
    uint256 public junk;

    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return 0x1626ba7e;
    }

    receive() external payable {
        for (uint256 i = 0; i < 50; i++) {
            junk = uint256(keccak256(abi.encode(junk, i)));
        }
    }
}
