import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom does not implement <dialog>. This mimics the parts the app relies on:
// showModal/close toggle `open`, and Escape fires the native `cancel` event.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
    this.querySelector<HTMLElement>('[autofocus]')?.focus();
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
  document.addEventListener('keydown', (event) => {
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (event.key === 'Escape' && dialog) {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    }
  });
}
