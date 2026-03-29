# Installation Guide

  Four ways to get started with DEC HORTON, from easiest to most powerful.

  ## Option 1: Web Wallet (Instant, No Download)

  1. Visit **[pandoraip.live](https://pandoraip.live)**
  2. Click **"Go to Wallet"** on the dashboard
  3. Enter your email address
  4. Your wallet is ready — 100 NC + 100 WC starter balance

  Best for: Quick access, trying the platform, mobile users.

  ## Option 2: Chrome Extension

  1. Download `horton-dec-v0.7.0.zip` from [GitHub Releases](https://github.com/pandoraipusa/dec-horton/releases)
  2. Open Chrome → navigate to `chrome://extensions`
  3. Enable **Developer Mode** (toggle in top right)
  4. Click **"Load unpacked"**
  5. Select the extracted folder
  6. Click the DEC extension icon in your toolbar
  7. Register with your email

  Best for: Always-available wallet in your browser, quick transactions.

  ## Option 3: Desktop Installer (Full Node)

  Download the installer for your platform:

  | Platform | File |
  |----------|------|
  | Windows | [DEC-Wallet-Install-Uninstall-Windows.exe](https://pandoraip.org/downloads/DEC-Wallet-Install-Uninstall-Windows.exe) |
  | Mac (Apple Silicon) | [DEC-Wallet-Install-Uninstall-Mac-AppleSilicon](https://pandoraip.org/downloads/DEC-Wallet-Install-Uninstall-Mac-AppleSilicon) |
  | Mac (Intel) | [DEC-Wallet-Install-Uninstall-Mac-Intel](https://pandoraip.org/downloads/DEC-Wallet-Install-Uninstall-Mac-Intel) |
  | Linux | [DEC-Wallet-Install-Uninstall-Linux](https://pandoraip.org/downloads/DEC-Wallet-Install-Uninstall-Linux) |

  ### Installation Steps:
  1. Download the file for your platform
  2. **Windows:** Double-click the .exe
  3. **Mac:** Open Terminal, run `chmod +x` on the file, then `./DEC-Wallet-Install-Uninstall-Mac-AppleSilicon`
  4. **Linux:** Open Terminal, run `chmod +x` on the file, then `./DEC-Wallet-Install-Uninstall-Linux`
  5. Enter your email when prompted
  6. Your browser opens for activation
  7. Check your email for confirmation with Wallet ID and Node ID

  ### What the Installer Does:
  - Creates your DEC wallet (100 NC + 100 WC)
  - Registers a HORTON mesh node with your hardware fingerprint
  - Starts a local wallet server at http://localhost:3141
  - Optionally flashes your NIC for mesh routing

  ### Uninstall:
  Run the same installer again — it detects the existing installation and offers to uninstall.

  ## Option 4: Run from Source

  ```bash
  # Clone the repository
  git clone https://github.com/pandoraipusa/dec-horton.git
  cd dec-horton

  # Install dependencies
  npm install

  # Start the local wallet server
  node tools/local-wallet-server.js

  # Server runs at http://localhost:3141
  ```

  ## After Installation

  Once installed, you can:
  - **Transfer** NC/WC to other wallets
  - **Create deals** using Tap-to-Deal
  - **Join shopping circles** with friends
  - **View your LORAX score** and banking tier
  - **Access the full dashboard** at pandoraip.live

  ## Multiple Devices

  Install on multiple devices with the same email to increase your banking tier:
  - 2 devices = **Paired** tier (basic redundancy)
  - 3-4 devices = **Fortified** tier (high redundancy)
  - 5+ devices = **Sovereign** tier (full mesh cluster)