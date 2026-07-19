// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @notice Fuzz coverage for amounts, timestamps, msg.value, nonces and payers.
contract FuzzTest is Test {
    VajraNativeV1 internal vajra;

    uint256 internal constant RECIPIENT_KEY = 0xA11CE;
    address internal recipient;
    address internal payer = makeAddr("payer");

    uint64 internal constant T0 = 1_700_000_000;

    function setUp() public {
        vm.warp(T0);
        vajra = new VajraNativeV1();
        recipient = vm.addr(RECIPIENT_KEY);
        vm.deal(address(this), type(uint128).max);
        vm.deal(payer, type(uint128).max);
    }

    function _req(uint256 amount, uint64 issuedAt, uint64 expiresAt, bytes32 nonce)
        internal
        view
        returns (VajraNativeV1.PaymentRequest memory)
    {
        return VajraNativeV1.PaymentRequest({
            recipient: recipient,
            payer: address(0),
            amount: amount,
            issuedAt: issuedAt,
            expiresAt: expiresAt,
            nonce: nonce,
            memoHash: keccak256("fuzz"),
            authMode: VajraNativeV1.AuthMode.Wallet,
            authVersion: 0
        });
    }

    function _proof(VajraNativeV1.PaymentRequest memory req) internal view returns (VajraNativeV1.AuthProof memory p) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, vajra.requestId(req));
        p.signature = abi.encodePacked(r, s, v);
    }

    function testFuzz_fulfill_amounts(uint96 amount, bytes32 nonce) public {
        vm.assume(amount > 0);
        vm.assume(nonce != bytes32(0));
        VajraNativeV1.PaymentRequest memory req = _req(amount, T0, T0 + 1 hours, nonce);
        VajraNativeV1.AuthProof memory p = _proof(req);
        uint256 before = recipient.balance;
        vm.prank(payer);
        vajra.fulfill{value: amount}(req, p);
        assertEq(recipient.balance - before, amount);
        assertEq(uint256(vajra.statusOf(vajra.requestId(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function testFuzz_fulfill_lifetimes(uint64 lifetime, bytes32 nonce) public {
        lifetime = uint64(bound(lifetime, 60, 30 days));
        vm.assume(nonce != bytes32(0));
        VajraNativeV1.PaymentRequest memory req = _req(1 ether, T0, T0 + lifetime, nonce);
        vm.prank(payer);
        vajra.fulfill{value: 1 ether}(req, _proof(req));
        assertEq(uint256(vajra.statusOf(vajra.requestId(req))), uint256(VajraNativeV1.RequestStatus.Paid));
    }

    function testFuzz_fulfill_incorrectValue(uint96 amount, uint256 value, bytes32 nonce) public {
        vm.assume(amount > 0);
        vm.assume(nonce != bytes32(0));
        vm.assume(value != amount && value <= type(uint128).max);
        VajraNativeV1.PaymentRequest memory req = _req(amount, T0, T0 + 1 hours, nonce);
        VajraNativeV1.AuthProof memory p = _proof(req);
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.IncorrectValue.selector, uint256(amount), value));
        vm.prank(payer);
        vajra.fulfill{value: value}(req, p);
    }

    function testFuzz_timeWindowRule(uint64 issuedAt, uint64 expiresAt, bytes32 nonce) public {
        vm.assume(nonce != bytes32(0));
        // Avoid subtraction overflow in our own reference computation.
        vm.assume(issuedAt <= type(uint64).max - 31 days);
        VajraNativeV1.PaymentRequest memory req = _req(1 ether, issuedAt, expiresAt, nonce);
        VajraNativeV1.AuthProof memory p = _proof(req);

        bool windowOk = expiresAt > issuedAt && (expiresAt - issuedAt) >= 60 && (expiresAt - issuedAt) <= 30 days
            && issuedAt <= T0 + 5 minutes;
        bool notExpired = T0 <= expiresAt;

        if (!windowOk) {
            vm.expectRevert(VajraNativeV1.InvalidTimeWindow.selector);
            vm.prank(payer);
            vajra.fulfill{value: 1 ether}(req, p);
        } else if (!notExpired) {
            vm.expectRevert(VajraNativeV1.RequestExpired.selector);
            vm.prank(payer);
            vajra.fulfill{value: 1 ether}(req, p);
        } else {
            vm.prank(payer);
            vajra.fulfill{value: 1 ether}(req, p);
            assertEq(uint256(vajra.statusOf(vajra.requestId(req))), uint256(VajraNativeV1.RequestStatus.Paid));
        }
    }

    function testFuzz_zeroNonceAlwaysRejected(uint96 amount, uint64 lifetime) public {
        vm.assume(amount > 0);
        lifetime = uint64(bound(lifetime, 60, 30 days));
        VajraNativeV1.PaymentRequest memory req = _req(amount, T0, T0 + lifetime, bytes32(0));
        VajraNativeV1.AuthProof memory p;
        vm.expectRevert(VajraNativeV1.InvalidNonce.selector);
        vajra.fulfill{value: amount}(req, p);
    }

    function testFuzz_payerRestriction(address randomPayer, bytes32 nonce) public {
        vm.assume(nonce != bytes32(0));
        vm.assume(randomPayer != payer && randomPayer != address(0));
        vm.assume(uint160(randomPayer) > 0x10); // skip precompiles
        VajraNativeV1.PaymentRequest memory req = _req(1 ether, T0, T0 + 1 hours, nonce);
        req.payer = payer;
        VajraNativeV1.AuthProof memory p = _proof(req);
        vm.deal(randomPayer, 2 ether);
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.WrongPayer.selector, payer, randomPayer));
        vm.prank(randomPayer);
        vajra.fulfill{value: 1 ether}(req, p);
    }

    function testFuzz_recipientAlwaysGetsExactAmount(uint96 amount, bytes32 nonce) public {
        vm.assume(amount > 0);
        vm.assume(nonce != bytes32(0));
        VajraNativeV1.PaymentRequest memory req = _req(amount, T0, T0 + 1 hours, nonce);
        uint256 vajraBefore = address(vajra).balance;
        vm.prank(payer);
        vajra.fulfill{value: amount}(req, _proof(req));
        assertEq(address(vajra).balance, vajraBefore, "Vajra never retains user funds");
    }
}
