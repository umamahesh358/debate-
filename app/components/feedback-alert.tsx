"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Volume2, AlertTriangle, Info, CheckCircle } from "lucide-react"

interface FeedbackAlertProps {
  feedback: {
    type: "warning" | "info" | "success"
    title: string
    message: string
    suggestion: string
    icon: string
    relevanceScore?: number
    timestamp: number
  }
  onDismiss: () => void
  audioEnabled: boolean
}

export function FeedbackAlert({ feedback, onDismiss, audioEnabled }: FeedbackAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss()
    }, 10000)

    // Text-to-speech if enabled
    if (audioEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`${feedback.title}. ${feedback.message}`)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }

    return () => clearTimeout(timer)
  }, [feedback, audioEnabled])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Allow animation to complete
  }

  const getAlertStyles = () => {
    switch (feedback.type) {
      case "warning":
        return "border-orange-200 bg-orange-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const getIcon = () => {
    switch (feedback.type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
    >
      <Alert className={`${getAlertStyles()} border-2 shadow-lg`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{feedback.title}</h4>
                <span className="text-lg">{feedback.icon}</span>
                {feedback.relevanceScore && (
                  <Badge variant="secondary" className="text-xs">
                    {feedback.relevanceScore}% relevant
                  </Badge>
                )}
              </div>

              <AlertDescription className="text-gray-700">{feedback.message}</AlertDescription>

              <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-800 mb-1">💡 Suggestion:</p>
                <p className="text-sm text-gray-700">{feedback.suggestion}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {audioEnabled && (
              <Button variant="ghost" size="sm" className="p-1">
                <Volume2 className="w-4 h-4 text-gray-500" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="p-1">
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  )
}
