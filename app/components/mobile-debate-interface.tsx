"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, ArrowLeft, CheckCircle, Clock, Zap, Target } from "lucide-react"
import { VoiceDebateEngine } from "./voice-debate-engine"
import { RealtimeTranscript } from "./realtime-transcript"
import { FeedbackAlert } from "./feedback-alert"

interface Topic {
  id: string
  motion: string
  category: string
  difficulty: string
  description: string
  context: string
  keyArguments: {
    government: string[]
    opposition: string[]
  }
}

interface MobileDebateInterfaceProps {
  topic: Topic
  userRole: "government" | "opposition"
  onRoleChange: (role: "government" | "opposition") => void
  onTopicChange: () => void
  isActive: boolean
  onActiveChange: (active: boolean) => void
}

export function MobileDebateInterface({
  topic,
  userRole,
  onRoleChange,
  onTopicChange,
  isActive,
  onActiveChange,
}: MobileDebateInterfaceProps) {
  const [transcript, setTranscript] = useState<string[]>([])
  const [currentFeedback, setCurrentFeedback] = useState<any>(null)
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    wordsSpoken: 0,
    feedbackCount: 0,
    relevanceScore: 85,
  })
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)

  const voiceEngineRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSessionStats((prev) => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive])

  const handleStartStop = () => {
    if (isActive) {
      onActiveChange(false)
      setIsListening(false)
    } else {
      onActiveChange(true)
      setIsListening(true)
    }
  }

  const handleTranscriptUpdate = (newText: string) => {
    setTranscript((prev) => [...prev, newText])
    setSessionStats((prev) => ({
      ...prev,
      wordsSpoken: prev.wordsSpoken + newText.split(" ").length,
    }))
  }

  const handleFeedback = (feedback: any) => {
    setCurrentFeedback(feedback)
    setSessionStats((prev) => ({
      ...prev,
      feedbackCount: prev.feedbackCount + 1,
      relevanceScore: feedback.relevanceScore || prev.relevanceScore,
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Topic Header - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Button variant="ghost" size="sm" onClick={onTopicChange} className="p-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Badge className="bg-indigo-100 text-indigo-800">{topic.difficulty}</Badge>
          </div>
          <CardTitle className="text-lg leading-tight pr-4">{topic.motion}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Role Selection */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={userRole === "government" ? "default" : "outline"}
              size="sm"
              onClick={() => onRoleChange("government")}
              className="flex-1"
              disabled={isActive}
            >
              Government
            </Button>
            <Button
              variant={userRole === "opposition" ? "default" : "outline"}
              size="sm"
              onClick={() => onRoleChange("opposition")}
              className="flex-1"
              disabled={isActive}
            >
              Opposition
            </Button>
          </div>

          {/* Key Arguments Preview */}
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Your Key Arguments ({userRole}):</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {topic.keyArguments[userRole].slice(0, 3).map((arg, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>{arg}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Session Stats - Mobile Compact */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="text-center">
            <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <div className="text-sm font-bold">{formatTime(sessionStats.duration)}</div>
            <div className="text-xs text-gray-500">Time</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <Target className="w-4 h-4 mx-auto text-green-600 mb-1" />
            <div className="text-sm font-bold">{sessionStats.wordsSpoken}</div>
            <div className="text-xs text-gray-500">Words</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <Zap className="w-4 h-4 mx-auto text-purple-600 mb-1" />
            <div className="text-sm font-bold">{sessionStats.feedbackCount}</div>
            <div className="text-xs text-gray-500">Tips</div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-center">
            <CheckCircle className="w-4 h-4 mx-auto text-orange-600 mb-1" />
            <div className="text-sm font-bold">{sessionStats.relevanceScore}%</div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        </Card>
      </div>

      {/* Voice Controls - Large Mobile-Friendly */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Main Record Button */}
            <Button
              onClick={handleStartStop}
              size="lg"
              className={`w-24 h-24 rounded-full text-white shadow-lg transition-all ${
                isActive ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>

            <div className="text-center">
              <p className="font-medium">{isActive ? "Recording - Tap to Stop" : "Tap to Start Recording"}</p>
              <p className="text-sm text-gray-500">
                {isActive ? "AI is analyzing your speech..." : "Begin your argument"}
              </p>
            </div>

            {/* Audio Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="flex items-center space-x-2"
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{audioEnabled ? "Audio On" : "Audio Off"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTranscript([])
                  setCurrentFeedback(null)
                  setSessionStats({ duration: 0, wordsSpoken: 0, feedbackCount: 0, relevanceScore: 85 })
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Feedback Alert */}
      {currentFeedback && (
        <FeedbackAlert
          feedback={currentFeedback}
          onDismiss={() => setCurrentFeedback(null)}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Live Transcript */}
      <RealtimeTranscript
        transcript={transcript}
        isListening={isListening}
        relevanceScore={sessionStats.relevanceScore}
      />

      {/* Voice Engine Component */}
      <VoiceDebateEngine
        ref={voiceEngineRef}
        topic={topic}
        userRole={userRole}
        isActive={isActive}
        onTranscriptUpdate={handleTranscriptUpdate}
        onFeedback={handleFeedback}
      />
    </div>
  )
}
