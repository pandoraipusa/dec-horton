# DEC Tracker Wallet

  The DEC Tracker is the user-facing sovereign wallet — a lightweight, email-based wallet system with dual currencies, peer transfers, deal participation, and shopping circles.

  ## Registration

  Registration is email-based with no passwords required. Four entry points:

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | Chrome Extension | `/api/dec-tracker/register` | Extension popup registration |
  | Web Registration | `/api/onboard/register` | pandoraip.org/register.html |
  | Desktop Installer | `/api/onboard/activate` | Unified installer activation |
  | Web Wallet Login | `/api/dec-tracker/login-email` | pandoraip.live/dec-tracker |

  Every new wallet receives:
  - **100 NC** (Natural Capital) starter balance
  - **100 WC** (World Capital) starter balance
  - A unique wallet ID (format: `DEC-XXXXXXXXXXXX`)
  - A LORAX score initialized at baseline

  ## Dual Currency System

  | Currency | Symbol | Purpose |
  |----------|--------|---------|
  | **NC** (Natural Capital) | NC | Environmental investment, green project funding, trust corpus contributions |
  | **WC** (World Capital) | WC | Operational transactions, peer transfers, circle purchases |

  ### ECR (Exchange and Credit Rate)
  The ECR system provides fixed rates for capital formation and tax credits. NC and WC are allocated based on the user's LORAX score.

  ## Core Features

  ### Transfers
  - Wallet-to-wallet transfers (NC or WC)
  - YOPP (You Own the Purchase Protocol) — receiver must confirm
  - Debt tracking for peer loans

  ### Deposits
  - Stripe-powered deposit sessions
  - Deposit splits follow the DAI 2x Rule

  ### Tap-to-Deal
  - Create a deal with a single tap code
  - Share the code — others join by entering it
  - AI classifies deals by sector, risk, and impact

  ### FFF Shopping Circles
  - Groups of friends, family, and founders
  - Combined buying power calculated by mathematical model
  - Weighted LORAX centroid on sphere surface

  ### 95% Cashback
  - DEC Trust returns 95% of transaction value as NC/WC credits
  - Encourages circulation within the ecosystem

  ### Receipt Scanning
  - AI vision analyzes uploaded receipts
  - Extracts purchase data for Trust Corpus processing

  ## Trust Corpus Purchase Pipeline

  When a purchase flows through the Trust Corpus:

  1. **DAI 2x Rule** applies — contribution splits 50/50 between NC and WC
  2. **Tax credits** generated automatically
  3. **Trust Corpus Account** updated transparently
  4. **Public Ledger** records the transaction

  ## Page Unlocking

  The DEC Tracker uses progressive page unlocking based on engagement:
  - New users see core wallet features
  - As LORAX score increases, additional pages unlock
  - Admin and Government Auditor views require role elevation