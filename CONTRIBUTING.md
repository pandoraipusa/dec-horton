# Contributing to DEC HORTON

Thanks for your interest in building the global bank for the environment. Every contribution matters.

## Ways to Contribute

### Run a Node
The simplest contribution — download the installer, activate it, and you're strengthening the mesh network.

### Report Bugs
Open an issue with:
- What you expected to happen
- What actually happened
- Your platform (Windows/Mac/Linux) and browser
- Steps to reproduce

### Submit Code
1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test locally: `npm run dev`
5. Commit with a clear message: `git commit -m "Add: description of change"`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

### Add Industry Segments
The Three-Phase Social Media Post Generator supports 232 industry segments. To add more:
1. Check existing segments at `/api/industry-segments`
2. Add new segments via the admin panel or submit a PR with the segment data
3. Include: name, sector, description, and relevant keywords

### Improve Documentation
- Fix typos, clarify instructions, add examples
- Translate documentation to other languages
- Write tutorials for specific use cases

## Code Guidelines

- **TypeScript** for all new code
- **Drizzle ORM** for database operations — no raw SQL unless necessary
- **Zod** for request validation
- Keep API routes thin — business logic goes in storage/service layers
- Add `data-testid` attributes to interactive UI elements

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Route pages
│   │   ├── components/ # Reusable components
│   │   └── lib/     # Utilities and API calls
│   └── public/      # Static files
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database operations
│   └── horton-endpoint.ts  # Mesh network endpoints
├── shared/          # Shared types and schemas
│   └── schema.ts    # Drizzle schema (source of truth)
└── packages/
    └── horton-dec/  # Installer, tools, and mesh node
        ├── tools/   # CLI tools
        └── dist/    # Built executables
```

## Questions?

- Open a Discussion on GitHub
- Email: pandoraip.usa@pandoraip.org
- Visit: [pandoraip.org](https://pandoraip.org)
