# DEC HORTON — Sovereign Banking for the Environment

**One install. One wallet. One mesh node. Join the global bank for the planet.**

DEC HORTON is a sovereign crypto platform that turns every device into a node in a decentralized environmental investment network. Install the wallet, register with your email, and you're banking — no middlemen, no minimums, no barriers.

Built by [PandoraIP](https://pandoraip.org) to fund green energy, NGOs, and sustainable ventures through intellectual property investment placements.

---

## What It Does

- **Sovereign Wallet** — Dual-currency (NC/WC) wallet with instant transfers, deposits, and peer loans
- **HORTON Mesh Network** — Your device becomes a mesh node; more devices = higher banking tier
- **Tap-to-Deal** — Create and join investment deals with a single tap code
- **FFF Shopping Circles** — Pool buying power with friends, family, and founders
- **Trust Corpus System** — Transparent fund tracking with automatic tax credits (DAI 2x Rule)
- **AI-Powered Social Outreach** — Generate industry-specific social media campaigns with the built-in Three-Phase Post Generator
- **LORAX Score** — Per-user engagement score that influences allocation and matchmaking

## Quick Start

### Option 1: Web Wallet (Instant)
Visit **[pandoraip.live](https://pandoraip.live)** → Click "Go to Wallet" → Enter your email → Done.

### Option 2: Chrome Extension
1. Download `horton-dec-v0.7.0.zip` from [Releases](../../releases)
2. Go to `chrome://extensions` → Enable Developer Mode
3. Click "Load unpacked" → Select the extracted folder
4. Click the extension icon → Register with your email

### Option 3: Desktop Installer (Full Node)
Download the installer for your platform from [Releases](../../releases):

| Platform | File |
|----------|------|
| Windows | `DEC-Wallet-Install-Uninstall-Windows.exe` |
| Mac (Apple Silicon) | `DEC-Wallet-Install-Uninstall-Mac-AppleSilicon` |
| Mac (Intel) | `DEC-Wallet-Install-Uninstall-Mac-Intel` |
| Linux | `DEC-Wallet-Install-Uninstall-Linux` |

**Double-click → Enter your email → Your node is live.**

The installer:
- Creates your DEC wallet (100 NC + 100 WC starter balance)
- Registers a HORTON mesh node with your hardware fingerprint
- Starts a local wallet server at `http://localhost:3141`
- Opens your browser for activation
- Sends you a confirmation email with your Wallet ID, Node ID, and banking tier

### Option 4: Run from Source
```bash
git clone https://github.com/YOUR_ORG/dec-horton.git
cd dec-horton
npm install
npm run dev
```

## Banking Tiers

The more nodes you run, the higher your banking tier:

| Nodes | Tier | Redundancy | Capacity |
|-------|------|-----------|----------|
| 1 | Solo | None | 1x |
| 2 | Paired | Basic | 1.5x |
| 3-4 | Fortified | High | 2-2.5x |
| 5+ | Sovereign | Full | 3x+ |

## Architecture

```
┌─────────────────────────────────────────────┐
│                 DEC Platform                │
├──────────┬──────────┬───────────────────────┤
│  Chrome  │ Desktop  │    Web Wallet         │
│Extension │Installer │  pandoraip.live       │
├──────────┴──────────┴───────────────────────┤
│              API Layer (Express)             │
├─────────────────────────────────────────────┤
│  DEC Tracker  │  HORTON Mesh  │  Deal Maker │
│  Wallet/TX    │  Node Network │  Tap Deals  │
├─────────────────────────────────────────────┤
│  Trust Corpus │  LORAX Score  │  FFF Circles│
│  DAI 2x Rule  │  NC/WC Alloc  │  Buy Power  │
├─────────────────────────────────────────────┤
│         PostgreSQL + Drizzle ORM            │
└─────────────────────────────────────────────┘
```

## Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Mesh**: HORTON 3-phase conductor architecture with Halo8 ring topology
- **AI**: OpenAI integration for deal assessment, matchmaking, and social content
- **Crypto**: ECC-384, AES-256-GCM + ChaCha20-Poly1305, Shamir 3-of-3 secret sharing

## API Endpoints

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dec-tracker/register` | Register new wallet |
| POST | `/api/dec-tracker/login-email` | Login by email |
| POST | `/api/dec-tracker/transactions` | Transfer NC/WC |
| POST | `/api/dec-tracker/deposit/create-session` | Create deposit session |

### Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dec-tracker/deals/tap/create-code` | Create a tap deal code |
| POST | `/api/dec-tracker/deals/tap/join` | Join a deal via code |

### Mesh
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboard/activate` | Activate node + wallet |
| POST | `/api/horton/mesh/register` | Register mesh node |
| POST | `/api/horton/mesh/heartbeat` | Node heartbeat |
| GET | `/api/horton/mesh/peers` | List active peers |

### Social Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social-post-generator` | Generate AI social posts |
| GET | `/api/industry-segments` | List 232 industry segments |

## The Mission

PandoraIP exists to build a **global bank for the environment**. Every wallet created, every node activated, every deal made contributes to a transparent Trust Corpus that funds:

- Green energy projects
- Environmental NGOs
- Sustainable technology ventures
- Poverty elimination initiatives

The 50-25-25 syndicate banking model ensures funds are split transparently: 50% to the Trust Corpus, 25% to operations, 25% to participant returns.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. We welcome contributions of all kinds:

- Code improvements and bug fixes
- New industry segments for the social post generator
- Translations and accessibility improvements
- Documentation and tutorials
- Running a node (yes, that counts!)

## License

MIT License — See [LICENSE](LICENSE) for details.

## Links

- **Live Platform**: [pandoraip.live](https://pandoraip.live)
- **Organization**: [pandoraip.org](https://pandoraip.org)
- **Downloads**: [pandoraip.org/downloads](https://pandoraip.org/downloads/)
- **Contact**: pandoraip.usa@pandoraip.org

---

*"The earth is what we all have in common." — Install a node. Fund the future.*
