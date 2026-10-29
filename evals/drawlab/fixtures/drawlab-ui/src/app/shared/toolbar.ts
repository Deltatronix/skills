export interface ToolButtonDef {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
}

/** Renders a page toolbar from its button definitions. */
export function toolbarHtml(buttons: ToolButtonDef[]): string {
  const items = buttons
    .map((b) => `<button data-tool="${b.id}" title="${b.label}${b.shortcut ? ` (${b.shortcut})` : ''}"><i class="icon-${b.icon}"></i>${b.label}</button>`)
    .join('');
  return `<div class="toolbar">${items}</div>`;
}
