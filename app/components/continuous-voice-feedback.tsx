"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Mic, MicOff, Volume2, VolumeX, Zap, Target, AlertTriangle, CheckCircle } from "lucide-react"
import { AudioStreamer } from "./audio-streamer"
import { FeedbackOverlay } from "./feedback-overlay"
import { TranscriptDisplay } from "./transcript-display"

interface ContinuousVoiceFeedbackProps {
  isLive: boolean
  onLiveChange: (live: boolean) => void
  feedbackEnabled: boolean
  onFeedbackToggle: (enabled: boolean) => void
}

interface FeedbackItem {
  id: string
  type: "warning" | "info" | "success"
  issue: string
  diagnosis: string
  suggestion: string
  timestamp: number
  relevanceScore?: number
}

export function ContinuousVoiceFeedback({
  isLive,
  onLiveChange,
  feedbackEnabled,
  onFeedbackToggle,
}: ContinuousVoiceFeedbackProps) {
  const [transcript, setTranscript] = useState<string[]>([])
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackItem | null>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    wordsSpoken: 0,
    feedbackCount: 0,
    relevanceScore: 85,
    improvementRate: 73,
  })

  const audioStreamerRef = useRef<any>(null)
  const feedbackEventSourceRef = useRef<EventSource | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  // Session timer
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setSessionStats((prev) => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLive])

  // Feedback SSE connection
  useEffect(() => {
    if (isLive && feedbackEnabled) {
      // Connect to Server-Sent Events for real-time feedback
      feedbackEventSourceRef.current = new EventSource("/api/sse/feedback")

      feedbackEventSourceRef.current.onmessage = (event) => {
        const feedback: FeedbackItem = JSON.parse(event.data)
        handleNewFeedback(feedback)
      }

      feedbackEventSourceRef.current.onerror = (error) => {
        console.error("SSE connection error:", error)
      }
    } else {
      if (feedbackEventSourceRef.current) {
        feedbackEventSourceRef.current.close()
        feedbackEventSourceRef.current = null
      }
    }

    return () => {
      if (feedbackEventSourceRef.current) {
        feedbackEventSourceRef.current.close()
      }
    }
  }, [isLive, feedbackEnabled])

  const handleNewFeedback = (feedback: FeedbackItem) => {
    setCurrentFeedback(feedback)
    setFeedbackHistory((prev) => [feedback, ...prev.slice(0, 9)]) // Keep last 10
    setSessionStats((prev) => ({
      ...prev,
      feedbackCount: prev.feedbackCount + 1,
      relevanceScore: feedback.relevanceScore || prev.relevanceScore,
    }))

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setCurrentFeedback(null)
    }, 6000)

    // Text-to-speech if enabled
    if (audioEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(feedback.diagnosis)
      utterance.rate = 0.9
      utterance.volume = 0.7
      speechSynthesis.speak(utterance)
    }
  }

  const handleTranscriptUpdate = (text: string) => {
    setTranscript((prev) => [...prev.slice(-19), text]) // Keep last 20 entries
    setSessionStats((prev) => ({
      ...prev,
      wordsSpoken: prev.wordsSpoken + text.split(" ").length,
    }))
  }

  const handleStartStop = () => {
    if (isLive) {
      onLiveChange(false)
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stopStreaming()
      }
    } else {
      onLiveChange(true)
      if (audioStreamerRef.current) {
        audioStreamerRef.current.startStreaming()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Mic className="w-6 h-6 text-blue-600" />
            <span>Continuous Voice Coaching</span>
            {isLive && <Badge className="bg-red-500 animate-pulse">LIVE</Badge>}
          </CardTitle>
          <p className="text-gray-600">
            Real-time AI feedback that doesn't interrupt your debate flow. Speak naturally and receive instant coaching.
          </p>
        </CardHeader>
      </Card>

      {/* Controls & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Record Button */}
            <div className="text-center">
              <Button
                onClick={handleStartStop}
                size="lg"
                className={`w-20 h-20 rounded-full text-white shadow-lg transition-all ${
                  isLive ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </Button>
              <p className="mt-2 font-medium">{isLive ? "Stop Recording" : "Start Recording"}</p>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">AI Feedback</span>
                </div>
                <Switch checked={feedbackEnabled} onCheckedChange={onFeedbackToggle} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">Audio Feedback</span>
                </div>
                <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatTime(sessionStats.duration)}</div>
                <div className="text-sm text-blue-700">Duration</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sessionStats.wordsSpoken}</div>
                <div className="text-sm text-green-700">Words</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{sessionStats.feedbackCount}</div>
                <div className="text-sm text-purple-700">Feedback</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className={`text-2xl font-bold ${getScoreColor(sessionStats.relevanceScore)}`}>
                  {sessionStats.relevanceScore}%
                </div>
                <div className="text-sm text-orange-700">Relevance</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Improvement Rate</span>
                <span>{sessionStats.improvementRate}%</span>
              </div>
              <Progress value={sessionStats.improvementRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Feedback Overlay */}
      {currentFeedback && (
        <FeedbackOverlay
          feedback={currentFeedback}
          onDismiss={() => setCurrentFeedback(null)}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Transcript Display */}
      <TranscriptDisplay
        transcript={transcript}
        isLive={isLive}
        relevanceScore={sessionStats.relevanceScore}
        feedbackHistory={feedbackHistory}
      />

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Recent Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {feedbackHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No feedback yet. Start speaking to receive AI coaching!</p>
            ) : (
              feedbackHistory.map((feedback) => (
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {feedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                        {feedback.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {feedback.type === "info" && <Zap className="w-4 h-4 text-blue-600" />}
                        <span className="font-medium text-sm">{feedback.issue}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{feedback.diagnosis}</p>
                      <p className="text-xs text-gray-600">💡 {feedback.suggestion}</p>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(feedback.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Streamer Component */}
      <AudioStreamer
        ref={audioStreamerRef}
        isActive={isLive}
        onTranscriptUpdate={handleTranscriptUpdate}
        feedbackEnabled={feedbackEnabled}
      />
    </div>
  )
}
