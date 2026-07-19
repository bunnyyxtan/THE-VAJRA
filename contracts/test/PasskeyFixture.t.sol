// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test, Vm} from "forge-std/Test.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @notice Passkey-mode fulfillment using a REAL WebAuthn assertion fixture generated
///         offline (test/fixtures/gen_passkey_fixture.mjs) for the exact request below.
///         The fixture's challenge is base64url(requestId), signed with a fixed test-only
///         P-256 key over sha256(authenticatorData || sha256(clientDataJSON)).
///         The generator self-verifies the signature before printing; the constants below
///         assume forge chainId 31337 and vajra deployed first in setUp
///         (0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f). Regenerate if either changes.
contract PasskeyFixtureTest is Test {
    VajraNativeV1 internal vajra;

    uint64 internal constant T0 = 1_700_000_000;
    address internal constant RECIPIENT = address(0x000000000000000000000000000000000000C0FFEE);
    address internal payer = makeAddr("payer");

    bytes32 internal constant FULFILLED_SIG =
        keccak256("PaymentFulfilled(bytes32,address,address,uint256,uint64,bytes32,uint8,uint32)");

    // ---- Fixture (fixed test-only P-256 key; see generator script) ----
    bytes32 internal constant QX = 0x4035a052c668a62dd0807babe93daaf2e22c989734f1bba85cd01617fe52f830;
    bytes32 internal constant QY = 0xc22af6f9d92eed871c62aa6ceaaf9eee21a18c262d7ecbf7a1bed6c2a6d108a7;
    bytes32 internal constant RP_ID_HASH = 0xffc93f27ebc4e7c81c713f474c5f0b5eee3065ebb26c8a250908e62c20e97859; // sha256("vajra.xyz")
    bytes32 internal constant CRED_ID_HASH = keccak256("fixture-credential-id");
    bytes32 internal constant R = 0x7bb52bb5dc050b8ee7c6f3c14b2e1f4b8b9cf635219fbcbfb1300d759ad6ceae;
    bytes32 internal constant S = 0x6b38ccc83ebb8d50102d0c699d63da3cec4a9b1c16c8a0f969a0142fd2a1b0ed;
    bytes internal constant AUTH_DATA = hex"ffc93f27ebc4e7c81c713f474c5f0b5eee3065ebb26c8a250908e62c20e978590500000000";
    bytes internal constant CLIENT_DATA_JSON =
        hex"7b226368616c6c656e6765223a226868555a354a672d64385f507261756f64344c504c75517a6837656430714671576a553143544a396d6e55222c226f726967696e223a2268747470733a2f2f76616a72612e78797a222c2274797065223a22776562617574686e2e676574227d";
    uint256 internal constant CHALLENGE_INDEX = 1;
    uint256 internal constant TYPE_INDEX = 88;
    bytes32 internal constant EXPECTED_REQUEST_ID = 0x861519e4983e77cfcfadaba87782cf2ee43387b79dd2a16a5a353509327d9a75;

    function setUp() public {
        vm.warp(T0);
        vajra = new VajraNativeV1();
        vm.deal(payer, 100 ether);
        vm.prank(RECIPIENT);
        vajra.registerPasskey(QX, QY, CRED_ID_HASH, RP_ID_HASH); // version 1
    }

    function _request() internal pure returns (VajraNativeV1.PaymentRequest memory) {
        return VajraNativeV1.PaymentRequest({
            recipient: RECIPIENT,
            payer: address(0),
            amount: 0.25 ether,
            issuedAt: T0,
            expiresAt: T0 + 1 hours,
            nonce: keccak256("vajra-passkey-fixture-nonce"),
            memoHash: keccak256("passkey dinner"),
            authMode: VajraNativeV1.AuthMode.Passkey,
            authVersion: 1
        });
    }

    function _proof() internal pure returns (VajraNativeV1.AuthProof memory p) {
        p.authenticatorData = AUTH_DATA;
        p.clientDataJSON = CLIENT_DATA_JSON;
        p.challengeIndex = CHALLENGE_INDEX;
        p.typeIndex = TYPE_INDEX;
        p.r = R;
        p.s = S;
    }

    function test_passkey_requestId_matchesFixture() public view {
        assertEq(vajra.requestId(_request()), EXPECTED_REQUEST_ID, "fixture generated for a different request");
    }

    function test_passkey_fulfill_valid() public {
        VajraNativeV1.PaymentRequest memory req = _request();
        bytes32 id = vajra.requestId(req);
        uint256 before = RECIPIENT.balance;

        vm.recordLogs();
        vm.prank(payer);
        vajra.fulfill{value: 0.25 ether}(req, _proof());

        assertEq(RECIPIENT.balance - before, 0.25 ether);
        assertEq(uint256(vajra.statusOf(id)), uint256(VajraNativeV1.RequestStatus.Paid));
        (address sPayer, address sRecipient, uint256 sAmount,,, VajraNativeV1.AuthMode sMode, uint32 sVersion) =
            vajra.settlementOf(id);
        assertEq(sPayer, payer);
        assertEq(sRecipient, RECIPIENT);
        assertEq(sAmount, 0.25 ether);
        assertEq(uint256(sMode), uint256(VajraNativeV1.AuthMode.Passkey));
        assertEq(sVersion, 1);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        uint256 n;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == FULFILLED_SIG) n++;
        }
        assertEq(n, 1, "exactly one PaymentFulfilled");
    }

    function test_passkey_inspect_valid() public view {
        (, VajraNativeV1.ValidationCode code) = vajra.inspect(_request(), _proof(), payer);
        assertEq(uint256(code), uint256(VajraNativeV1.ValidationCode.Valid));
    }

    function test_passkey_tamperedR_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        p.r = bytes32(uint256(R) + 1);
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_tamperedS_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        p.s = bytes32(uint256(S) + 1);
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_wrongChallenge_reverts() public {
        // Same proof, but the request has a different nonce -> different requestId -> challenge mismatch.
        VajraNativeV1.PaymentRequest memory req = _request();
        req.nonce = keccak256("a-different-nonce");
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(req, _proof());
    }

    function test_passkey_wrongRpIdHash_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        bytes memory ad = new bytes(AUTH_DATA.length);
        for (uint256 i = 0; i < ad.length; i++) ad[i] = AUTH_DATA[i];
        ad[0] = bytes1(uint8(ad[0]) ^ 0xFF); // corrupt the rpIdHash
        p.authenticatorData = ad;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_missingUV_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        bytes memory ad = new bytes(AUTH_DATA.length);
        for (uint256 i = 0; i < ad.length; i++) ad[i] = AUTH_DATA[i];
        ad[32] = 0x01; // UP only
        p.authenticatorData = ad;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_missingUP_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        bytes memory ad = new bytes(AUTH_DATA.length);
        for (uint256 i = 0; i < ad.length; i++) ad[i] = AUTH_DATA[i];
        ad[32] = 0x04; // UV only
        p.authenticatorData = ad;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_truncatedAuthData_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        bytes memory ad = new bytes(36);
        for (uint256 i = 0; i < 36; i++) ad[i] = AUTH_DATA[i];
        p.authenticatorData = ad;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_badChallengeIndex_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        p.challengeIndex = CHALLENGE_INDEX + 1;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_badTypeIndex_reverts() public {
        VajraNativeV1.AuthProof memory p = _proof();
        p.typeIndex = TYPE_INDEX + 1;
        vm.expectRevert(VajraNativeV1.InvalidPasskeyProof.selector);
        vajra.fulfill{value: 0.25 ether}(_request(), p);
    }

    function test_passkey_staleVersionAfterRotate_reverts() public {
        vm.prank(RECIPIENT);
        vajra.rotatePasskey(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4))); // v2
        vm.expectRevert(abi.encodeWithSelector(VajraNativeV1.WrongPasskeyVersion.selector, 2, 1));
        vajra.fulfill{value: 0.25 ether}(_request(), _proof());
    }

    function test_passkey_doubleFulfill_reverts() public {
        VajraNativeV1.PaymentRequest memory req = _request();
        vajra.fulfill{value: 0.25 ether}(req, _proof());
        vm.expectRevert(VajraNativeV1.RequestAlreadyPaid.selector);
        vajra.fulfill{value: 0.25 ether}(req, _proof());
    }
}
