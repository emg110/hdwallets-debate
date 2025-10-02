# HD Wallets Debate: Algorand Account Node Proof

This project demonstrates that hardened HD wallet key material for an Algorand account node is sufficient to derive all descendant addresses—even without access to the original root mnemonic or seed. The script walks through the full derivation path, extracts the node-level extended private key, and proves that rehydrating that node alone yields the exact same Algorand addresses.

## What the Script Shows

- Generates a 24-word BIP-39 mnemonic (256 bits of entropy) and converts it to a seed.
- Uses BIP-32 Ed25519 derivation with the BIP-44 path `m/44'/283'/4'` (Algorand coin type) to obtain the account node (index `4` in the example).
- Derives multiple hardened child addresses from that node and records their Algorand mnemonics, public keys, and addresses.
- Recreates the account node using only its private key + chain code (the extended private key material) and repeats the derivation.
- Compares the two address sets to prove they are identical, confirming that the extended private key at that level fully determines the subtree.

Because hardened derivation is used, **knowing the extended *private* key material for the node is enough to derive child private keys**, but the extended *public* key alone would not suffice. This mirrors standard HD wallet behaviour and resolves the debate for the Algorand coin type.

## Getting Started

### Prerequisites

- Node.js 18 or newer (ES module support is required).
- Dependencies listed in `package.json` (installed automatically with `npm install`).

### Installation

```bash
npm install
```

### Running the Proof Script

```bash
node index.js
```

Every run generates a fresh 24-word mnemonic, so the output will change each time. The script prints:

1. The root mnemonic phrase.
2. The Algorand address and public key corresponding directly to that mnemonic.
3. The extended private key (private key + chain code) for the chosen account node (`m/44'/283'/4'`).
4. Three Algorand addresses (with mnemonics and public keys) derived from that account node via the root derivation path.
5. The same three addresses derived again after reconstructing the node solely from its extended private key.
6. A final confirmation that both derivation methods match.

If the sets of addresses ever diverged, the script would emit a mismatch warning instead of the confirmation message.

## How the Proof Works

### 1. Generating Seed Material

- `generateMnemonic()` produces a 24-word English mnemonic.
- `mnemonicToSeedSync()` converts the mnemonic to a BIP-39 seed suitable for ed25519 HD derivation.

### 2. Navigating to the Account Node

- `HDKey.fromMasterSeed(seed, 'ed25519')` yields the master node compatible with ed25519.
- The path `m/44'/283'/4'` follows BIP-44 conventions:
  - `44'` designates purpose (BIP-44).
  - `283'` is Algorand’s registered coin type.
  - `4'` selects the example account index.

The resulting `HDKey` instance holds two critical pieces of information: a 32-byte private key and a 32-byte chain code. Together they constitute the extended private key for that node.

### 3. Deriving Child Addresses

- For each child index (`0`, `1`, `2`) the script performs a hardened derivation (`deriveChild(index, true)`), producing new private keys.
- Each private key is turned into an Algorand mnemonic and secret key using `algosdk.mnemonicFromSeed()` and `algosdk.mnemonicToSecretKey()`.
- The Algorand SDK then renders the public key and checksumed address.

### 4. Rehydrating the Node Without the Root

- The script reconstructs an `HDKey` instance using only the stored private key and chain code from the account node: `new HDKey({ privateKey, chainCode })`.
- Deriving the same hardened children from this reconstructed node yields the very same private keys, mnemonics, and addresses.

### 5. Demonstrating Equivalence

- A simple comparison step checks that the addresses derived via the full root path exactly match those derived from the isolated node. When they do—and they always should—the script prints:

  ```
  All derived addresses match when using only the account node material.
  ```

This equality is the concrete proof that possessing the extended private key at the account level suffices to regenerate all descendant Algorand addresses, even in the absence of the root mnemonic or seed.

## Customisation

- **Account Index:** Adjust the call `deriveAccount(rootNode, 4)` in `index.js` to explore other account indices.
- **Number of Child Addresses:** Change the `deriveAddresses(accountNode, 3)` invocation to derive more or fewer addresses.
- **Deterministic Testing:** Replace the randomly generated mnemonic with a fixed test vector if you need reproducible output for demos or automated tests.

## Security Notes

- The script logs highly sensitive material (mnemonics, private keys, chain codes). Treat output with the same care as real wallet backups.
- Never run this code against wallets that hold real funds unless you fully understand the security implications and environment safety.

## Example Output

```bash
Root Mnemonic: horse puppy disease genuine ridge cover maid inform shed devote judge student during winter tackle catch early require engage opera proud tourist evidence margin

Algorand identity derived directly from root mnemonic:
Address: TXO5DM7IO4EFLDUCMZPYQPZDRRLUABS2VJC655SDB3L7PB6NUEPZ6GNQ3I
Public Key: 9dddd1b3e87708558e82665f883f238c5740065aaa45eef6430ed7f787cda11f

Extended private for node 4:
Private key: 6bf77a6e884bb60c4fe4c48854b582ff6be3e8df850965c07d71f2ba9f99b2d5
Chain code : 89859b1fa3497bb3d00f6bf079ec9d6ebe3163f5121d4f73f055a297c5ccd585

Addresses derived from node 4 via root path:
Index 0: MQQST5N6L7HVOBDNWGCWHDENNHOKCPKSK3BU4KHEOWHVSDACUEOGNV5YVM
  Mnemonic: worry tone jealous game road apple board orbit believe prize fashion age february interest bind gap advice truly palace profit isolate all general abstract illegal
  PublicKey: 642129f5be5fcf57046db185638c8d69dca13d5256c34e28e4758f590c02a11c
Index 1: 45Y3UB6LYSEAW277LP3B4H4Y22OUI7MTH2TXOD6BRALV3N5GBKCXWOK4HY
  Mnemonic: myself pause ghost volcano sniff expose minimum stove cargo card echo hunt pair they change palm theory garden hazard price clump shrimp spice about path
  PublicKey: e771ba07cbc4880b6bff5bf61e1f98d69d447d933ea7770fc188175db7a60a85
Index 2: VHZTXDBWUCSEPY7Z7O6BFXJI2IMMSRNIL6UKH5FV55PZUBITJD4RCDDMWM
  Mnemonic: pluck crop unveil brand space elite tribe donate guitar response pitch device other dutch comfort pear circle attack suit tissue share extra muscle able royal
  PublicKey: a9f33b8c36a0a447e3f9fbbc12dd28d218c945a85fa8a3f4b5ef5f9a051348f9

Deriving again from only node 4 (no root seed):
Index 0: MQQST5N6L7HVOBDNWGCWHDENNHOKCPKSK3BU4KHEOWHVSDACUEOGNV5YVM
  Mnemonic: worry tone jealous game road apple board orbit believe prize fashion age february interest bind gap advice truly palace profit isolate all general abstract illegal
  PublicKey: 642129f5be5fcf57046db185638c8d69dca13d5256c34e28e4758f590c02a11c
Index 1: 45Y3UB6LYSEAW277LP3B4H4Y22OUI7MTH2TXOD6BRALV3N5GBKCXWOK4HY
  Mnemonic: myself pause ghost volcano sniff expose minimum stove cargo card echo hunt pair they change palm theory garden hazard price clump shrimp spice about path
  PublicKey: e771ba07cbc4880b6bff5bf61e1f98d69d447d933ea7770fc188175db7a60a85
Index 2: VHZTXDBWUCSEPY7Z7O6BFXJI2IMMSRNIL6UKH5FV55PZUBITJD4RCDDMWM
  Mnemonic: pluck crop unveil brand space elite tribe donate guitar response pitch device other dutch comfort pear circle attack suit tissue share extra muscle able royal
  PublicKey: a9f33b8c36a0a447e3f9fbbc12dd28d218c945a85fa8a3f4b5ef5f9a051348f9

All derived addresses match when using only the account node material.

```
## License

MIT. See [`LICENSE`](LICENSE).

