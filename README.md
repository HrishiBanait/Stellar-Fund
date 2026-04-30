<div align="center">

# ✦ StellarFund

**Decentralised crowdfunding on the Stellar blockchain — powered by Soroban smart contracts.**

[![Stellar](https://img.shields.io/badge/Network-Stellar_Testnet-gold?style=flat-square&logo=stellar&logoColor=black)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/VM-Soroban-f0b429?style=flat-square)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-4ec98d?style=flat-square)](#license)

[View Contract on Explorer](https://stellar.expert) · [Live Demo](#) · [Report a Bug](../../issues)

</div>

---

## Overview

StellarFund is a trustless, non-custodial crowdfunding platform built on the **Stellar testnet**. Campaign creators and donors interact directly with a Soroban smart contract — no intermediaries, no platform fees, every transaction traceable on-chain.

The interface is designed for clarity and speed: connect a wallet in one click, launch a campaign in seconds, and track donations as they land in real-time via a live event feed.

---

## Features

- **Multi-wallet support** — Connect with Freighter, Albedo, or xBull
- **Soroban smart contracts** — All campaign logic lives on-chain, fully auditable
- **Real-time event feed** — Live ledger polling surfaces every donation and campaign creation as it happens
- **Friendbot funding** — One-click testnet XLM top-up for quick onboarding
- **Responsive UI** — Works on desktop and mobile, collapsing to a single-column layout below 960px
- **Dark editorial design** — Playfair Display + DM Sans, amber/gold palette, grain texture overlay, no generic AI aesthetics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Blockchain | Stellar Testnet |
| Smart contracts | Soroban (Rust) |
| Wallet integration | Freighter, Albedo, xBull |
| Notifications | Sonner |
| Icons | Lucide React |
| Fonts | Google Fonts — Playfair Display, DM Sans, DM Mono |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm
- A Stellar-compatible wallet browser extension ([Freighter](https://www.freighter.app/) recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/HrishiBanit/Stellar-Fund.git
cd stellar-fund

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local
```

### Environment Variables

Open `.env.local` and fill in the required values:

```env
# The deployed Soroban contract ID on testnet
NEXT_PUBLIC_CONTRACT_ID=your_contract_id_here

# Stellar Horizon RPC endpoint (testnet)
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Block explorer base URL
NEXT_PUBLIC_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

### Running Locally

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
stellar-fund/
├── app/
│   ├── page.tsx              # Main page — layout, wallet state, campaign list
│   └── layout.tsx            # Root layout, font imports
├── components/
│   ├── CampaignCard.tsx      # Individual campaign display + donate flow
│   └── CreateCampaign.tsx    # Campaign creation form
├── lib/
│   ├── constants.ts          # CONTRACT_ID, EXPLORER_URL, WALLET_INFO
│   ├── contract.ts           # Soroban contract calls, event polling
│   ├── wallet.ts             # Wallet connect, Friendbot, balance fetch
│   └── errors.ts             # Custom error classes
├── styles/
│   └── globals.css           # Design system — tokens, components, animations
└── public/
    └── ...                   # Static assets
```

---

## Smart Contract

The Soroban contract handles all campaign logic:

| Function | Description |
|---|---|
| `create_campaign` | Creates a new campaign with a title, description, and funding goal |
| `donate` | Sends XLM to a campaign; emits a `Donated` event |
| `get_campaign` | Returns campaign details by index |
| `get_campaign_count` | Returns the total number of campaigns |

Contract events are polled on a 6-second interval and surfaced in the live event feed in the sidebar.

---

## Wallet Setup

### Freighter (Recommended)

1. Install the [Freighter extension](https://www.freighter.app/)
2. Create or import a Stellar account
3. Switch the network to **Testnet** in Freighter settings
4. Click **Connect Wallet** in StellarFund and select Freighter

### Funding Your Testnet Account

Testnet accounts start with a zero balance. After connecting, click the **coin icon** (🪙) in the wallet chip to trigger Friendbot and receive 10,000 XLM instantly.

---

## Usage

### Creating a Campaign

1. Connect your wallet
2. Fill in the **New Campaign** form — title, description, and funding goal (in XLM)
3. Click **Launch Campaign** and confirm the transaction in your wallet
4. Your campaign appears in the list immediately after ledger confirmation

### Donating to a Campaign

1. Connect your wallet and ensure your balance is sufficient
2. Find the campaign you want to support
3. Enter a donation amount and click **Donate**
4. Confirm the transaction in your wallet
5. The campaign's progress bar updates in real-time

---

## Design System

The UI is built around a single `globals.css` file that defines the full design system via CSS custom properties. Key tokens:

```css
--gold:      #f0b429;   /* Primary accent */
--bg:        #0d0c0a;   /* Page background */
--surface:   #161410;   /* Card background */
--text:      #f5efe6;   /* Primary text */
--font-display: 'Playfair Display', serif;
--font-body:    'DM Sans', sans-serif;
--font-mono:    'DM Mono', monospace;
```

Component classes follow a consistent naming pattern — `.btn-gold`, `.btn-ghost`, `.card`, `.card-header`, `.live-dot`, `.progress-track`, etc. — making it straightforward to apply styles to new components without touching `page.tsx`.

---



## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ♦ on the Stellar testnet · Orange Belt Submission

</div>
