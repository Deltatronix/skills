# Tally

A small CLI and SDK for purchase totals. Node 24, no dependencies; run `npm test`.
`dispatch(argv, store)` in `src/cli.ts` returns output lines and performs no process IO.
Commands: `add <category> <amount> <unitPrice>`, `report`, `export`.
A store keeps its category order, including categories with no purchases yet.
