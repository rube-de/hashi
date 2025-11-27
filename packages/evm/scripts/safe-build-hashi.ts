// scripts/safe-build-hashi.ts
// Hardhat + ethers v6
import * as fs from "node:fs"
import * as path from "node:path"
import hre from "hardhat"

function nowUnix(): number {
  return Math.floor(Date.now() / 1000)
}

async function main() {
  // Optional CLI args/envs
  // --name: label inside Safe Transaction Builder UI
  // --out:  output file path
  // --safe: (optional) Safe address just for metadata (not required for validity)
  const args = process.argv.slice(2)
  const arg = (k: string, def?: string) => {
    const i = args.findIndex((a) => a === `--${k}`)
    return i >= 0 && i + 1 < args.length ? args[i + 1] : def
  }

  const label = arg("name", "Deploy Hashi")
  const outPath = arg("out", `./safe-tx-hashi-${hre.network.name}.json`)
  const safeAddr = arg("safe", process.env.SAFE_ADDRESS || "")

  // Compile to ensure bytecode is there
  await hre.run("compile")

  // Get creation data (no constructor args for Hashi)
  const factory = await hre.ethers.getContractFactory("Hashi")
  const deployTx = await factory.getDeployTransaction()
  const creationData = deployTx.data
  if (!creationData) {
    throw new Error("Failed to get creation bytecode for Hashi.")
  }

  // chainId
  let chainIdStr: string
  if (hre.network.config.chainId) {
    chainIdStr = String(hre.network.config.chainId)
  } else {
    const chainIdHex: string = await hre.ethers.provider.send("eth_chainId", [])
    chainIdStr = BigInt(chainIdHex).toString()
  }

  // Build Safe Transaction Builder JSON
  // Reference: Safe App Transaction Builder expects:
  // { version, chainId, createdAt, meta, transactions[] }
  // For raw creation: to = 0x000...000, value = "0", data = <creation bytecode>
  const payload = {
    version: "1.0",
    chainId: chainIdStr,
    createdAt: nowUnix(),
    meta: {
      name: label,
      description: "Contract creation: Hashi",
      txBuilderVersion: "1.16.x",
      createdFromSafeAddress: safeAddr || "",
      createdFromOwnerAddress: "",
      checksum: "", // optional; Safe will compute its own
    },
    transactions: [
      {
        to: "0x0000000000000000000000000000000000000000",
        value: "0",
        data: creationData,
        operation: 0, // CALL
        contractMethod: null, // raw tx
        contractInputsValues: null,
      },
    ],
  }

  // Write file
  const abs = path.resolve(outPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2))
  console.log(`✓ Safe JSON written: ${abs}`)
  console.log(`- Network: ${hre.network.name} (chainId ${chainIdStr})`)
  console.log(`- Tx count: ${payload.transactions.length}`)
  console.log("Import this file in Safe > Transaction Builder > Load from JSON.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
