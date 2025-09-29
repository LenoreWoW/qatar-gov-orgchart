import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  description: string;
  group?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const shortcut = shortcuts.find((shortcut) => {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const metaMatch = Boolean(shortcut.metaKey) === event.metaKey;
        const ctrlMatch = Boolean(shortcut.ctrlKey) === event.ctrlKey;
        const altMatch = Boolean(shortcut.altKey) === event.altKey;
        const shiftMatch = Boolean(shortcut.shiftKey) === event.shiftKey;

        return keyMatch && metaMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        shortcut.callback();
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return shortcuts;
};

// Predefined keyboard shortcut groups
export const createShortcuts = {
  // Navigation shortcuts
  navigation: (callbacks: {
    openCommand?: () => void;
    toggleFullscreen?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
    resetZoom?: () => void;
    toggleLegend?: () => void;
    toggleLanguage?: () => void;
  }): KeyboardShortcut[] => [
    {
      key: 'k',
      metaKey: true,
      callback: callbacks.openCommand || (() => {}),
      description: 'Open command palette',
      group: 'Navigation'
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: callbacks.openCommand || (() => {}),
      description: 'Open command palette (Ctrl)',
      group: 'Navigation'
    },
    {
      key: 'f',
      metaKey: true,
      callback: callbacks.toggleFullscreen || (() => {}),
      description: 'Toggle fullscreen',
      group: 'View'
    },
    {
      key: 'F11',
      callback: callbacks.toggleFullscreen || (() => {}),
      description: 'Toggle fullscreen (F11)',
      group: 'View'
    },
    {
      key: '=',
      metaKey: true,
      callback: callbacks.zoomIn || (() => {}),
      description: 'Zoom in',
      group: 'Zoom'
    },
    {
      key: '-',
      metaKey: true,
      callback: callbacks.zoomOut || (() => {}),
      description: 'Zoom out',
      group: 'Zoom'
    },
    {
      key: '0',
      metaKey: true,
      callback: callbacks.resetZoom || (() => {}),
      description: 'Reset zoom',
      group: 'Zoom'
    },
    {
      key: 'l',
      metaKey: true,
      callback: callbacks.toggleLegend || (() => {}),
      description: 'Toggle legend',
      group: 'View'
    },
    {
      key: 'g',
      metaKey: true,
      callback: callbacks.toggleLanguage || (() => {}),
      description: 'Toggle language (Arabic/English)',
      group: 'Localization'
    }
  ],

  // Accessibility shortcuts
  accessibility: (callbacks: {
    focusSearch?: () => void;
    closeModal?: () => void;
    goHome?: () => void;
    showHelp?: () => void;
  }): KeyboardShortcut[] => [
    {
      key: '/',
      callback: callbacks.focusSearch || (() => {}),
      description: 'Focus search',
      group: 'Accessibility'
    },
    {
      key: 'Escape',
      callback: callbacks.closeModal || (() => {}),
      description: 'Close modal/dialog',
      group: 'Navigation'
    },
    {
      key: 'h',
      metaKey: true,
      callback: callbacks.goHome || (() => {}),
      description: 'Go to homepage',
      group: 'Navigation'
    },
    {
      key: '?',
      shiftKey: true,
      callback: callbacks.showHelp || (() => {}),
      description: 'Show keyboard shortcuts',
      group: 'Help'
    }
  ]
};

// Helper function to format shortcut display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('⇧');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
};