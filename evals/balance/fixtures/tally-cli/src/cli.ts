import { add } from './commands/add.ts';
import { report } from './commands/report.ts';
import { exportRows } from './commands/export.ts';
import type { Store } from './store.ts';

export function dispatch(argv: string[], store: Store): string[] {
  const [command, category, amount, unitPrice] = argv;
  switch (command) {
    case 'add': return add({ category, amount: Number(amount), unitPrice: Number(unitPrice) }, store);
    case 'report': return report({}, store);
    case 'export': return exportRows({}, store);
    default: throw new Error(`Unknown command: ${command}`);
  }
}
