import { mnemonicToSeedSync, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import algosdk from 'algosdk';

const COIN_TYPE = 283; // Algorand

function deriveAccount(seed, accountIndex = 0) {
  const root = HDKey.fromMasterSeed(seed, 'ed25519');
  const path = `m/44'/${COIN_TYPE}'/${accountIndex}'`;
  const node = root.derive(path);
  return node;
}

function deriveAddressFromNode(node, index) {
  const child = node.deriveChild(index, true); // hardened
  const sk = child.privateKey;
  const mnemonic = algosdk.mnemonicFromSeed(sk);
  console.log(`Derived Mnemonic for Address ${index}:`, mnemonic);
  const algoAccount = algosdk.mnemonicToSecretKey(mnemonic);
  console.log(`Derived PublicKey for Address ${index}:`, algoAccount.addr);
  const addr = algoAccount.addr;
  return { addr, sk: Buffer.from(sk).toString('hex') };
}

(async () => {
  const mnemonic = generateMnemonic(wordlist);
  console.log("Root Mnemonic:", mnemonic);

  const seed = mnemonicToSeedSync(mnemonic);
  const accountNode = deriveAccount(seed, 4);
  console.log("\nExtended private for node 4:");
  console.log("Private key:", Buffer.from(accountNode.privateKey).toString('hex'));
  console.log("Chain code :", Buffer.from(accountNode.chainCode).toString('hex'));

  console.log("\nAddresses derived from node 4:");
  for (let i = 0; i < 3; i++) {
    const { addr } = deriveAddressFromNode(accountNode, i);
    console.log(`Address ${i}:`, addr);
  }


  const node4 = new HDKey({
    privateKey: accountNode.privateKey,
    chainCode: accountNode.chainCode,
  });

  console.log("\nDeriving again from only node 4 (no root seed):");
  for (let i = 0; i < 3; i++) {
    const { addr } = deriveAddressFromNode(node4, i);
    const address = algosdk.encodeAddress(addr.publicKey)
    console.log(`Address ${i}:`, address);
    console.log(`PublicKey ${i}:`, addr);
  }
})();