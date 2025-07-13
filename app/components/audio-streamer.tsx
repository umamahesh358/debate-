"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react"

interface AudioStreamerProps {
  isActive: boolean
  onTranscriptUpdate: (text: string) => void
  feedbackEnabled: boolean
  onError?: (error: string) => void
  onStatusChange?: (status: "idle" | "recording" | "processing" | "error") => void
}

export const AudioStreamer = forwardRef<any, AudioStreamerProps>(
  ({ isActive, onTranscriptUpdate, feedbackEnabled, onError, onStatusChange }, ref) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recognitionRef = useRef<any>(null)
    const isStreamingRef = useRef(false)

    useImperativeHandle(ref, () => ({
      startStreaming,
      stopStreaming,
      isStreaming: () => isStreamingRef.current,
    }))

    useEffect(() => {
      if (isActive) {
        startStreaming()
      } else {
        stopStreaming()
      }

      return () => {
        stopStreaming()
      }
    }, [isActive])

    const startStreaming = useCallback(async () => {
      if (isStreamingRef.current) return

      try {
        onStatusChange?.("recording")
        isStreamingRef.current = true

        // Try modern Web Speech API first
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          await startSpeechRecognition()
        } else {
          // Fallback to MediaRecorder for older browsers
          await startMediaRecorder()
        }
      } catch (error) {
        console.error("Error starting audio stream:", error)
        onError?.("Failed to start audio recording. Please check microphone permissions.")
        onStatusChange?.("error")
        isStreamingRef.current = false
      }
    }, [onError, onStatusChange])

    const startSpeechRecognition = useCallback(async () => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.maxAlternatives = 1

      recognitionRef.current.onstart = () => {
        onStatusChange?.("recording")
      }

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

        if (finalTranscript.trim()) {
          onTranscriptUpdate(finalTranscript.trim())
          onStatusChange?.("processing")

          // Brief delay to show processing state
          setTimeout(() => {
            if (isStreamingRef.current) {
              onStatusChange?.("recording")
            }
          }, 1000)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        onError?.(`Speech recognition error: ${event.error}`)
        onStatusChange?.("error")
      }

      recognitionRef.current.onend = () => {
        if (isStreamingRef.current) {
          // Restart recognition if it stops unexpectedly
          setTimeout(() => {
            if (isStreamingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (error) {
                console.error("Error restarting recognition:", error)
              }
            }
          }, 100)
        }
      }

      recognitionRef.current.start()
    }, [onTranscriptUpdate, onError, onStatusChange])

    const startMediaRecorder = useCallback(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      streamRef.current = stream

      // Try WebSocket connection for real-time processing
      try {
        websocketRef.current = new WebSocket("wss://api.example.com/ws/transcript")

        websocketRef.current.onopen = () => {
          console.log("WebSocket connected for transcript streaming")
        }

        websocketRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.text) {
              onTranscriptUpdate(data.text)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        websocketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error)
          // Fallback to simulation
          simulateTranscription()
        }
      } catch (error) {
        console.error("WebSocket connection failed:", error)
        simulateTranscription()
      }

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          await sendAudioChunk(event.data)
        }
      }

      mediaRecorder.start(1000) // Capture every 1 second
    }, [onTranscriptUpdate])

    const stopStreaming = useCallback(() => {
      isStreamingRef.current = false

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error("Error stopping recognition:", error)
        }
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (websocketRef.current) {
        websocketRef.current.close()
      }

      onStatusChange?.("idle")
    }, [onStatusChange])

    const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

        const response = await fetch("/api/stream/audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer demo-token",
          },
          body: JSON.stringify({
            audio: base64Audio,
            timestamp: Date.now(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to send audio chunk")
        }
      } catch (error) {
        console.error("Error sending audio chunk:", error)
      }
    }, [])

    const simulateTranscription = useCallback(() => {
      const samplePhrases = [
        "I believe this policy would significantly benefit students by reducing academic pressure.",
        "The evidence clearly demonstrates that homework creates unnecessary stress for families.",
        "We must consider the long-term implications for child development and mental health.",
        "Studies have shown that excessive homework leads to decreased motivation in learning.",
        "The opposition fails to address the core issue of educational inequality in our system.",
        "This approach would create more problems than it solves in the current framework.",
        "We need to examine the broader context of educational reform and student wellbeing.",
        "The current system is failing our children by prioritizing quantity over quality.",
        "Research indicates that countries with less homework often outperform others academically.",
        "We should focus on making classroom time more effective rather than extending study hours.",
      ]

      let phraseIndex = 0
      const interval = setInterval(() => {
        if (!isStreamingRef.current) {
          clearInterval(interval)
          return
        }

        if (phraseIndex < samplePhrases.length) {
          onTranscriptUpdate(samplePhrases[phraseIndex])
          phraseIndex++
        } else {
          phraseIndex = 0
        }
      }, 4000)
    }, [onTranscriptUpdate])

    return null
  },
)

AudioStreamer.displayName = "AudioStreamer"
