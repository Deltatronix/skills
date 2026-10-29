# EditorLab

Three pointer-based editors and a settings pane. Node 24, no dependencies; `npm test`.
Editors expose `pointerDown`, `pointerMove`, `pointerUp`, `cancel(pointerId)`, `active`,
and `shapes`. Pointer events are `{ pointerId, x, y }`; cancel drops a drag without
synthesizing a pointer release. Board and symbol editing support concurrent pointers.
Settings actions are methods on `createSettingsPane({ storage, reload })`.
The app uses device-local keys `theme`, `gridVisible`, `lastProject` and synced
`accountId`. The storage contract is Map-like: `get`, `set`, `delete`.

`src/workspace.ts` restores these preferences and persists the last opened project.
