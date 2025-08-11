import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { task } from "hardhat/config"
import type { TaskArguments } from "hardhat/types"

import { verify } from ".."
import type { MockAdapter } from "../../../types/contracts/adapters/Mock/MockAdapter"
import type { MockReporter } from "../../../types/contracts/adapters/Mock/MockReporter"
import type { MockAdapter__factory } from "../../../types/factories/contracts/adapters/Mock/MockAdapter__factory"
import type { MockReporter__factory } from "../../../types/factories/contracts/adapters/Mock/MockReporter__factory"

// Deploy MockAdapter (for testing purposes only)
task("deploy:adapter:Mock")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying MockAdapter...")
    console.log("⚠️  WARNING: MockAdapter is for testing only. Never use in production!")

    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const mockAdapterFactory: MockAdapter__factory = <MockAdapter__factory>(
      await hre.ethers.getContractFactory("MockAdapter")
    )

    const mockAdapter: MockAdapter = <MockAdapter>await mockAdapterFactory.connect(signers[0]).deploy()
    await mockAdapter.deployed()

    console.log("MockAdapter deployed to:", mockAdapter.address)
    console.log("Remember: This adapter allows anyone to set arbitrary hashes. Use for testing only!")

    if (taskArguments.verify) await verify(hre, mockAdapter)
  })

// Deploy MockReporter (for testing purposes only)
task("deploy:reporter:Mock")
  .addParam("headerStorage", "address of the header storage contract")
  .addParam("yaho", "address of the Yaho contract")
  .addFlag("verify", "whether to verify the contract on Etherscan")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("Deploying MockReporter...")
    console.log("⚠️  WARNING: MockReporter is for testing only. Never use in production!")

    const signers: SignerWithAddress[] = await hre.ethers.getSigners()
    const mockReporterFactory: MockReporter__factory = <MockReporter__factory>(
      await hre.ethers.getContractFactory("MockReporter")
    )

    const constructorArguments = [taskArguments.headerStorage, taskArguments.yaho] as const

    const mockReporter: MockReporter = <MockReporter>(
      await mockReporterFactory.connect(signers[0]).deploy(...constructorArguments)
    )
    await mockReporter.deployed()

    console.log("MockReporter deployed to:", mockReporter.address)
    console.log("Remember: This reporter is for testing only!")

    if (taskArguments.verify) await verify(hre, mockReporter, constructorArguments)
  })
