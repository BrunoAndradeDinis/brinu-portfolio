/** Closes a modal side panel from its X button, from Escape and from a click on the backdrop around it. */
export function bindPanelDismiss(panel: HTMLDialogElement, close: () => void): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target === panel || target.closest('[data-panel-close]')) close();
  };
  const onCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  panel.addEventListener('click', onClick);
  panel.addEventListener('cancel', onCancel);
  return () => {
    panel.removeEventListener('click', onClick);
    panel.removeEventListener('cancel', onCancel);
  };
}
