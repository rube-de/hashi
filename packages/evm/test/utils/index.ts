import { ethers } from "hardhat"
import { zeroPadValue, toBeHex } from "ethers"

export const toBytes32 = (_n: number) => zeroPadValue(toBeHex(_n), 32)
