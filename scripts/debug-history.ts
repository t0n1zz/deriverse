
import { Connection, PublicKey } from '@solana/web3.js';
import { Engine } from '@deriverse/kit';
import { createSolanaRpc } from '@solana/kit';
import { fetchTradeHistory } from '../src/lib/deriverse/history';
// Polyfill for fetch if needed in node environment, but newer node has it
// Using ts-node or tsx should handle module resolution if tsconfig is correct.

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID || 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
const VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION || '12', 10);

async function main() {
  const walletAddress = '8TZzKmK5SuZimDNyvPRXQVDEBgD4GpjrZMLVPcsppTPQ';
  console.log(`Debug History for: ${walletAddress}`);
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Program ID: ${PROGRAM_ID}`);

  try {
    const rpc = createSolanaRpc(RPC_URL);
    const engine = new Engine(rpc, {
      programId: PROGRAM_ID as any,
      version: VERSION,
      uiNumbers: true,
      commitment: 'confirmed',
    });

    console.log('Initializing Engine...');
    const initSuccess = await engine.initialize();
    if (!initSuccess) {
      console.error('Failed to initialize engine');
      return;
    }
    console.log('Engine initialized.');

    const connection = new Connection(RPC_URL, 'confirmed');

    console.log('Fetching history...');
    const trades = await fetchTradeHistory(connection, engine, walletAddress, 50);

    console.log(`Found ${trades.length} trades.`);
    if (trades.length > 0) {
      console.log('Sample trade:', JSON.stringify(trades[0], null, 2));
      console.log('All IDs:', trades.map(t => t.id));
    } else {
      // Dig deeper if empty
      const pubkey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 });
      console.log(`Found ${signatures.length} signatures on chain.`);
      if (signatures.length > 0) {
        console.log('Sample signature:', signatures[0].signature);
        // check parsed tx
        const tx = await connection.getParsedTransaction(signatures[0].signature, { maxSupportedTransactionVersion: 0 });
        console.log('Sample TX logs:', tx?.meta?.logMessages);
        // Try decoding
        try {
          const decoded = engine.logsDecode(tx?.meta?.logMessages || []);
          console.log('Decoded logs count:', decoded.length);
          if (decoded.length > 0) console.log('First log tag:', decoded[0].tag);
        } catch (e) {
          console.error('Decode failed:', e);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
