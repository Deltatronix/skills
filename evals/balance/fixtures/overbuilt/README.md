# Workshop

Small TypeScript app, Node 24, no dependencies. Run `npm test`.
`src/main.ts` is the app entry: settings, panels, save button, document persistence,
export/history, arc consumers, order entry, prices and drawing tools.
`src/index.ts` is the **public SDK entry**. Its `parsePacket` export has external
consumers even though production app code never calls it.

Panel factories receive an action registry and runner, and expose ordered `items`.
Settings use the app's `runtime` (device storage and reload counter). Drawing tools
expose click/move/finish/cancel/preview/shapes; the track tool inherits a starting
pad's net and refuses endpoints within clearance of a foreign-net pad.
The app has no serializer plugins or format configuration; persistence uses JSON.
Arc subdivision is a geometry invariant (32 segments), not a device setting.
