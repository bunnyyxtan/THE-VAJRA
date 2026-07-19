// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {VajraNativeV1} from "../src/VajraNativeV1.sol";

/// @notice Deploys VajraNativeV1 to Monad Mainnet (chain ID 143).
/// Usage:  source ../.env && forge script script/Deploy.s.sol --rpc-url https://rpc.monad.xyz --broadcast
/// Dry-run first (no --broadcast). The key comes only from env; never hardcode it.
contract DeployVajra is Script {
    function run() external returns (VajraNativeV1 vajra) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        require(block.chainid == 143, "Vajra: not Monad Mainnet (chain id must be 143)");

        vm.startBroadcast(deployerKey);
        vajra = new VajraNativeV1();
        vm.stopBroadcast();

        console2.log("VajraNativeV1 deployed at:", address(vajra));
        console2.log("Chain ID:", block.chainid);
    }
}
