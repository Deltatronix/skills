# DrawLab

A small CAD-style web app with four pages: **sketch** (pen strokes on a grid), **schematic** (net labels and junctions), **board** (45° tracks that inherit a pad's net, keep clearance from foreign pads, carry width and layer; dimensions) and **footprint** (pads).
TypeScript, no build step — Node 24 runs the `.ts` sources directly. Tests: `npm test`.
The sketch pen and the board track tool each carry their own polyline chain and their own hit-test.
