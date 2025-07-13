"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface VoiceFeedback {
  timestamp: number
  type: "pace" | "clarity" | "volume" | "filler" | "confidence"
  message: string
  severity: "low" | "medium" | "high"
  suggestion: string
}

interface VoiceMetrics {
  pace: number // words per minute
  clarity: number // percentage
  volume: number // percentage
  confidence: number // percentage
  fillerWords: number
  totalWords: number
}

export function ContinuousVoiceFeedback() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState<VoiceFeedback[]>([])
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    pace: 0,
    clarity: 0,
    volume: 0,
    confidence: 0,
    fillerWords: 0,
    totalWords: 0,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript + " ")
          analyzeTranscript(finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const analyzeTranscript = (text: string) => {
    const words = text.trim().split(/\s+/)
    const fillerWords = ["um", "uh", "like", "you know", "so", "actually", "basically"]
    const fillerCount = words.filter((word) => fillerWords.includes(word.toLowerCase().replace(/[.,!?]/g, ""))).length

    // Simulate real-time analysis
    const newFeedback: VoiceFeedback[] = []
    const currentTimestamp = Date.now()

    // Check for filler words
    if (fillerCount > 0) {
      newFeedback.push({
        timestamp: currentTimestamp,
        type: "filler",
        message: `Detected ${fillerCount} filler word${fillerCount > 1 ? "s" : ""}`,
        severity: fillerCount > 2 ? "high" : "medium",
        suggestion: "Try to pause instead of using filler words. Take a breath and continue.",
      })
    }

    // Simulate pace analysis
    const wordsPerMinute = (words.length * 60) / (currentTime || 1)
    if (wordsPerMinute > 180) {
      newFeedback.push({
        timestamp: currentTimestamp,
        type: "pace",
        message: "Speaking too fast",
        severity: "medium",
        suggestion: "Slow down to improve clarity and audience comprehension.",
      })
    } else if (wordsPerMinute < 120) {
      newFeedback.push({
        timestamp: currentTimestamp,
        type: "pace",
        message: "Speaking too slowly",
        severity: "low",
        suggestion: "Increase your pace slightly to maintain audience engagement.",
      })
    }

    // Update metrics
    setMetrics((prev) => ({
      pace: Math.round(wordsPerMinute),
      clarity: Math.max(85 - fillerCount * 5, 60),
      volume: Math.random() * 20 + 70, // Simulated
      confidence: Math.max(90 - fillerCount * 3, 70),
      fillerWords: prev.fillerWords + fillerCount,
      totalWords: prev.totalWords + words.length,
    }))

    if (newFeedback.length > 0) {
      setFeedback((prev) => [...prev, ...newFeedback].slice(-10)) // Keep last 10 feedback items
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)

      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      // Start timer
      const startTime = Date.now()
      const timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      mediaRecorderRef.current.onstop = () => {
        clearInterval(timer)
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setDuration(currentTime)

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }

  const resetSession = () => {
    setCurrentTime(0)
    setDuration(0)
    setTranscript("")
    setFeedback([])
    setMetrics({
      pace: 0,
      clarity: 0,
      volume: 0,
      confidence: 0,
      fillerWords: 0,
      totalWords: 0,
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMetricColor = (value: number, type: string) => {
    if (type === "pace") {
      if (value >= 140 && value <= 160) return "text-green-600"
      if (value >= 120 && value <= 180) return "text-yellow-600"
      return "text-red-600"
    }
    if (value >= 80) return "text-green-600"
    if (value >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Recording Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-blue-600" />
              <span>Live Voice Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-lg">{formatTime(currentTime)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>

            <Button variant="outline" onClick={resetSession} disabled={isRecording}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getMetricColor(metrics.pace, "pace")}`}>{metrics.pace}</div>
            <div className="text-sm text-gray-600">WPM</div>
            <div className="text-xs text-gray-500 mt-1">Target: 140-160</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getMetricColor(metrics.clarity, "clarity")}`}>{metrics.clarity}%</div>
            <div className="text-sm text-gray-600">Clarity</div>
            <Progress value={metrics.clarity} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getMetricColor(metrics.confidence, "confidence")}`}>
              {metrics.confidence}%
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
            <Progress value={metrics.confidence} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.fillerWords}</div>
            <div className="text-sm text-gray-600">Filler Words</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.totalWords > 0 ? `${((metrics.fillerWords / metrics.totalWords) * 100).toFixed(1)}%` : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Live Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {feedback.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start speaking to receive real-time feedback</p>
                </div>
              ) : (
                feedback
                  .slice()
                  .reverse()
                  .map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(Math.floor((Date.now() - item.timestamp) / 1000))} ago
                            </span>
                          </div>
                          <p className="font-medium mt-1">{item.message}</p>
                          <p className="text-sm mt-1">{item.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-blue-600" />
              <span>Live Transcript</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
              {transcript ? (
                <p className="text-sm leading-relaxed">{transcript}</p>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Transcript will appear here as you speak</p>
                </div>
              )}
            </div>
            {transcript && (
              <div className="mt-3 text-xs text-gray-500">Word count: {transcript.trim().split(/\s+/).length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Summary */}
      {duration > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span>Session Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{formatTime(duration)}</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{metrics.totalWords}</div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{metrics.pace}</div>
                <div className="text-sm text-gray-600">Avg WPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{feedback.length}</div>
                <div className="text-sm text-gray-600">Feedback Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
