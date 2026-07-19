// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {VajraNativeV1} from "../../src/VajraNativeV1.sol";

bytes4 constant ERC1271_MAGIC = 0x1626ba7e;

/// @dev Smart wallet that accepts any signature.
contract ValidERC1271Wallet {
    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return ERC1271_MAGIC;
    }

    receive() external payable {}
}

/// @dev Smart wallet that rejects every signature.
contract AlwaysInvalidERC1271Wallet {
    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return 0xffffffff;
    }

    receive() external payable {}
}

/// @dev Smart wallet whose isValidSignature always reverts.
contract RevertingERC1271Wallet {
    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        revert("nope");
    }

    receive() external payable {}
}

/// @dev Smart wallet that can flip its signature validity on demand.
contract RevocableERC1271Wallet {
    bool public valid = true;

    function setValid(bool v) external {
        valid = v;
    }

    function isValidSignature(bytes32, bytes calldata) external view returns (bytes4) {
        return valid ? ERC1271_MAGIC : bytes4(0xffffffff);
    }

    receive() external payable {}
}

/// @dev Recipient that rejects native MON.
contract RejectingRecipient {
    receive() external payable {
        revert("no thanks");
    }
}

/// @dev Recipient that burns a large but bounded amount of gas on receipt.
contract GasHeavyRecipient {
    uint256 public junk;

    receive() external payable {
        for (uint256 i = 0; i < 50; i++) {
            junk = uint256(keccak256(abi.encode(junk, i)));
        }
    }
}

/// @dev Recipient contract that accepts any signature (ERC-1271) and attempts
///      to reenter fulfill when it receives the settlement transfer.
contract ReentrantRecipient {
    VajraNativeV1 public immutable vajra;
    VajraNativeV1.PaymentRequest public request;
    VajraNativeV1.AuthProof public proof;
    bool public attempted;
    bool public swallow;

    constructor(VajraNativeV1 _vajra) {
        vajra = _vajra;
    }

    function arm(VajraNativeV1.PaymentRequest calldata req, VajraNativeV1.AuthProof calldata p, bool _swallow) external {
        request = req;
        proof = p;
        swallow = _swallow;
    }

    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return ERC1271_MAGIC;
    }

    receive() external payable {
        attempted = true;
        if (swallow) {
            // Swallow the guard revert: the outer settlement must complete exactly once.
            try vajra.fulfill{value: request.amount}(request, proof) {} catch {}
        } else {
            // Propagate the guard revert: the outer fulfill must fail with NativeTransferFailed.
            vajra.fulfill{value: request.amount}(request, proof);
        }
    }
}
