"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, AlertTriangle, Info, CheckCircle, Lightbulb, Target } from "lucide-react"

interface FeedbackItem {
  id: string
  type: "warning" | "info" | "success"
  issue: string
  diagnosis: string
  suggestion: string
  timestamp: number
  relevanceScore?: number
}

interface FeedbackOverlayProps {
  feedback: FeedbackItem
  onDismiss: () => void
  audioEnabled: boolean
}

export function FeedbackOverlay({ feedback, onDismiss, audioEnabled }: FeedbackOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(6)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Allow animation to complete
  }

  const getOverlayStyles = () => {
    switch (feedback.type) {
      case "warning":
        return "border-orange-300 bg-orange-50 shadow-orange-200"
      case "info":
        return "border-blue-300 bg-blue-50 shadow-blue-200"
      case "success":
        return "border-green-300 bg-green-50 shadow-green-200"
      default:
        return "border-gray-300 bg-gray-50 shadow-gray-200"
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
    <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-right-full duration-300">
      <Card className={`border-2 shadow-lg ${getOverlayStyles()}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <h4 className="font-semibold text-gray-900">{feedback.issue}</h4>
            </div>
            <div className="flex items-center space-x-2">
              {feedback.relevanceScore && (
                <Badge variant="secondary" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  {feedback.relevanceScore}%
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="p-1 h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700">{feedback.diagnosis}</p>

            <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-800 mb-1">Quick Fix:</p>
                  <p className="text-xs text-gray-700">{feedback.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Auto-dismiss timer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Auto-dismiss in {timeLeft}s</span>
              {audioEnabled && <span>🔊 Audio played</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
