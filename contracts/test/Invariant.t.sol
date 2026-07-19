// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @dev Stateful handler exercising randomized sequences of register / rotate /
///      deactivate / revoke / fulfill / replay attempts against a live contract.
contract VajraHandler is Test {
    VajraNativeV1 public immutable vajra;
    uint256 internal constant RECIPIENT_KEY = 0xA11CE;
    address public immutable recipient;
    address[] public payers;

    VajraNativeV1.PaymentRequest[] public paidRequests;
    VajraNativeV1.PaymentRequest[] public revokedRequests;
    uint256 public totalPaid;
    uint256 public violations;
    uint32 public lastPasskeyVersion;

    constructor(VajraNativeV1 _vajra) {
        vajra = _vajra;
        recipient = vm.addr(RECIPIENT_KEY);
        for (uint256 i = 0; i < 4; i++) {
            address p = address(uint160(0x10000 + i));
            payers.push(p);
            vm.deal(p, 1_000_000 ether);
        }
    }

    function _freshRequest(uint256 amount, bytes32 nonce) internal view returns (VajraNativeV1.PaymentRequest memory) {
        return VajraNativeV1.PaymentRequest({
            recipient: recipient,
            payer: address(0),
            amount: amount,
            issuedAt: uint64(block.timestamp),
            expiresAt: uint64(block.timestamp) + 7 days,
            nonce: nonce,
            memoHash: keccak256("invariant"),
            authMode: VajraNativeV1.AuthMode.Wallet,
            authVersion: 0
        });
    }

    function fulfillNew(uint96 amountSeed, bytes32 nonce, uint8 payerIdx) external {
        if (nonce == bytes32(0)) return;
        uint256 amount = bound(amountSeed, 1, 5 ether);
        VajraNativeV1.PaymentRequest memory req = _freshRequest(amount, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, vajra.requestId(req));
        VajraNativeV1.AuthProof memory proof;
        proof.signature = abi.encodePacked(r, s, v);
        address payer = payers[payerIdx % payers.length];
        vm.prank(payer);
        try vajra.fulfill{value: amount}(req, proof) {
            paidRequests.push(req);
            totalPaid += amount;
        } catch {
            // Benign: pathological nonce collision with an already-terminal request.
        }
    }

    function fulfillPaidAgain(uint256 seed) external {
        if (paidRequests.length == 0) return;
        VajraNativeV1.PaymentRequest memory req = paidRequests[seed % paidRequests.length];
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, vajra.requestId(req));
        VajraNativeV1.AuthProof memory proof;
        proof.signature = abi.encodePacked(r, s, v);
        vm.deal(address(this), req.amount);
        try vajra.fulfill{value: req.amount}(req, proof) {
            violations++; // a second settlement of the same request must never succeed
        } catch {}
    }

    function revokeNew(bytes32 nonce) external {
        if (nonce == bytes32(0)) return;
        VajraNativeV1.PaymentRequest memory req = _freshRequest(1 ether, nonce);
        vm.prank(recipient);
        try vajra.revoke(req) {
            revokedRequests.push(req);
        } catch {}
    }

    function revokeRevokedAgain(uint256 seed) external {
        if (revokedRequests.length == 0) return;
        VajraNativeV1.PaymentRequest memory req = revokedRequests[seed % revokedRequests.length];
        vm.prank(recipient);
        try vajra.revoke(req) {
            violations++; // double revocation must never succeed
        } catch {}
    }

    function fulfillRevoked(uint256 seed) external {
        if (revokedRequests.length == 0) return;
        VajraNativeV1.PaymentRequest memory req = revokedRequests[seed % revokedRequests.length];
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(RECIPIENT_KEY, vajra.requestId(req));
        VajraNativeV1.AuthProof memory proof;
        proof.signature = abi.encodePacked(r, s, v);
        vm.deal(address(this), req.amount);
        try vajra.fulfill{value: req.amount}(req, proof) {
            violations++; // a revoked request must never settle
        } catch {}
    }

    function revokePaid(uint256 seed) external {
        if (paidRequests.length == 0) return;
        VajraNativeV1.PaymentRequest memory req = paidRequests[seed % paidRequests.length];
        vm.prank(recipient);
        try vajra.revoke(req) {
            violations++; // a paid request must never become revoked
        } catch {}
    }

    function passkeyLifecycle(uint8 action) external {
        bytes32 a = bytes32(uint256(action) + 1);
        vm.startPrank(recipient);
        (,,,, uint32 v_, bool active_) = vajra.passkeyOf(recipient);
        if (action % 3 == 0) {
            if (!active_) {
                vajra.registerPasskey(a, a, a, a);
                _bump(v_);
            }
        } else if (action % 3 == 1) {
            if (active_) {
                vajra.rotatePasskey(a, a, a, a);
                _bump(v_);
            }
        } else if (active_) {
            vajra.deactivatePasskey();
            _bump(v_);
        }
        vm.stopPrank();
    }

    // External readers: auto-getters for public struct arrays don't expose length/indexing.
    function paidCount() external view returns (uint256) { return paidRequests.length; }
    function paidAt(uint256 i) external view returns (VajraNativeV1.PaymentRequest memory) { return paidRequests[i]; }
    function revokedCount() external view returns (uint256) { return revokedRequests.length; }
    function revokedAt(uint256 i) external view returns (VajraNativeV1.PaymentRequest memory) { return revokedRequests[i]; }

    function _bump(uint32 oldVersion) internal {
        (,,,, uint32 v2,) = vajra.passkeyOf(recipient);
        if (v2 <= oldVersion) violations++; // versions must be strictly monotonic
        lastPasskeyVersion = v2;
    }

    function warpTime(uint32 dt) external {
        vm.warp(block.timestamp + bound(dt, 60, 1 days));
    }
}

/// @notice Release-blocker invariants from blueprint section 21, exercised over
///         randomized action sequences.
contract VajraInvariantTest is Test {
    VajraNativeV1 internal vajra;
    VajraHandler internal handler;

    function setUp() public {
        vm.warp(1_700_000_000);
        vajra = new VajraNativeV1();
        handler = new VajraHandler(vajra);
        targetContract(address(handler));
    }

    /// Invariant 1+2: a request settles at most once and stays Paid forever.
    function invariant_paidIsTerminal() public view {
        for (uint256 i = 0; i < handler.paidCount(); i++) {
            bytes32 id = vajra.requestId(handler.paidAt(i));
            assertEq(uint256(vajra.statusOf(id)), uint256(VajraNativeV1.RequestStatus.Paid), "paid request mutated");
        }
    }

    /// Invariant 3: a revoked request never becomes paid.
    function invariant_revokedIsTerminal() public view {
        for (uint256 i = 0; i < handler.revokedCount(); i++) {
            bytes32 id = vajra.requestId(handler.revokedAt(i));
            assertEq(uint256(vajra.statusOf(id)), uint256(VajraNativeV1.RequestStatus.Revoked), "revoked request mutated");
        }
    }

    /// Invariants 4+5: every settled wei reached the recipient; the contract holds nothing.
    function invariant_fundsConserved() public view {
        assertEq(handler.recipient().balance, handler.totalPaid(), "recipient balance != sum of settlements");
        assertEq(address(vajra).balance, 0, "Vajra holds user funds");
    }

    /// Invariant 12: no sequence of calls may produce a forbidden transition.
    function invariant_noForbiddenTransition() public view {
        assertEq(handler.violations(), 0, "forbidden state transition succeeded");
    }
}
