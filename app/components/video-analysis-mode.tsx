"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Video, VideoOff, Eye, Hand, Users, Target, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"

interface VideoAnalysisData {
  eyeContact: {
    percentage: number
    deviations: number
    avgDuration: number
  }
  posture: {
    score: number
    slouching: number
    leaning: number
  }
  gestures: {
    frequency: number
    openGestures: number
    closedGestures: number
  }
  engagement: {
    score: number
    energyLevel: number
    confidence: number
  }
}

interface VideoFeedback {
  id: string
  type: "warning" | "info" | "success"
  category: "eye-contact" | "posture" | "gestures" | "engagement"
  message: string
  suggestion: string
  timestamp: number
}

export function VideoAnalysisMode() {
  const [isRecording, setIsRecording] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [analysisData, setAnalysisData] = useState<VideoAnalysisData>({
    eyeContact: { percentage: 0, deviations: 0, avgDuration: 0 },
    posture: { score: 0, slouching: 0, leaning: 0 },
    gestures: { frequency: 0, openGestures: 0, closedGestures: 0 },
    engagement: { score: 0, energyLevel: 0, confidence: 0 },
  })
  const [feedback, setFeedback] = useState<VideoFeedback[]>([])
  const [sessionDuration, setSessionDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout>()
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const startVideoAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      setVideoEnabled(true)
      setIsRecording(true)

      // Start analysis simulation
      analysisIntervalRef.current = setInterval(() => {
        simulateVideoAnalysis()
      }, 2000)
    } catch (error) {
      console.error("Error accessing camera:", error)
      // Fallback to simulation without camera
      setVideoEnabled(false)
      setIsRecording(true)
      simulateVideoAnalysis()
    }
  }

  const stopVideoAnalysis = () => {
    setIsRecording(false)
    setVideoEnabled(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }
  }

  const simulateVideoAnalysis = () => {
    // Simulate real-time video analysis
    const newAnalysisData: VideoAnalysisData = {
      eyeContact: {
        percentage: Math.max(0, Math.min(100, analysisData.eyeContact.percentage + (Math.random() - 0.5) * 10)),
        deviations: analysisData.eyeContact.deviations + (Math.random() > 0.8 ? 1 : 0),
        avgDuration: 2.5 + Math.random() * 2,
      },
      posture: {
        score: Math.max(0, Math.min(100, analysisData.posture.score + (Math.random() - 0.5) * 15)),
        slouching: analysisData.posture.slouching + (Math.random() > 0.9 ? 1 : 0),
        leaning: analysisData.posture.leaning + (Math.random() > 0.85 ? 1 : 0),
      },
      gestures: {
        frequency: analysisData.gestures.frequency + Math.floor(Math.random() * 3),
        openGestures: analysisData.gestures.openGestures + (Math.random() > 0.6 ? 1 : 0),
        closedGestures: analysisData.gestures.closedGestures + (Math.random() > 0.8 ? 1 : 0),
      },
      engagement: {
        score: Math.max(0, Math.min(100, analysisData.engagement.score + (Math.random() - 0.5) * 12)),
        energyLevel: Math.max(0, Math.min(100, 60 + Math.random() * 40)),
        confidence: Math.max(0, Math.min(100, 70 + Math.random() * 30)),
      },
    }

    setAnalysisData(newAnalysisData)

    // Generate feedback based on analysis
    generateVideoFeedback(newAnalysisData)
  }

  const generateVideoFeedback = (data: VideoAnalysisData) => {
    const newFeedback: VideoFeedback[] = []

    // Eye contact feedback
    if (data.eyeContact.percentage < 60) {
      newFeedback.push({
        id: `eye-${Date.now()}`,
        type: "warning",
        category: "eye-contact",
        message: "Low eye contact detected",
        suggestion: "Try to look directly at the camera more often to maintain audience engagement",
        timestamp: Date.now(),
      })
    } else if (data.eyeContact.percentage > 85) {
      newFeedback.push({
        id: `eye-${Date.now()}`,
        type: "success",
        category: "eye-contact",
        message: "Excellent eye contact!",
        suggestion: "Great job maintaining focus on your audience",
        timestamp: Date.now(),
      })
    }

    // Posture feedback
    if (data.posture.score < 70) {
      newFeedback.push({
        id: `posture-${Date.now()}`,
        type: "warning",
        category: "posture",
        message: "Posture needs improvement",
        suggestion: "Stand up straight and keep your shoulders back to project confidence",
        timestamp: Date.now(),
      })
    }

    // Gesture feedback
    if (data.gestures.closedGestures > data.gestures.openGestures) {
      newFeedback.push({
        id: `gesture-${Date.now()}`,
        type: "info",
        category: "gestures",
        message: "Consider using more open gestures",
        suggestion: "Open palm gestures appear more welcoming and trustworthy to your audience",
        timestamp: Date.now(),
      })
    }

    // Engagement feedback
    if (data.engagement.confidence < 60) {
      newFeedback.push({
        id: `engagement-${Date.now()}`,
        type: "info",
        category: "engagement",
        message: "Boost your confidence",
        suggestion: "Take a deep breath and speak with more conviction to appear more authoritative",
        timestamp: Date.now(),
      })
    }

    if (newFeedback.length > 0) {
      setFeedback((prev) => [...newFeedback, ...prev.slice(0, 9)]) // Keep last 10
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "eye-contact":
        return <Eye className="w-4 h-4" />
      case "posture":
        return <Users className="w-4 h-4" />
      case "gestures":
        return <Hand className="w-4 h-4" />
      case "engagement":
        return <Target className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Video className="w-6 h-6 text-green-600" />
            <span>Video Analysis Mode</span>
            {isRecording && <Badge className="bg-red-500 animate-pulse">RECORDING</Badge>}
          </CardTitle>
          <p className="text-gray-600">
            AI-powered analysis of your presentation skills including eye contact, posture, and gestures
          </p>
        </CardHeader>
      </Card>

      {/* Video Feed and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Video Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play()
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Camera not available</p>
                    <p className="text-sm text-gray-400">Analysis running in simulation mode</p>
                  </div>
                </div>
              )}

              {/* Analysis Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge className="bg-red-500 text-white">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                    REC {formatTime(sessionDuration)}
                  </Badge>
                  <Badge className="bg-blue-500 text-white">AI Analysis Active</Badge>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" width="640" height="480" />

            <div className="flex justify-center space-x-4">
              <Button
                onClick={isRecording ? stopVideoAnalysis : startVideoAnalysis}
                size="lg"
                className={`${
                  isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } text-white`}
              >
                {isRecording ? (
                  <>
                    <VideoOff className="w-5 h-5 mr-2" />
                    Stop Analysis
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Eye Contact</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(analysisData.eyeContact.percentage)}`}>
                  {Math.round(analysisData.eyeContact.percentage)}%
                </div>
                <Progress value={analysisData.eyeContact.percentage} className="mt-2 h-2" />
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Posture</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(analysisData.posture.score)}`}>
                  {Math.round(analysisData.posture.score)}%
                </div>
                <Progress value={analysisData.posture.score} className="mt-2 h-2" />
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Hand className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Gestures</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{analysisData.gestures.frequency}</div>
                <p className="text-xs text-purple-700 mt-1">
                  {analysisData.gestures.openGestures} open, {analysisData.gestures.closedGestures} closed
                </p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Engagement</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(analysisData.engagement.score)}`}>
                  {Math.round(analysisData.engagement.score)}%
                </div>
                <Progress value={analysisData.engagement.score} className="mt-2 h-2" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Energy Level</span>
                  <span>{Math.round(analysisData.engagement.energyLevel)}%</span>
                </div>
                <Progress value={analysisData.engagement.energyLevel} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(analysisData.engagement.confidence)}%</span>
                </div>
                <Progress value={analysisData.engagement.confidence} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Real-time Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {feedback.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No feedback yet</p>
                <p className="text-sm text-gray-400">Start recording to receive presentation tips</p>
              </div>
            ) : (
              feedback.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    item.type === "warning"
                      ? "border-l-orange-500 bg-orange-50"
                      : item.type === "success"
                        ? "border-l-green-500 bg-green-50"
                        : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <div className="mt-0.5">
                        {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                        {item.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {item.type === "info" && getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.message}</p>
                        <p className="text-xs text-gray-600 mt-1">💡 {item.suggestion}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Eye Contact Tracking</p>
                  <p className="text-sm text-gray-600">Monitor gaze direction and focus</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Posture Analysis</p>
                  <p className="text-sm text-gray-600">Detect slouching and body position</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Gesture Recognition</p>
                  <p className="text-sm text-gray-600">Analyze hand movements and gestures</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Engagement Scoring</p>
                  <p className="text-sm text-gray-600">Overall presentation effectiveness</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
