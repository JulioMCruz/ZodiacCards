export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-violet-950 to-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-violet-300 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}
