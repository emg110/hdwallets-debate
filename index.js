import { mnemonicToSeedSync, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import algosdk from 'algosdk';

const COIN_TYPE = 283; // Algorand
const MNEMONIC_ENTROPY_BITS = 256; // 24-word mnemonic

function deriveAccount(rootOrSeed, accountIndex = 0) {
  const root = rootOrSeed instanceof HDKey
    ? rootOrSeed
    : HDKey.fromMasterSeed(rootOrSeed, 'ed25519');
  const path = `m/44'/${COIN_TYPE}'/${accountIndex}'`;
  return root.derive(path);
}

function nodeToAlgorandIdentity(node, index) {
  if (!node.privateKey) {
    throw new Error('Node does not expose private key material.');
  }

  const mnemonic = algosdk.mnemonicFromSeed(node.privateKey);
  const { addr, sk } = algosdk.mnemonicToSecretKey(mnemonic);

  return {
    index,
    mnemonic,
    address: addr.toString(),
    publicKeyHex: Buffer.from(addr.publicKey).toString('hex'),
    privateKeyHex: Buffer.from(sk).toString('hex'),
  };
}

function deriveAddressFromNode(node, index, hardened = true) {
  const child = node.deriveChild(index, hardened);
  return nodeToAlgorandIdentity(child, index);
}

function deriveAddresses(node, count, hardened = true) {
  const collection = [];
  for (let i = 0; i < count; i += 1) {
    collection.push(deriveAddressFromNode(node, i, hardened));
  }
  return collection;
}

(async () => {
  const mnemonic = generateMnemonic(wordlist, MNEMONIC_ENTROPY_BITS);
  console.log("Root Mnemonic:", mnemonic);

  const seed = mnemonicToSeedSync(mnemonic);
  const rootNode = HDKey.fromMasterSeed(seed, 'ed25519');
  const rootIdentity = nodeToAlgorandIdentity(rootNode);
  console.log("\nAlgorand identity derived directly from root mnemonic:");
  console.log("Address:", rootIdentity.address);
  console.log("Public Key:", rootIdentity.publicKeyHex);

  const accountNode = deriveAccount(rootNode, 4);
  console.log("\nExtended private for node 4:");
  console.log("Private key:", Buffer.from(accountNode.privateKey).toString('hex'));
  console.log("Chain code :", Buffer.from(accountNode.chainCode).toString('hex'));

  console.log("\nAddresses derived from node 4 via root path:");
  const rootDerived = deriveAddresses(accountNode, 3);
  for (const entry of rootDerived) {
    console.log(`Index ${entry.index}: ${entry.address}`);
    console.log(`  Mnemonic: ${entry.mnemonic}`);
    console.log(`  Public Key: ${entry.publicKeyHex}`);
  }

  const node4 = new HDKey({
    privateKey: accountNode.privateKey,
    chainCode: accountNode.chainCode,
  });

  console.log("\nDeriving again from only node 4 (no root seed):");
  const nodeDerived = deriveAddresses(node4, 3);
  for (const entry of nodeDerived) {
    console.log(`Index ${entry.index}: ${entry.address}`);
    console.log(`  Mnemonic: ${entry.mnemonic}`);
    console.log(`  Public Key: ${entry.publicKeyHex}`);
  }

  const mismatch = rootDerived.some((entry, idx) => entry.address !== nodeDerived[idx].address);
  if (mismatch) {
    console.error("\nMismatch detected between derivation methods.");
  } else {
    console.log("\nAll derived addresses match when using only the account node material.");
  }
})();
