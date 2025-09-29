"use client"

import * as React from "react"
import { ChevronRight, Home, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  id: string
  titleEn: string
  titleAr: string
  level: number
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  currentItemId?: string
  onItemClick?: (itemId: string) => void
  isRTL?: boolean
  maxItems?: number
  className?: string
}

const Breadcrumb = React.forwardRef<
  HTMLElement,
  BreadcrumbProps
>(({
  items,
  currentItemId,
  onItemClick,
  isRTL = false,
  maxItems = 4,
  className,
  ...props
}, ref) => {
  // Truncate items if they exceed maxItems
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items
    }

    const firstItem = items[0] // Always show root
    const lastItems = items.slice(-(maxItems - 2)) // Show last n-2 items
    return [firstItem, { id: 'truncated', titleEn: '...', titleAr: '...', level: -1 }, ...lastItems]
  }, [items, maxItems])

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.id !== 'truncated' && onItemClick) {
      onItemClick(item.id)
    }
  }

  return (
    <nav
      ref={ref}
      aria-label={isRTL ? "مسار التنقل" : "Breadcrumb navigation"}
      className={cn("flex", isRTL && "flex-row-reverse", className)}
      {...props}
    >
      <ol className={cn(
        "flex items-center space-x-1 text-sm",
        isRTL && "flex-row-reverse space-x-reverse"
      )}>
        {/* Home icon for root */}
        <li>
          <button
            onClick={() => handleItemClick(items[0])}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
              "hover:bg-qatar-maroon/5 hover:text-qatar-maroon",
              currentItemId === items[0]?.id && "text-qatar-maroon font-medium",
              "focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:ring-offset-1"
            )}
            aria-current={currentItemId === items[0]?.id ? "page" : undefined}
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">
              {isRTL ? "الصفحة الرئيسية" : "Home"}
            </span>
          </button>
        </li>

        {displayItems.slice(1).map((item, index) => (
          <React.Fragment key={item.id}>
            {/* Separator */}
            <li aria-hidden="true">
              <ChevronRight className={cn(
                "h-4 w-4 text-gray-400",
                isRTL && "rotate-180"
              )} />
            </li>

            {/* Breadcrumb Item */}
            <li>
              {item.id === 'truncated' ? (
                <span className="flex items-center px-2 py-1 text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors text-left",
                    "hover:bg-qatar-maroon/5 hover:text-qatar-maroon",
                    currentItemId === item.id
                      ? "text-qatar-maroon font-medium"
                      : "text-gray-600 hover:text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:ring-offset-1",
                    isRTL && "text-right"
                  )}
                  aria-current={currentItemId === item.id ? "page" : undefined}
                >
                  {isRTL ? item.titleAr : item.titleEn}
                </button>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
})
Breadcrumb.displayName = "Breadcrumb"

// Compact breadcrumb for mobile
const BreadcrumbCompact = React.forwardRef<
  HTMLElement,
  BreadcrumbProps & { showBackButton?: boolean }
>(({
  items,
  currentItemId,
  onItemClick,
  isRTL = false,
  showBackButton = true,
  className,
  ...props
}, ref) => {
  const currentItem = items.find(item => item.id === currentItemId) || items[items.length - 1]
  const parentItem = items[items.findIndex(item => item.id === currentItemId) - 1]

  return (
    <nav
      ref={ref}
      aria-label={isRTL ? "مسار التنقل المضغوط" : "Compact breadcrumb navigation"}
      className={cn("flex items-center", isRTL && "flex-row-reverse", className)}
      {...props}
    >
      {showBackButton && parentItem && (
        <button
          onClick={() => onItemClick?.(parentItem.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
            "text-qatar-maroon hover:bg-qatar-maroon/5",
            "focus:outline-none focus:ring-2 focus:ring-qatar-maroon focus:ring-offset-1",
            isRTL && "flex-row-reverse"
          )}
        >
          <ChevronRight className={cn(
            "h-4 w-4",
            !isRTL && "rotate-180"
          )} />
          <span>{isRTL ? parentItem.titleAr : parentItem.titleEn}</span>
        </button>
      )}

      <div className={cn(
        "flex items-center gap-2 text-sm",
        isRTL && "flex-row-reverse"
      )}>
        <span className="text-gray-500">
          {isRTL ? "الحالي:" : "Current:"}
        </span>
        <span className="font-medium text-qatar-maroon">
          {isRTL ? currentItem?.titleAr : currentItem?.titleEn}
        </span>
      </div>
    </nav>
  )
})
BreadcrumbCompact.displayName = "BreadcrumbCompact"

// Breadcrumb with dropdown for mobile
const BreadcrumbDropdown = React.forwardRef<
  HTMLElement,
  BreadcrumbProps & {
    dropdownTrigger?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({
  items,
  currentItemId,
  onItemClick,
  isRTL = false,
  dropdownTrigger,
  isOpen,
  onOpenChange,
  className,
  ...props
}, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const currentItem = items.find(item => item.id === currentItemId) || items[items.length - 1]

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md border",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-qatar-maroon",
          isRTL && "flex-row-reverse"
        )}
      >
        {dropdownTrigger || (
          <>
            <MoreHorizontal className="h-4 w-4" />
            <span>{isRTL ? currentItem?.titleAr : currentItem?.titleEn}</span>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              open && "rotate-90",
              isRTL && "rotate-180"
            )} />
          </>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute top-full mt-1 w-64 bg-white border rounded-md shadow-lg z-50",
          isRTL ? "right-0" : "left-0"
        )}>
          <nav
            ref={ref}
            aria-label={isRTL ? "قائمة مسار التنقل" : "Breadcrumb dropdown"}
            {...props}
          >
            <ol className="py-1">
              {items.map((item, index) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      handleItemClick(item)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors",
                      "hover:bg-gray-50 focus:outline-none focus:bg-gray-50",
                      currentItemId === item.id && "bg-qatar-maroon/5 text-qatar-maroon font-medium",
                      isRTL && "text-right"
                    )}
                    style={{ paddingLeft: `${(index + 1) * 12}px` }}
                  >
                    {isRTL ? item.titleAr : item.titleEn}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </div>
  )

  function handleItemClick(item: BreadcrumbItem) {
    if (onItemClick) {
      onItemClick(item.id)
    }
  }
})
BreadcrumbDropdown.displayName = "BreadcrumbDropdown"

export {
  Breadcrumb,
  BreadcrumbCompact,
  BreadcrumbDropdown,
  type BreadcrumbItem,
  type BreadcrumbProps
}