# Security maintenance

Security hardening after the archived v1.0.0-rc.2:

- Updated the locked dependency tree, including Axios and Vite.
- Upgraded georaster's installed worker-loader toolchain to worker-loader 3 / Webpack 5
  via npm overrides. The published georaster browser bundle and raster algorithms are
  unchanged; this application consumes the prebuilt browser bundle rather than
  rebuilding georaster's source with that toolchain.
- Removed unused internal backend storage paths from the frontend file type.

Verification: production build and all 9 unit tests pass. On 3 October 2026,
`npm audit --omit=dev` reports zero vulnerabilities. The full audit still reports
8 affected development dependency nodes (5 high, 3 moderate), in the Tailwind/glob
and Vitest toolchains. These are not resolved by the compatible updates used here.
Do not expose development/test servers publicly. Upgrading the remaining toolchains
requires a separate compatibility and visual review; an audit count alone does not
establish that the deployed browser application is exploitable or completely safe.

The backend has independent security controls and deployment instructions in its
SECURITY.md and DEPLOY.md. Its source changes still need installation on the production
server and private rotation of signing secrets/existing administrator passwords.
Old tagged releases and DOI archives do not include this hardening.
