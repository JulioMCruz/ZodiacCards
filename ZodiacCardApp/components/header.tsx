"use client"

import { ConnectMenu } from "@/components/connect-menu"

export function Header() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center px-4 md:pt-16 pt-8">
      {/* Connect Menu - Fixed positioned for mobile, absolute for desktop */}
      <div className="fixed sm:absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
        <ConnectMenu />
      </div>
    </div>
  )
}

