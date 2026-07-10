# Cryptocurrency Deep Dive

Blockchain technology, major cryptocurrencies, DeFi, and security.

## Blockchain Basics
- **Distributed ledger**: Transactions recorded in blocks, chained cryptographically across thousands of nodes. No central authority. Immutable (appended only, very difficult to alter history)
- **Consensus mechanisms**: Proof of Work (Bitcoin — miners solve hash puzzles, energy-intensive), Proof of Stake (Ethereum 2.0 — validators stake 32 ETH, chosen randomly to propose blocks, 99.95% less energy), Delegated PoS (EOS, Tron — voted delegates), Proof of Authority (private chains — approved validators)
- **Hashing**: SHA-256 (Bitcoin — 256-bit output), Keccak-256 (Ethereum). Input → fixed-length output, deterministic, one-way, collision-resistant. Mining = find nonce where block hash < target
- **Public-key cryptography**: Private key (secret — keep safe, controls funds) → Public key → Address (hashed public key). ECDSA (secp256k1 for Bitcoin, secp256r1 for others). Signatures prove ownership without revealing private key
- **UTXO model (Bitcoin)**: Unspent Transaction Outputs — account balance is sum of UTXOs. Transaction spends existing UTXOs, creates new ones. Complex but enables privacy analysis
- **Account model (Ethereum)**: Balance per address (like bank account). Transaction from one address to another. Simpler for programming (ERC-20 tokens)

## Major Cryptocurrencies
- **Bitcoin (BTC)**: First (2009, Satoshi Nakamoto). Store of value "digital gold". Fixed supply 21 million. PoW consensus. Block time ~10 min. Halving every 210k blocks (4 years). Transaction rate ~7 TPS (too slow for payments, good for settlement)
- **Ethereum (ETH)**: Smart contract platform (2015, Vitalik Buterin). Transitioned to PoS (The Merge, 2022). Gas fees (variable by network congestion). ERC-20 (tokens), ERC-721 (NFTs), ERC-1155 (multi-token). ~30 TPS base, L2 scaling (Arbitrum, Optimism, Base) pushes to 1000+ TPS
- **Solana (SOL)**: High throughput (65,000 TPS theoretical). Proof of History + PoS. Low fees (~$0.01). Multiple outages (network instability issues). Growing DeFi/NFTS ecosystem
- **Ripple (XRP)**: Payment settlement for banks. XRP Ledger uses consensus protocol (not PoW/PoS). Fast (3-5 sec), cheap ($0.0002). SEC lawsuit (2020-2023) — programmatic sales of XRP ruled not securities (July 2023 partial victory)
- **Litecoin (LTC)**: "Silver to Bitcoin's gold" — faster blocks (2.5 min), different hash (Scrypt — ASIC resistant initially). Less adoption, lower fees
- **Stablecoins**: USDT (Tether — largest, concerns about reserves), USDC (Circle/Coinbase — audited), DAI (MakerDAO — algorithmic, overcollateralized). Pegged 1:1 to USD. Used for trading, DeFi, payments

## Smart Contracts
- **Self-executing code on blockchain**: "If X happens, do Y" — no intermediaries. Immutable after deployment (unless upgradeable proxy pattern used)
- **Solidity**: Main language for Ethereum smart contracts. Compiles to EVM bytecode. Key concepts: address, mapping, struct, modifier (access control), event (logging), require/assert/revert (error handling), payable/send/transfer (ETH handling)
- **Common patterns**: Ownable (admin controls), Pausable (emergency stop), ReentrancyGuard (prevents reentrancy attack — OpenZeppelin), Pull over push payments, Upgradeable proxy (UUPS or Transparent)
- **Oracles**: Bridge blockchain ↔ real-world data. Chainlink (largest decentralized oracle network). Needed for DeFi (price feeds), insurance (weather data), prediction markets. Trusted data source problem — oracles introduce centralization risk
- **Gas optimization**: Pack structs tightly (uint128 fits in same slot as another uint128), use events instead of storage, Merkle proofs for airdrops, batch operations

## DeFi (Decentralized Finance)
- **AMM (Automated Market Maker)**: Uniswap — liquidity pools (X*Y=K formula). LPs provide tokens, earn fees. Impermanent loss risk (when price ratio changes)
- **Lending/borrowing**: Aave, Compound — supply assets earn interest, borrow collateral (must overcollateralize). Liquidations below collateral ratio. Variable and stable interest rates
- **Yield farming**: Provide liquidity/stake tokens → earn governance tokens + fees. High yields, high risk (impermanent loss, smart contract risk, rug pulls)
- **Liquid staking**: Lido, Rocket Pool — stake ETH for stETH (liquid derivative). Use staked ETH in DeFi while earning staking rewards. Centralization concerns
- **MEV (Maximal Extractable Value)**: Validators/ searchers reorder, insert, censor transactions for profit. Sandwich attacks, frontrunning. Flashbots mitigate by private mempool

## Security
- **cold storage**: Hardware wallet (Ledger, Trezor, Coldcard, KeepKey) — private keys never touch internet. $50-200. Most secure for long-term storage
- **Hot wallet**: Software wallet connected to internet (MetaMask, Phantom, Rainbow, Trust Wallet). Convenient, less secure. Use small amounts for daily transactions
- **Seed phrase**: 12 or 24 words (BIP-39). Write on paper (not digital). Store in safe/fireproof safe. If lost = funds gone forever. If exposed = funds stolen. Never type into website or app
- **Common scams**: Phishing (fake websites mimicking real ones), fake airdrops (connect wallet to scam site), rug pulls (devs drain liquidity), pig butchering (romance scam leading to fake investment platform), SIM swap (attacker transfers phone number to their SIM, resets password)
- **Smart contract risks**: Reentrancy (The DAO hack — $60M, 2016), flash loan attacks (billion$ exploited), oracle manipulation (price feed exploits), bridge hacks (Wormhole $325M, Ronin $620M)
- **DYOR (Do Your Own Research)**: Check team, audit reports (Trail of Bits, OpenZeppelin, Certik), tokenomics, lockup periods, community reputation. If something promises guaranteed returns = scam
