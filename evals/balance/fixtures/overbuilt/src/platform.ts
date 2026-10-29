export const runtime = {
  storage: new Map<string, string>(),
  reloadCount: 0,
  reload() {
    this.reloadCount++;
  },
};
