// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.20;

import { Subcall } from "@oasisprotocol/sapphire-contracts/contracts/Subcall.sol";
import { BlockHashAdapter } from "../BlockHashAdapter.sol";

/**
 * @title ROFLAdapter
 * @notice Adapter for Oasis Sapphire ROFL (Runtime OFf-chain Logic) applications
 * @dev This adapter allows ROFL applications to provide block hash attestations
 *      through Oasis Sapphire's confidential compute environment
 */
contract ROFLAdapter is BlockHashAdapter {
    /// @notice The ROFL application ID that is authorized to call this adapter
    bytes21 public immutable roflAppID;

    /**
     * @notice Constructs a new ROFLAdapter
     * @param _roflAppID The bytes21 identifier of the authorized ROFL application
     */
    constructor(bytes21 _roflAppID) {
        roflAppID = _roflAppID;
    }

    /**
     * @notice Stores a block header for a given chain and block number
     * @dev Only callable by the authorized ROFL application through Subcall authorization
     * @param chainId The chain ID where the block exists
     * @param blockNumber The block number to store the hash for
     * @param blockHash The block hash to store
     */
    function storeBlockHeader(uint256 chainId, uint256 blockNumber, bytes32 blockHash) external {
        // Verify that the caller is authorized through the ROFL application
        Subcall.roflEnsureAuthorizedOrigin(roflAppID);

        // Store the block hash using the base adapter functionality
        _storeHash(chainId, blockNumber, blockHash);
    }
}
