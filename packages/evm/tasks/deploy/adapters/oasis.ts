import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task, types } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"
import * as bech32 from "bech32"

import { verify } from ".."
import type { ROFLAdapter } from "../../../types/contracts/adapters/oasis/ROFLAdapter"
import type { ROFLAdapter__factory } from "../../../types/factories/contracts/adapters/oasis/ROFLAdapter__factory"

// Deploy ROFL Adapter on destination chain (Oasis Sapphire)
task("deploy:adapter:ROFL")
  .addParam("roflAppId", "ROFL app ID in bech32 format (e.g., rofl1...)", undefined, types.string)
  .addParam("sourceChainId", "chain ID of the source chain", undefined, types.int)
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying ROFLAdapter...")
    console.log("ROFL App ID:", taskArguments.roflAppId)
    // Decode the ROFL app ID from bech32 format
    const decoded = bech32.decode(taskArguments.roflAppId)
    if (decoded.prefix !== "rofl") {
      throw new Error(`Malformed ROFL app identifier: ${taskArguments.roflAppId}`)
    }
    const rawAppId = new Uint8Array(bech32.fromWords(decoded.words))

    // Ensure the app ID is exactly 21 bytes as required by the contract
    if (rawAppId.length !== 21) {
      throw new Error(`ROFL app ID must be exactly 21 bytes, got ${rawAppId.length}`)
    }

    // Convert to hex string with 0x prefix for bytes21
    const bytes21AppId = "0x" + Buffer.from(rawAppId).toString("hex")

    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const roflAdapterFactory: ROFLAdapter__factory = <ROFLAdapter__factory>(
      await hre.ethers.getContractFactory("ROFLAdapter")
    )

    const constructorArguments = [rawAppId, taskArguments.sourceChainId] as const

    const roflAdapter: ROFLAdapter = <ROFLAdapter>(
      await roflAdapterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await roflAdapter.waitForDeployment()

    console.log("ROFLAdapter deployed to:", await roflAdapter.getAddress())
    console.log("Configuration:")
    console.log("  - ROFL App ID (bytes21):", bytes21AppId)
    console.log("  - Source Chain ID:", taskArguments.sourceChainId)
    console.log("")
    console.log("Note: This adapter must be deployed on Oasis Sapphire to use ROFL functionality")
  })
