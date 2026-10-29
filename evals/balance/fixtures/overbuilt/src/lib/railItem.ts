export interface Action {
  enabled: boolean;
  shortcut?: string;
}

export type Registry = Record<string, Action>;
export type Runner = (id: string) => void;

export function railItemFor(registry: Registry, runner: Runner, id: string, icon: string, label: string) {
  const action = registry[id];
  return {
    id,
    icon,
    label,
    shortcut: action.shortcut ?? '',
    disabled: !action.enabled,
    run() {
      if (action.enabled) runner(id);
    },
  };
}
