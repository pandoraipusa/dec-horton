# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DEC HORTON, please report it responsibly:

**Email**: pandoraip.usa@pandoraip.org

**Subject**: [SECURITY] Brief description

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Encryption Standards

DEC HORTON uses:
- **ECC-384** for key exchange
- **AES-256-GCM** for symmetric encryption
- **ChaCha20-Poly1305** as alternate cipher
- **Shamir 3-of-3** secret sharing for key recovery

## Scope

The following are in scope for security reports:
- API authentication and authorization bypasses
- Wallet balance manipulation
- Mesh node impersonation
- Data exposure or leakage
- Cryptographic weaknesses

Please do **not** report:
- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report those upstream)
