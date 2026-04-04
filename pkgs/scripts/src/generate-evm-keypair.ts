import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = `0x${randomBytes(32).toString("hex")}` as Hex;
const account = privateKeyToAccount(privateKey);
const outputPath = resolve(process.cwd(), "evm-keypair.json");

writeFileSync(
  outputPath,
  JSON.stringify(
    {
      privateKey,
      walletAddress: account.address,
    },
    null,
    2,
  ),
);

console.log(`EVM key pair written to: ${outputPath}`);
