import { railItemFor, type Registry, type Runner } from '../lib/railItem.ts';

export function createPartsPanel(registry: Registry, runner: Runner) {
  const toItem = (id: string, icon: string, label: string) =>
    railItemFor(registry, runner, id, icon, label);
  return {
    items: [
      toItem('part.add', 'chip', 'Add part'),
      toItem('part.remove', 'trash', 'Remove part'),
    ],
  };
}
