#!/usr/bin/env node
/**
 * Debug script: fetch recent transactions for a wallet and print log message formats.
 * Run: node scripts/debug-wallet-logs.mjs <WALLET_ADDRESS>
 * Or set WALLET in env.
 *
 * This helps verify whether Deriverse "Program data: " logs appear in getParsedTransaction.
 */
const WALLET = process.env.WALLET || process.argv[2] || '8TZzKmK5SuZimDNyvPRXQVDEBgD4GpjrZMLVPcsppTPQ';
const RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
const LIMIT = 5;

async function main() {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [WALLET, { limit: LIMIT }],
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.error('RPC error:', data.error);
    process.exit(1);
  }
  const sigs = data.result || [];
  console.log('Wallet:', WALLET);
  console.log('RPC:', RPC);
  console.log('Signatures (first', LIMIT, '):', sigs.length);
  if (sigs.length === 0) {
    console.log('No transactions found.');
    return;
  }

  for (const s of sigs) {
    const txRes = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          s.signature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
        ],
      }),
    });
    const txData = await txRes.json();
    const tx = txData.result;
    if (!tx?.meta?.logMessages) {
      console.log('\n---', s.signature.slice(0, 16) + '...', '---');
      console.log('No logMessages');
      continue;
    }
    const logs = tx.meta.logMessages;
    const programData = logs.filter((m) => m.startsWith('Program data: '));
    const programLog = logs.filter((m) => m.startsWith('Program log: '));
    console.log('\n---', s.signature.slice(0, 20) + '...', '---');
    console.log('Total log lines:', logs.length);
    console.log('"Program data: " count:', programData.length);
    console.log('"Program log: " count:', programLog.length);
    if (programData.length > 0) {
      console.log('First Program data (len):', programData[0].length);
    }
    if (logs.length <= 15) {
      logs.forEach((l, i) => console.log(' ', i, l.slice(0, 80) + (l.length > 80 ? '...' : '')));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
