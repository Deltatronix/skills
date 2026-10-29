export interface SaveButtonOptions {
  disabled?: boolean;
  compact?: boolean;
}

export function renderSaveButton(options: SaveButtonOptions = {}): string {
  const disabled = options.disabled ? ' disabled' : '';
  if (options.compact) {
    return `<button aria-label="Save"${disabled}>S</button>`;
  } else {
    return `<button${disabled}>Save project</button>`;
  }
}
