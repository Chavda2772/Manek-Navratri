"use client"

// Package
import { motion } from "framer-motion"
import { ArrowLeft, EllipsisVertical } from "lucide-react"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect, useRef } from "react"

// Components
import { tran } from "@/lib/languages/i18n"
import { cn } from "@/lib/utils"
import { useHeader } from "./providers/header-provider"
import { Badge } from "./ui/badge"
import { Button, buttonVariants } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import ProfileAvatar from "./user/profile-avatar"

export interface HeaderMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  destructive?: boolean
}

export interface HeaderProps {
  title?: string
  backUrl?: Route
  description?: string
  menuItems?: HeaderMenuItem[]
}

export const BackHeaderStandalone = ({
  title,
  description,
  backUrl,
  menuItems = [],
}: HeaderProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (!backUrl) {
      router.back()
    } else {
      router.push(backUrl)
      return;
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-30 w-full h-14 sm:h-16 flex items-center justify-between bg-background/80 dark:bg-background/60 backdrop-blur-xl px-4 sm:px-6 border-b border-border shadow-sm shrink-0"
    >
      {/* Back Button */}
      <div className="w-1/4 sm:w-1/3 flex items-center gap-2">
        <motion.div
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={handleBack}
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/50 shadow-sm transition-all text-foreground cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Title & Description Container */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0.5 mx-2 min-w-0">
        <motion.h2
          layoutId="back-header-title"
          className="text-base sm:text-lg lg:text-xl font-black tracking-tight truncate w-full text-center bg-linear-to-br from-foreground to-primary/80 bg-clip-text text-transparent"
        >
          {title && tran(title)}
        </motion.h2>

        {description && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge
              variant="secondary"
              className="h-4 rounded-full px-2 text-[8px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20"
            >
              {description && tran(description)}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Menu / Actions */}
      <div className="w-1/4 sm:w-1/3 flex justify-end items-center gap-2">
        {menuItems.length > 0 ? (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "icon" }),
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/50 shadow-sm transition-all text-foreground flex items-center justify-center outline-none cursor-pointer"
                    )}
                  >
                    <EllipsisVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.button>
                }
              />

              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 mt-2 shadow-2xl border-border/50">
                {menuItems.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={item.onClick}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-bold transition-all focus:scale-[0.98] active:scale-95 cursor-pointer",
                      item.destructive && "text-rose-600 focus:text-rose-600"
                    )}
                  >
                    {item.icon && <span className="mr-2 opacity-80 group-focus/dropdown-menu-item:opacity-100 transition-opacity">{item.icon}</span>}
                    <span className={cn(
                      item.destructive && "text-rose-600 focus:text-rose-600"
                    )}>
                      {tran(item.label)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <ProfileAvatar />
        )}
      </div>
    </motion.header>
  )
}

const BackHeader = (props: HeaderProps) => {
  const ctx = useHeader()
  const prevRef = useRef<HeaderProps | null>(null)

  useEffect(() => {
    if (!ctx) return
    const prev = prevRef.current
    if (
      !prev ||
      prev.title !== props.title ||
      prev.description !== props.description ||
      prev.backUrl !== props.backUrl ||
      prev.menuItems !== props.menuItems
    ) {
      prevRef.current = props
      ctx.setHeaderConfig((current) => ({
        ...current,
        type: "back",
        title: props.title ? tran(props.title) : undefined,
        description: props.description ? tran(props.description) : undefined,
        backUrl: props.backUrl,
        menuItems: props.menuItems,
      }))
    }
  })

  // If inside HeaderProvider, the layout's PersistentHeader handles rendering
  if (ctx) {
    return null
  }

  return <BackHeaderStandalone {...props} />
}

export { BackHeader }
