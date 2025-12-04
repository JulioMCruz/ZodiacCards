// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployV3Proxy
 * @dev Helper contract to deploy V3 proxy with initialization
 */
contract DeployV3Proxy {
    event ProxyDeployed(address proxy, address implementation);

    function deployProxy(
        address implementation,
        address initialOwner,
        address payable treasuryAddress
    ) external returns (address) {
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address)",
            initialOwner,
            treasuryAddress
        );

        ERC1967Proxy proxy = new ERC1967Proxy(implementation, initData);

        emit ProxyDeployed(address(proxy), implementation);
        return address(proxy);
    }
}
