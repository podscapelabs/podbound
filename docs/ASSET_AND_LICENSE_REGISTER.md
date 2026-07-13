# Asset and Licence Register

Last reviewed: July 13, 2026

This register records public assets and direct software dependencies currently present in the PodBound repository. It does not itself prove ownership; source files, contracts, licences, receipts, and written permissions should be retained separately by Podscape Labs.

## Public visual assets

| Public file | Current description | Recorded source/status | Evidence to retain |
| --- | --- | --- | --- |
| `public/assets/logos/podbound-logo.png` | PodBound Field Archives logo | Supplied by Podscape Labs | Editable master, creator agreement or internal authorship record |
| `public/assets/logos/podbound-isopod.png` | PodBound isopod mark | Supplied by Podscape Labs | Editable master, creator agreement or internal authorship record |
| `public/badges/podbound-badge-frame.png` | Web-sized badge frame | Derived from a Podscape-supplied master | Derivation notes and master authorization |
| `public/badges/source/podbound-badge-frame-master.png` | Preserved badge-frame master | Supplied by Podscape Labs | Editable source and creator authorization |

The repository currently contains no public sound effects or music. Placeholder asset directories do not grant permission to add material later.

## Fonts and interface icons

- The website uses system font stacks such as Georgia, Arial, Helvetica, and system UI. It does not currently download or bundle a commercial web font.
- Interface arrows and simple symbols are text or CSS treatments. Any future icon pack must be added here with its licence and attribution requirements.

## Direct software dependencies

Licence values below were checked against the installed package metadata. Transitive dependencies remain subject to their own licence terms and should be reviewed before a major public release.

| Package | Licence |
| --- | --- |
| Next.js | MIT |
| React | MIT |
| React DOM | MIT |
| Supabase SSR | MIT |
| Supabase JavaScript client | MIT |
| TypeScript | Apache-2.0 |
| ESLint | MIT |
| eslint-config-next | MIT |
| @eslint/eslintrc | MIT |

## Code and simulator material

- Application and simulator code in this repository is treated as Podscape Labs project material. Preserve contributor, contractor, or prior-repository records that establish the right to use and modify it.
- PodBound names, artwork, game content, rules, characters, worldbuilding, and simulator assets must be created by Podscape Labs or used under written permission.
- Do not import assets from reference images, stock libraries, generative services, community submissions, or third-party games without recording the source, allowed uses, attribution, modification rights, and commercial-use terms.

## Intake checklist for every new asset

- [ ] Record creator or source and acquisition date.
- [ ] Store the original file without destructive replacement.
- [ ] Retain the contract, licence, receipt, or written permission.
- [ ] Confirm website, simulator, marketing, modification, and commercial-use rights.
- [ ] Record required credit or attribution and where it appears.
- [ ] Confirm trademark, model-release, music-performance, and voice rights where relevant.
- [ ] Add the shipped filename and licence status to this register.
- [ ] Remove the asset from production if authorization cannot be demonstrated.

## Open verification items

- [ ] Confirm and archive authorship or written authorization for each currently shipped PodBound PNG.
- [ ] Confirm ownership and contributor history for the migrated simulator source.
- [ ] Generate and retain a transitive dependency licence report before broad release.
- [ ] Repeat this review whenever artwork, fonts, icons, audio, video, or a new dependency is added.
