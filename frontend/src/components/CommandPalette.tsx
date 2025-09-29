import React, { useState, useMemo } from 'react';
import {
  Users,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Globe,
  Grid3x3,
  Lightbulb
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './ui/command';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface Position {
  id: string;
  titleEn: string;
  titleAr: string;
  holder?: string;
  level: number;
}

interface CommandPaletteProps {
  isRTL?: boolean;
  positions?: Position[];
  onNavigateToPosition?: (positionId: string) => void;
  onToggleFullscreen?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleLegend?: () => void;
  onToggleLanguage?: () => void;
  onToggleView?: () => void;
  isFullscreen?: boolean;
  currentZoom?: number;
  legendVisible?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isRTL = false,
  positions = [],
  onNavigateToPosition,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleLegend,
  onToggleLanguage,
  onToggleView,
  isFullscreen = false,
  currentZoom = 1,
  legendVisible = true
}) => {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut to open/close command palette
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      callback: () => setOpen(prev => !prev),
      description: 'Open command palette',
      group: 'Navigation'
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: () => setOpen(prev => !prev),
      description: 'Open command palette (Ctrl)',
      group: 'Navigation'
    },
    {
      key: 'Escape',
      callback: () => setOpen(false),
      description: 'Close command palette',
      group: 'Navigation'
    }
  ]);

  // Define all available commands
  const commands = useMemo(() => {
    const viewCommands = [
      {
        id: 'toggle-fullscreen',
        title: isRTL ? 'تبديل وضع الشاشة الكاملة' : 'Toggle Fullscreen',
        description: isRTL
          ? `${isFullscreen ? 'خروج من' : 'دخول إلى'} وضع الشاشة الكاملة`
          : `${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode`,
        icon: Maximize2,
        shortcut: 'Cmd+F',
        action: () => {
          onToggleFullscreen?.();
          setOpen(false);
        },
        group: isRTL ? 'عرض' : 'View'
      },
      {
        id: 'zoom-in',
        title: isRTL ? 'تكبير' : 'Zoom In',
        description: isRTL ? 'تكبير المخطط التنظيمي' : 'Zoom in on the org chart',
        icon: ZoomIn,
        shortcut: 'Cmd+=',
        action: () => {
          onZoomIn?.();
          setOpen(false);
        },
        group: isRTL ? 'تكبير/تصغير' : 'Zoom'
      },
      {
        id: 'zoom-out',
        title: isRTL ? 'تصغير' : 'Zoom Out',
        description: isRTL ? 'تصغير المخطط التنظيمي' : 'Zoom out of the org chart',
        icon: ZoomOut,
        shortcut: 'Cmd+-',
        action: () => {
          onZoomOut?.();
          setOpen(false);
        },
        group: isRTL ? 'تكبير/تصغير' : 'Zoom'
      },
      {
        id: 'reset-zoom',
        title: isRTL ? 'إعادة تعيين التكبير' : 'Reset Zoom',
        description: isRTL
          ? `إعادة التكبير إلى 100% (حالياً ${Math.round(currentZoom * 100)}%)`
          : `Reset zoom to 100% (currently ${Math.round(currentZoom * 100)}%)`,
        icon: RotateCcw,
        shortcut: 'Cmd+0',
        action: () => {
          onResetZoom?.();
          setOpen(false);
        },
        group: isRTL ? 'تكبير/تصغير' : 'Zoom'
      },
      {
        id: 'toggle-legend',
        title: isRTL ? 'تبديل دليل الألوان' : 'Toggle Legend',
        description: isRTL
          ? `${legendVisible ? 'إخفاء' : 'إظهار'} دليل الألوان`
          : `${legendVisible ? 'Hide' : 'Show'} color legend`,
        icon: Eye,
        shortcut: 'Cmd+L',
        action: () => {
          onToggleLegend?.();
          setOpen(false);
        },
        group: isRTL ? 'عرض' : 'View'
      },
      {
        id: 'toggle-view',
        title: isRTL ? 'تبديل طريقة العرض' : 'Toggle View Mode',
        description: isRTL ? 'التبديل بين عرض الشجرة والشبكة' : 'Switch between tree and grid view',
        icon: Grid3x3,
        shortcut: 'Cmd+V',
        action: () => {
          onToggleView?.();
          setOpen(false);
        },
        group: isRTL ? 'عرض' : 'View'
      }
    ];

    const systemCommands = [
      {
        id: 'toggle-language',
        title: isRTL ? 'تبديل اللغة' : 'Toggle Language',
        description: isRTL ? 'التبديل بين العربية والإنجليزية' : 'Switch between Arabic and English',
        icon: Globe,
        shortcut: 'Cmd+G',
        action: () => {
          onToggleLanguage?.();
          setOpen(false);
        },
        group: isRTL ? 'النظام' : 'System'
      }
    ];

    const navigationCommands = (Array.isArray(positions) ? positions : []).slice(0, 10).map((position) => ({
      id: `navigate-${position.id}`,
      title: isRTL ? position.titleAr : position.titleEn,
      description: isRTL
        ? `الانتقال إلى ${position.titleAr}${position.holder ? ` - ${position.holder}` : ''}`
        : `Navigate to ${position.titleEn}${position.holder ? ` - ${position.holder}` : ''}`,
      icon: Users,
      action: () => {
        onNavigateToPosition?.(position.id);
        setOpen(false);
      },
      group: isRTL ? 'المناصب' : 'Positions',
      level: position.level
    }));

    return [
      ...viewCommands,
      ...systemCommands,
      ...navigationCommands
    ];
  }, [
    isRTL,
    positions,
    isFullscreen,
    currentZoom,
    legendVisible,
    onNavigateToPosition,
    onToggleFullscreen,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onToggleLegend,
    onToggleLanguage,
    onToggleView
  ]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = commands.reduce((acc, command) => {
      const group = command.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(command);
      return acc;
    }, {} as Record<string, typeof commands>);

    return groups;
  }, [commands]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={isRTL ? "لوحة الأوامر" : "Command Palette"}
      description={isRTL ? "البحث عن أمر لتشغيله..." : "Search for a command to run..."}
    >
      <CommandInput
        placeholder={isRTL ? "اكتب أمراً أو ابحث..." : "Type a command or search..."}
        className={isRTL ? "text-right" : ""}
      />
      <CommandList>
        <CommandEmpty>
          {isRTL ? "لا توجد نتائج." : "No results found."}
        </CommandEmpty>

        {Object.entries(groupedCommands).map(([group, groupCommands]) => (
          <CommandGroup key={group} heading={group}>
            {groupCommands.map((command) => (
              <CommandItem
                key={command.id}
                onSelect={command.action}
                className={`${isRTL ? 'flex-row-reverse' : ''} ${
                  command.level !== undefined ? `ml-${command.level * 4}` : ''
                }`}
              >
                <command.icon className="w-4 h-4" />
                <div className="flex-1">
                  <div className={`font-medium ${isRTL ? 'text-right' : ''}`}>
                    {command.title}
                  </div>
                  <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                    {command.description}
                  </div>
                </div>
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* Quick shortcuts info */}
        <CommandGroup heading={isRTL ? "اختصارات سريعة" : "Quick Shortcuts"}>
          <CommandItem disabled>
            <Lightbulb className="w-4 h-4" />
            <div className="flex-1">
              <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? "اضغط Cmd+K أو Ctrl+K لفتح هذه النافذة" : "Press Cmd+K or Ctrl+K to open this panel"}
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};