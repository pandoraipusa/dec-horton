# Mesh Network

  Every DEC installation becomes a node in the HORTON mesh network. Nodes communicate peer-to-peer, provide redundancy, and strengthen the platform's decentralized infrastructure.

  ## Node Registration

  When a user installs the DEC Wallet (desktop or extension), the system:

  1. **Generates a hardware fingerprint** — NIC MAC + CPU + hostname + machine ID
  2. **Detects location** — GPS/ZIP via IP geolocation
  3. **Registers the node** — Creates entry in `hortonInstallations` table
  4. **Registers network interfaces** — Catalogs all available NICs (Wi-Fi, Ethernet, cellular)
  5. **Assigns to cluster** — Groups nodes by email into personal mesh clusters
  6. **Sends confirmation email** — Wallet ID, Node ID, banking tier, platform

  ## Banking Tiers

  | Nodes | Tier | Redundancy | Base Capacity | Description |
  |-------|------|-----------|---------------|-------------|
  | 1 | **Solo** | None | 1.0x | Single node, no failover |
  | 2 | **Paired** | Basic | 1.5x | Two nodes, basic redundancy |
  | 3-4 | **Fortified** | High | 2.0-2.5x | Multiple nodes, high availability |
  | 5+ | **Sovereign** | Full | 3.0x+ | Full mesh cluster, sovereign banking |

  ### Path Diversity Bonus
  Nodes connected via different network types (Wi-Fi, Ethernet, cellular) receive a diversity bonus:
  - 2 network types: +0.25 capacity
  - 3+ network types: +0.50 capacity

  ### Cluster Health
  Calculated as: `min(100, nodeCount × 25 + diversity × 10)`

  ## Personal Mesh Clusters

  When a user registers 2+ nodes, they automatically form a personal mesh cluster:

  ```json
  {
    "clusterId": "cluster-user-email",
    "nodeCount": 3,
    "bankingTier": "fortified",
    "redundancyLevel": "high",
    "failoverEnabled": true,
    "totalCapacity": 2.25,
    "interfaceCount": 5,
    "pathDiversity": 2,
    "networkTypes": ["wifi", "ethernet"],
    "clusterHealth": 95
  }
  ```

  ## NIC Flash (Optional)

  For advanced users, the installer can flash the network interface card for hardware-level mesh routing:
  - Creates a backup of original NIC firmware
  - Flashes mesh-optimized firmware
  - Can be reversed by running the installer again
  - Requires administrator/root privileges

  ## Heartbeat System

  Active nodes send periodic heartbeats to maintain online status:
  - Endpoint: `POST /api/horton/mesh/heartbeat`
  - Includes node health, interface status, and cluster info
  - Nodes marked offline after missed heartbeats

  ## Peer Discovery

  Nodes discover each other through:
  - Central registry: `GET /api/horton/mesh/peers`
  - Passive discovery via the HORTON AI Protocol
  - Direct peer-to-peer once addresses are known