import { railItemFor, type Registry, type Runner } from '../lib/railItem.ts';

export function createLayersPanel(registry: Registry, runner: Runner) {
  const toItem = (id: string, icon: string, label: string) =>
    railItemFor(registry, runner, id, icon, label);
  return {
    items: [
      toItem('layer.add', 'plus', 'Add layer'),
      toItem('layer.remove', 'minus', 'Remove layer'),
    ],
  };
}
