import { railItemFor, type Registry, type Runner } from '../lib/railItem.ts';

export function createNetsPanel(registry: Registry, runner: Runner) {
  const toItem = (id: string, icon: string, label: string) =>
    railItemFor(registry, runner, id, icon, label);
  return {
    items: [
      toItem('net.add', 'wire', 'Add net'),
      toItem('net.inspect', 'search', 'Inspect net'),
    ],
  };
}
