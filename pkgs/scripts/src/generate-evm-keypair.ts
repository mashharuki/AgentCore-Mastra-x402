import { randomBytes } from "node:crypto";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = `0x${randomBytes(32).toString("hex")}` as Hex;
const account = privateKeyToAccount(privateKey);

console.log("EVM key pair generated");
console.log(`Private Key: ${privateKey}`);
console.log(`Wallet Address: ${account.address}`);
