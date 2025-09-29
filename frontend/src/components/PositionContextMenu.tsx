import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuGroup,
} from './ui/context-menu';
import {
  Edit3,
  Plus,
  Trash2,
  Eye,
  Users,
  FileText,
  Copy,
  Share2,
  Pin,
  Navigation,
  ExternalLink,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  id: string;
  titleEn: string;
  titleAr: string;
  holder?: string;
  department?: string;
  level: number;
  children?: Position[];
}

interface PositionContextMenuProps {
  position: Position;
  children: React.ReactNode;
  isRTL?: boolean;
  onEditPosition?: (position: Position) => void;
  onAddChild?: (parentPosition: Position) => void;
  onDeletePosition?: (position: Position) => void;
  onViewDetails?: (position: Position) => void;
  onNavigateToPosition?: (positionId: string) => void;
  onCopyPosition?: (position: Position) => void;
  onSharePosition?: (position: Position) => void;
  onPinPosition?: (position: Position) => void;
  onShowReports?: (position: Position) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddChild?: boolean;
}

export const PositionContextMenu: React.FC<PositionContextMenuProps> = ({
  position,
  children,
  isRTL = false,
  onEditPosition,
  onAddChild,
  onDeletePosition,
  onViewDetails,
  onNavigateToPosition,
  onCopyPosition,
  onSharePosition,
  onPinPosition,
  onShowReports,
  canEdit = true,
  canDelete = true,
  canAddChild = true,
}) => {
  const handleEditPosition = () => {
    onEditPosition?.(position);
  };

  const handleAddChild = () => {
    onAddChild?.(position);
  };

  const handleDeletePosition = () => {
    onDeletePosition?.(position);
  };

  const handleViewDetails = () => {
    onViewDetails?.(position);
  };

  const handleNavigateToPosition = () => {
    onNavigateToPosition?.(position.id);
  };

  const handleCopyPosition = () => {
    onCopyPosition?.(position);
    // Copy position details to clipboard
    const positionText = `${isRTL ? position.titleAr : position.titleEn}${
      position.holder ? ` - ${position.holder}` : ''
    }${position.department ? ` (${position.department})` : ''}`;

    navigator.clipboard.writeText(positionText).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = positionText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  const handleSharePosition = () => {
    onSharePosition?.(position);
    // Generate shareable URL or data
    const shareData = {
      title: isRTL ? position.titleAr : position.titleEn,
      text: `Check out this organizational position: ${isRTL ? position.titleAr : position.titleEn}`,
      url: `${window.location.origin}${window.location.pathname}#position-${position.id}`,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(shareData.url);
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(shareData.url);
    }
  };

  const handlePinPosition = () => {
    onPinPosition?.(position);
  };

  const handleShowReports = () => {
    onShowReports?.(position);
  };

  // Check if position can be deleted (e.g., not the root position)
  const isDeletable = canDelete && position.level > 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className={cn(
        "w-64",
        isRTL && "text-right"
      )}>
        {/* Position Info Header */}
        <ContextMenuLabel className="px-2 py-2 font-medium text-qatar-maroon border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {isRTL ? position.titleAr : position.titleEn}
              </div>
              {position.holder && (
                <div className="text-xs text-muted-foreground truncate">
                  {position.holder}
                </div>
              )}
            </div>
          </div>
        </ContextMenuLabel>

        <ContextMenuGroup>
          {/* Primary Actions */}
          <ContextMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>{isRTL ? "عرض التفاصيل" : "View Details"}</span>
            <ContextMenuShortcut>Enter</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleNavigateToPosition}>
            <Navigation className="mr-2 h-4 w-4" />
            <span>{isRTL ? "الانتقال إلى" : "Navigate To"}</span>
            <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Management Actions */}
          {canEdit && (
            <ContextMenuItem onClick={handleEditPosition}>
              <Edit3 className="mr-2 h-4 w-4" />
              <span>{isRTL ? "تعديل" : "Edit"}</span>
              <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
            </ContextMenuItem>
          )}

          {canAddChild && (
            <ContextMenuItem onClick={handleAddChild}>
              <Plus className="mr-2 h-4 w-4" />
              <span>{isRTL ? "إضافة منصب فرعي" : "Add Child Position"}</span>
              <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
            </ContextMenuItem>
          )}

          {position.children && position.children.length > 0 && (
            <ContextMenuItem onClick={handleShowReports}>
              <FileText className="mr-2 h-4 w-4" />
              <span>
                {isRTL
                  ? `عرض التقارير (${position.children.length})`
                  : `Show Reports (${position.children.length})`
                }
              </span>
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          {/* Utility Actions */}
          <ContextMenuItem onClick={handleCopyPosition}>
            <Copy className="mr-2 h-4 w-4" />
            <span>{isRTL ? "نسخ" : "Copy"}</span>
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleSharePosition}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>{isRTL ? "مشاركة" : "Share"}</span>
            <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={handlePinPosition}>
            <Pin className="mr-2 h-4 w-4" />
            <span>{isRTL ? "تثبيت" : "Pin"}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Advanced Actions */}
          <ContextMenuItem>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>{isRTL ? "إضافة ملاحظة" : "Add Note"}</span>
          </ContextMenuItem>

          <ContextMenuItem>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>{isRTL ? "فتح في نافذة جديدة" : "Open in New Window"}</span>
          </ContextMenuItem>

          {/* Danger Zone */}
          {isDeletable && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={handleDeletePosition}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isRTL ? "حذف" : "Delete"}</span>
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuGroup>

        {/* Position Stats Footer */}
        <ContextMenuSeparator />
        <div className="px-2 py-1 text-xs text-muted-foreground">
          {isRTL
            ? `المستوى ${position.level} • المعرف: ${position.id}`
            : `Level ${position.level} • ID: ${position.id}`
          }
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
};