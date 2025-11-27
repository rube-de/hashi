// hardhat + ethers v6
import * as fs from "node:fs"
import * as path from "node:path"
import hre from "hardhat"

function nowUnix() {
  return Math.floor(Date.now() / 1000)
}

async function main() {
  const args = process.argv.slice(2)
  const get = (k: string, d?: string) => {
    const i = args.indexOf(`--${k}`)
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d
  }

  const SHOYU_BASHI = get("shoyu", "0x42E59595e63898b22256318a3B49DDDc29A258eF")! // 0x...
  const DOMAIN = BigInt(get("domain", "11155111")!) // e.g., 11155111
  const ADAPTERS = get("adapters", "0x2c34a7635475AAB04cC002598CECFb5F5615960d")!
    .split(",")
    .map((s) => s.trim()) // 0xA,0xB
  const THRESHOLD = BigInt(get("threshold", "1")!) // e.g., 2
  const LABEL = get("name", "ShoyuBashi: enableAdapters")
  const OUT = get("out", `./safe-enable-adapters-${hre.network.name}.json`)
  const SAFE = get("safe", process.env.SAFE_ADDRESS || "")

  if (!SHOYU_BASHI || ADAPTERS.length === 0) throw new Error("Missing params")

  // Minimal iface for encoding
  const abi = [
    {
      inputs: [
        { internalType: "uint256", name: "domain", type: "uint256" },
        { internalType: "address[]", name: "adapters", type: "address[]" },
        { internalType: "uint256", name: "threshold", type: "uint256" },
      ],
      name: "enableAdapters",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ]

  const iface = new hre.ethers.Interface(abi as any)
  const data = iface.encodeFunctionData("enableAdapters", [DOMAIN, ADAPTERS, THRESHOLD])

  // chainId
  const cid = hre.network.config.chainId
    ? String(hre.network.config.chainId)
    : BigInt(await hre.ethers.provider.send("eth_chainId", [])).toString()

  const payload = {
    version: "1.0",
    chainId: cid,
    createdAt: nowUnix(),
    meta: {
      name: LABEL,
      description: "Call ShoyuBashi.enableAdapters(domain, adapters, threshold)",
      txBuilderVersion: "1.16.x",
      createdFromSafeAddress: SAFE || "",
      createdFromOwnerAddress: "",
      checksum: "",
    },
    transactions: [
      {
        to: SHOYU_BASHI,
        value: "0",
        data,
        operation: 0,
        contractMethod: {
          name: "enableAdapters",
          payable: false,
          inputs: [
            { name: "domain", type: "uint256", internalType: "uint256" },
            { name: "adapters", type: "address[]", internalType: "address[]" },
            { name: "threshold", type: "uint256", internalType: "uint256" },
          ],
        },
        contractInputsValues: {
          domain: DOMAIN.toString(),
          adapters: ADAPTERS,
          threshold: THRESHOLD.toString(),
        },
      },
    ],
  }

  const abs = path.resolve(OUT)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2))
  console.log(`✓ Wrote Safe JSON: ${abs}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
