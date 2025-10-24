"use client"

import { useState } from "react"
import { ConnectMenu } from "@/components/connect-menu"
import { Menu, X, Home, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative w-full flex flex-col items-center justify-center px-4 md:pt-16 pt-8">
      {/* Hamburger Menu - Fixed positioned for mobile */}
      <div className="fixed sm:absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700 border-violet-300/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#2D1B69] border-violet-300/20 text-white">
            <SheetHeader>
              <SheetTitle className="text-amber-300 text-xl">Menu</SheetTitle>
              <SheetDescription className="text-violet-200">
                Navigate through Zodiac Card
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-violet-600/20 hover:text-amber-300"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Home
                </Button>
              </Link>
              <Link href="/collection" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-violet-600/20 hover:text-amber-300"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  My Collection
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Connect Menu - Fixed positioned for mobile, absolute for desktop */}
      <div className="fixed sm:absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
        <ConnectMenu />
      </div>
    </div>
  )
}

