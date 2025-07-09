"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, Download, Smartphone } from "lucide-react"

export function MobileOptimizations() {
  const [isOnline, setIsOnline] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Mobile-specific optimizations
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error)
    }

    // Prevent zoom on input focus (mobile)
    const viewport = document.querySelector("meta[name=viewport]")
    if (viewport) {
      viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setCanInstall(false)
      }
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Offline Indicator */}
      {!isOnline && (
        <Alert className="border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Some features may be limited, but you can still practice with cached content.
          </AlertDescription>
        </Alert>
      )}

      {/* Install App Prompt */}
      {canInstall && (
        <Alert className="border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Install DebateMaster app for the best mobile experience</span>
            <Button size="sm" onClick={handleInstallApp} className="ml-4">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-orange-500" />
            <span>Offline Mode</span>
          </>
        )}
      </div>
    </div>
  )
}
