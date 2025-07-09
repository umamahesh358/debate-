"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Mic, Target, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface FeedbackItem {
  id: string
  type: "warning" | "info" | "success"
  issue: string
  diagnosis: string
  suggestion: string
  timestamp: number
  relevanceScore?: number
}

interface TranscriptDisplayProps {
  transcript: string[]
  isLive: boolean
  relevanceScore: number
  feedbackHistory: FeedbackItem[]
}

export function TranscriptDisplay({ transcript, isLive, relevanceScore, feedbackHistory }: TranscriptDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new transcript arrives
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [transcript])

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-3 h-3 text-orange-500" />
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />
      default:
        return <Info className="w-3 h-3 text-blue-500" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Transcript */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Live Transcript</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {isLive && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Mic className="w-3 h-3 mr-1" />
                  Recording
                </Badge>
              )}
              <Badge className={getRelevanceColor(relevanceScore)}>
                <Target className="w-3 h-3 mr-1" />
                {relevanceScore}%
              </Badge>
            </div>
          </div>
          <Progress value={relevanceScore} className="h-2" />
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-80" ref={scrollAreaRef}>
            <div className="space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Ready to analyze your speech</p>
                  <p className="text-sm">Start speaking to see real-time transcription and feedback</p>
                </div>
              ) : (
                transcript.map((text, index) => {
                  const isLatest = index === transcript.length - 1
                  const relatedFeedback = feedbackHistory.find((f) => Math.abs(f.timestamp - Date.now()) < 10000) // Within 10 seconds

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 transition-all ${
                        isLatest
                          ? "bg-blue-50 border-l-blue-500 shadow-sm"
                          : relatedFeedback
                            ? "bg-orange-50 border-l-orange-500"
                            : "bg-gray-50 border-l-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-800 flex-1 leading-relaxed">{text}</p>
                        <div className="flex items-center space-x-2 ml-3">
                          {relatedFeedback && getFeedbackIcon(relatedFeedback.type)}
                          <span className="text-xs text-gray-500">
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      {relatedFeedback && (
                        <div className="mt-2 p-2 bg-white/70 rounded border border-orange-200">
                          <p className="text-xs font-medium text-orange-800">{relatedFeedback.issue}</p>
                          <p className="text-xs text-orange-700 mt-1">{relatedFeedback.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {isLive && (
                <div className="flex items-center space-x-3 text-blue-600 animate-pulse p-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm">Listening and analyzing...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Feedback Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>Feedback Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {feedbackHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No feedback yet</p>
                  <p className="text-xs">AI coaching will appear here</p>
                </div>
              ) : (
                feedbackHistory.map((feedback, index) => (
                  <div
                    key={feedback.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      feedback.type === "warning"
                        ? "border-l-orange-500 bg-orange-50"
                        : feedback.type === "success"
                          ? "border-l-green-500 bg-green-50"
                          : "border-l-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {getFeedbackIcon(feedback.type)}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800">{feedback.issue}</p>
                        <p className="text-xs text-gray-600 mt-1">{feedback.diagnosis}</p>
                        {feedback.relevanceScore && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {feedback.relevanceScore}% relevant
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(feedback.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
