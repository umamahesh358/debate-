"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react"

interface VoiceDebateEngineProps {
  topic: any
  userRole: "government" | "opposition"
  isActive: boolean
  onTranscriptUpdate: (text: string) => void
  onFeedback: (feedback: any) => void
  onAiResponse: (response: string) => void
  voiceEnabled: boolean
  aiVoiceEnabled: boolean
}

export const VoiceDebateEngine = forwardRef<any, VoiceDebateEngineProps>(
  ({ topic, userRole, isActive, onTranscriptUpdate, onFeedback, onAiResponse, voiceEnabled, aiVoiceEnabled }, ref) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const transcriptBufferRef = useRef<string[]>([])
    const analysisIntervalRef = useRef<NodeJS.Timeout>()
    const speechSynthRef = useRef<SpeechSynthesis | null>(null)
    const recognitionRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      startRecording,
      stopRecording,
      speakText,
      stopSpeaking,
      getTranscriptBuffer: () => transcriptBufferRef.current,
    }))

    useEffect(() => {
      if (typeof window !== "undefined") {
        // Initialize Speech Recognition
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
          recognitionRef.current = new SpeechRecognition()
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = "en-US"

          recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = ""
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript
              }
            }

            if (finalTranscript.trim()) {
              transcriptBufferRef.current.push(finalTranscript.trim())
              onTranscriptUpdate(finalTranscript.trim())
            }
          }
        }

        // Initialize Speech Synthesis
        speechSynthRef.current = window.speechSynthesis
      }

      return () => {
        stopRecording()
        stopSpeaking()
      }
    }, [])

    useEffect(() => {
      if (isActive && voiceEnabled) {
        startRecording()
      } else {
        stopRecording()
      }
    }, [isActive, voiceEnabled])

    const startRecording = useCallback(async () => {
      if (!voiceEnabled || !recognitionRef.current) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        })

        streamRef.current = stream
        recognitionRef.current.start()

        // Start continuous analysis
        analysisIntervalRef.current = setInterval(() => {
          analyzeTranscriptBuffer()
        }, 5000)
      } catch (error) {
        console.error("Error starting recording:", error)
      }
    }, [voiceEnabled])

    const stopRecording = useCallback(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error("Error stopping recognition:", error)
        }
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
    }, [])

    const speakText = useCallback(
      (text: string) => {
        if (!aiVoiceEnabled || !speechSynthRef.current) return

        speechSynthRef.current.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 0.8

        // Try to use a more natural voice
        const voices = speechSynthRef.current.getVoices()
        const preferredVoice = voices.find(
          (voice) =>
            voice.name.includes("Google") ||
            voice.name.includes("Microsoft") ||
            voice.name.includes("Natural") ||
            voice.lang.startsWith("en"),
        )
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }

        speechSynthRef.current.speak(utterance)
      },
      [aiVoiceEnabled],
    )

    const stopSpeaking = useCallback(() => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel()
      }
    }, [])

    const analyzeTranscriptBuffer = useCallback(async () => {
      if (transcriptBufferRef.current.length === 0) return

      const recentText = transcriptBufferRef.current.slice(-2).join(" ")
      const analysis = await performDebateAnalysis(recentText, topic, userRole)

      if (analysis.needsFeedback) {
        onFeedback(analysis.feedback)
      }

      if (analysis.needsAiResponse) {
        const aiResponse = await generateAiResponse(recentText)
        onAiResponse(aiResponse)
        if (aiVoiceEnabled) {
          speakText(aiResponse)
        }
      }
    }, [topic, userRole, onFeedback, onAiResponse, aiVoiceEnabled, speakText])

    const performDebateAnalysis = async (text: string, topic: any, role: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const topicKeywords = topic.motion.toLowerCase().split(" ")
      const textLower = text.toLowerCase()
      const relevanceScore = calculateRelevanceScore(textLower, topicKeywords)
      const issues = detectCommonIssues(text)

      return {
        needsFeedback: relevanceScore < 0.6 || issues.length > 0,
        needsAiResponse: text.length > 50,
        feedback:
          relevanceScore < 0.6 || issues.length > 0
            ? generateFeedback(text, issues, relevanceScore, topic, role)
            : null,
      }
    }

    const calculateRelevanceScore = (text: string, keywords: string[]): number => {
      const matches = keywords.filter((keyword) => text.includes(keyword)).length
      return Math.min(matches / keywords.length + 0.3, 1.0)
    }

    const detectCommonIssues = (text: string): string[] => {
      const issues = []
      if (!text.includes("because") && !text.includes("therefore") && !text.includes("this means")) {
        issues.push("missing_impact")
      }
      if (!text.includes("study") && !text.includes("research") && !text.includes("evidence")) {
        issues.push("weak_evidence")
      }
      return issues
    }

    const generateFeedback = (text: string, issues: string[], relevanceScore: number, topic: any, role: string) => {
      return {
        type: "info",
        title: "Improve Your Argument",
        message: "Consider adding stronger evidence and clearer impact statements.",
        suggestion: "Use phrases like 'This is important because...' to strengthen your points.",
        icon: "💡",
        relevanceScore: Math.round(relevanceScore * 100),
        timestamp: Date.now(),
      }
    }

    const generateAiResponse = async (userInput: string): Promise<string> => {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const opposingRole = userRole === "government" ? "opposition" : "government"
      const opposingArgs = topic.keyArguments[opposingRole]

      const responses = [
        `I understand your point, but ${opposingArgs[0].toLowerCase()}. This fundamentally challenges your argument because it addresses the core issue differently.`,
        `That's an interesting perspective, however ${opposingArgs[1].toLowerCase()}. The evidence suggests that this approach would be more effective.`,
        `While you make valid points, we must consider that ${opposingArgs[2]?.toLowerCase() || "there are alternative approaches"}. This is crucial for a comprehensive solution.`,
      ]

      return responses[Math.floor(Math.random() * responses.length)]
    }

    return null
  },
)

VoiceDebateEngine.displayName = "VoiceDebateEngine"
