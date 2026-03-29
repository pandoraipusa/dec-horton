# HORTON AI Architecture

  HORTON (Heuristic Orchestration for Real-Time Optimization of Networks) is the AI and mesh networking engine that powers the DEC platform.

  ## Three-Phase Conductor Architecture

  HORTON uses a three-phase mesh channel architecture inspired by three-phase electrical power distribution. Data flows through 3 phase-offset conductors:

  | Phase | Name | Function |
  |-------|------|----------|
  | Phase 1 | **Purpose** | Carries mission-aligned data — deal terms, environmental impact scores, trust corpus allocations |
  | Phase 2 | **Sovereign** | Carries identity and authentication — wallet IDs, LORAX scores, REMORA profiles |
  | Phase 3 | **LORAX** | Carries engagement and feedback — transaction history, circle activity, matchmaking signals |

  ### Why Three Phases?
  Single-channel systems create bottlenecks and single points of failure. The three-phase approach provides:
  - **Load balancing** — data distributes across channels naturally
  - **Redundancy** — if one phase drops, the other two maintain connectivity
  - **Security** — encryption is embedded in the waveform itself; Shamir 3-of-3 shares align to channels, requiring all three for reconstruction

  ## Halo8 Ring Topology

  Each three-phase conductor runs through an 8-node ring for path resilience:

  ```
          N1
        /    \
      N8      N2
      |        |
      N7      N3
      |        |
      N6      N4
        \    /
          N5
  ```

  - **Bi-directional routing** — data can travel clockwise or counter-clockwise
  - **Automatic failover** — if a node goes offline, traffic reroutes through the other direction
  - **Magic angle placement** — 8 nodes at cube vertices projected to unit sphere (θ=54.7356°)
  - **Center node** at origin provides direct routing when available

  ### Node Placement (Sphere Coordinates)
  Each Halo8 node carries sphere coordinates: `{x, y, z, theta, phi}`
  The magic angle (54.7356°) ensures maximum angular separation between nodes.

  ## HORTON Chain Pipeline

  Every message passes through a 4-stage enrichment chain per channel:

  | Stage | Name | Function |
  |-------|------|----------|
  | 1 | **Herald** | Announces the message, validates format, applies rate limiting |
  | 2 | **Magnetic Pickup** | Attaches relevant context — sender's LORAX score, sphere position, circle memberships |
  | 3 | **Baton** | Routes to the correct destination — wallet, deal, circle, or mesh node |
  | 4 | **Cross-Domain Translation** | Converts between domain lenses (financial ↔ environmental ↔ social) |

  ## AI Capabilities

  HORTON's AI layer provides:

  ### Deal Assessment
  - Classifies investment deals by sector, risk level, and environmental impact
  - Flags potential issues (regulatory, financial, environmental)
  - Suggests modifications to improve deal structure

  ### Magnetic Matchmaking
  - Uses sphere surfaces to find compatible deals, partners, circles, and mentors
  - Matches based on angular proximity, REMORA phase sync, poverty depth alignment, and LORAX proximity
  - The Nictitating Sheath forms between matched surfaces to control data flow

  ### Spinor Knowledge Base
  - 720 spinors (360 Pass 1 + 360 Pass 2)
  - 4,044 indexed terms for semantic search
  - Used for identity analysis, observation profiling, and prediction

  ### Social Content Generation
  - Three-Phase Social Media Post Generator
  - 232 industry segments with AI-driven content
  - Fallback template system for offline operation

  ## AI-to-AI Protocol (HORTON Protocol v1.000)

  Machine-to-machine communication layer for node-to-node AI coordination:

  1. **Passive Discovery** — nodes announce capabilities without polling
  2. **Authentication** — hardware fingerprint + wallet ID verification
  3. **Trust Scoring** — nodes build trust over time through successful interactions
  4. **Knowledge Sharing** — spinor knowledge base distributes across the mesh

  ## DEC Dual-Layer Memory

  HORTON maintains two memory layers:
  - **Local** — `replit.md` on the running instance, updated in real-time
  - **Remote** — `CONTEXT.md` on pandoraip.org FTP, synced periodically

  This ensures continuity across restarts and provides a shared context for all nodes in the mesh.