// Debug script to check on-chain Deriverse data
import { createSolanaRpc, address, getProgramDerivedAddress, getAddressEncoder } from '@solana/kit';

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';

// AccountType enum from SDK
const AccountType = {
  ROOT: 2,
  COMMUNITY: 34,
  TOKEN: 4,
};

async function getAccountByTag(programId: string, version: number, tag: number) {
  const drvsAuthority = (await getProgramDerivedAddress({
    programAddress: address(programId),
    seeds: ["ndxnt"]
  }))[0];

  const buf = Buffer.alloc(8);
  buf.writeInt32LE(version, 0);
  buf.writeInt32LE(tag, 4);

  const accountAddress = (await getProgramDerivedAddress({
    programAddress: address(programId),
    seeds: [buf, getAddressEncoder().encode(drvsAuthority)]
  }))[0];

  return accountAddress;
}

async function checkVersion() {
  const rpc = createSolanaRpc(RPC_URL);

  console.log('Program ID:', PROGRAM_ID);
  console.log('RPC URL:', RPC_URL);
  console.log('\n--- Checking different versions ---\n');

  // Try versions 1-15 to see which ones have valid accounts
  for (let version = 1; version <= 15; version++) {
    try {
      const rootAccount = await getAccountByTag(PROGRAM_ID, version, AccountType.ROOT);
      const accountInfo = await rpc.getAccountInfo(rootAccount, {
        commitment: 'confirmed',
        encoding: 'base64'
      }).send();

      if (accountInfo.value !== null) {
        console.log(`Version ${version}: ✓ ROOT account found at ${rootAccount}`);
        console.log(`  - Data length: ${accountInfo.value.data[0].length} bytes (base64)`);

        // Decode and check the stored version
        const buffer = Buffer.from(accountInfo.value.data[0], 'base64');
        const storedTag = buffer.readUint32LE(0);
        const storedVersion = buffer.readUint32LE(4);
        console.log(`  - Stored tag: ${storedTag}`);
        console.log(`  - Stored version: ${storedVersion}`);
        console.log(`  - Buffer size: ${buffer.length} bytes`);
      } else {
        console.log(`Version ${version}: ✗ No account found`);
      }
    } catch (err) {
      console.log(`Version ${version}: ✗ Error - ${(err as Error).message}`);
    }
  }
}

checkVersion().catch(console.error);
