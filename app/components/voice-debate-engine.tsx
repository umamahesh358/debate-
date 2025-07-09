"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

interface VoiceDebateEngineProps {
  topic: any
  userRole: "government" | "opposition"
  isActive: boolean
  onTranscriptUpdate: (text: string) => void
  onFeedback: (feedback: any) => void
}

export const VoiceDebateEngine = forwardRef<any, VoiceDebateEngineProps>(
  ({ topic, userRole, isActive, onTranscriptUpdate, onFeedback }, ref) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const transcriptBufferRef = useRef<string[]>([])
    const analysisIntervalRef = useRef<NodeJS.Timeout>()

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
      getTranscriptBuffer: () => transcriptBufferRef.current,
    }))

    useEffect(() => {
      if (isActive) {
        startRecording()
      } else {
        stopRecording()
      }

      return () => {
        stopRecording()
      }
    }, [isActive])

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        })

        streamRef.current = stream

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        })

        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
            processAudioChunk(event.data)
          }
        }

        mediaRecorder.start(1000) // Capture every 1 second

        // Start continuous analysis
        analysisIntervalRef.current = setInterval(() => {
          analyzeTranscriptBuffer()
        }, 3000) // Analyze every 3 seconds
      } catch (error) {
        console.error("Error starting recording:", error)
        // Simulate recording for demo purposes
        simulateRecording()
      }
    }

    const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }

    const processAudioChunk = async (audioBlob: Blob) => {
      // In a real implementation, this would send audio to STT service
      // For demo, we'll simulate speech-to-text
      const simulatedText = await simulateSpeechToText(audioBlob)

      if (simulatedText) {
        transcriptBufferRef.current.push(simulatedText)
        onTranscriptUpdate(simulatedText)
      }
    }

    const simulateSpeechToText = async (audioBlob: Blob): Promise<string> => {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Sample debate phrases for simulation
      const samplePhrases = [
        "I believe that this policy would benefit students significantly.",
        "The evidence clearly shows that homework creates unnecessary stress.",
        "We must consider the long-term implications for child development.",
        "Studies have demonstrated that family time is crucial for wellbeing.",
        "The opposition fails to address the core issue of educational inequality.",
        "This approach would create more problems than it solves.",
        "We need to look at the broader context of educational reform.",
        "The current system is failing our children in multiple ways.",
      ]

      return samplePhrases[Math.floor(Math.random() * samplePhrases.length)]
    }

    const simulateRecording = () => {
      // Simulate recording when microphone access is denied
      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval)
          return
        }

        const simulatedText = [
          "I believe that homework in primary schools creates unnecessary stress for young children.",
          "The evidence shows that family time is more valuable than additional study time at home.",
          "Children learn better through play and exploration rather than structured homework.",
          "This policy would create inequality between families with different resources.",
          "We must consider the mental health implications of excessive academic pressure.",
        ][Math.floor(Math.random() * 5)]

        transcriptBufferRef.current.push(simulatedText)
        onTranscriptUpdate(simulatedText)
      }, 3000)

      // Start analysis simulation
      analysisIntervalRef.current = setInterval(() => {
        analyzeTranscriptBuffer()
      }, 5000)
    }

    const analyzeTranscriptBuffer = async () => {
      if (transcriptBufferRef.current.length === 0) return

      const recentText = transcriptBufferRef.current.slice(-3).join(" ")

      // Simulate various types of analysis
      const analysis = await performDebateAnalysis(recentText, topic, userRole)

      if (analysis.needsFeedback) {
        onFeedback(analysis.feedback)
      }
    }

    const performDebateAnalysis = async (text: string, topic: any, role: string) => {
      // Simulate analysis processing
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simple keyword-based analysis for demo
      const topicKeywords = topic.motion.toLowerCase().split(" ")
      const textLower = text.toLowerCase()

      // Check relevance
      const relevanceScore = calculateRelevanceScore(textLower, topicKeywords)

      // Check for common issues
      const issues = detectCommonIssues(text)

      // Generate feedback if needed
      if (relevanceScore < 0.6 || issues.length > 0) {
        return {
          needsFeedback: true,
          feedback: generateFeedback(text, issues, relevanceScore, topic, role),
        }
      }

      return { needsFeedback: false }
    }

    const calculateRelevanceScore = (text: string, keywords: string[]): number => {
      const matches = keywords.filter((keyword) => text.includes(keyword)).length
      return Math.min(matches / keywords.length + 0.3, 1.0)
    }

    const detectCommonIssues = (text: string): string[] => {
      const issues = []

      // Check for missing impact
      if (!text.includes("because") && !text.includes("therefore") && !text.includes("this means")) {
        issues.push("missing_impact")
      }

      // Check for weak evidence
      if (
        !text.includes("study") &&
        !text.includes("research") &&
        !text.includes("evidence") &&
        !text.includes("data")
      ) {
        issues.push("weak_evidence")
      }

      // Check for logical fallacies (simplified)
      if (text.includes("everyone") || text.includes("always") || text.includes("never")) {
        issues.push("overgeneralization")
      }

      return issues
    }

    const generateFeedback = (text: string, issues: string[], relevanceScore: number, topic: any, role: string) => {
      const feedbackTypes = {
        low_relevance: {
          type: "warning",
          title: "Stay On Topic",
          message: `Your argument seems to drift from the main motion: "${topic.motion}". Try to directly address why ${role === "government" ? "this policy should be implemented" : "this policy should be rejected"}.`,
          suggestion: "Refocus on the core issue and explain how your point directly supports your position.",
          icon: "🎯",
        },
        missing_impact: {
          type: "info",
          title: "Add Impact",
          message: "Your argument needs a stronger impact statement. Explain WHY your point matters.",
          suggestion: 'Add phrases like "This is important because..." or "The consequence of this is..."',
          icon: "💥",
        },
        weak_evidence: {
          type: "info",
          title: "Strengthen Evidence",
          message: "Consider adding stronger evidence to support your claim.",
          suggestion: "Reference studies, statistics, expert opinions, or concrete examples.",
          icon: "📊",
        },
        overgeneralization: {
          type: "warning",
          title: "Avoid Overgeneralization",
          message: 'Be careful with absolute statements like "everyone" or "always".',
          suggestion: 'Use more precise language: "many people" or "often" instead.',
          icon: "⚠️",
        },
      }

      // Prioritize feedback
      if (relevanceScore < 0.6) {
        return {
          ...feedbackTypes.low_relevance,
          relevanceScore: Math.round(relevanceScore * 100),
          timestamp: Date.now(),
        }
      }

      if (issues.length > 0) {
        const primaryIssue = issues[0] as keyof typeof feedbackTypes
        return {
          ...feedbackTypes[primaryIssue],
          relevanceScore: Math.round(relevanceScore * 100),
          timestamp: Date.now(),
        }
      }

      return null
    }

    return null // This component doesn't render anything
  },
)

VoiceDebateEngine.displayName = "VoiceDebateEngine"
