"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

interface AudioStreamerProps {
  isActive: boolean
  onTranscriptUpdate: (text: string) => void
  feedbackEnabled: boolean
}

export const AudioStreamer = forwardRef<any, AudioStreamerProps>(
  ({ isActive, onTranscriptUpdate, feedbackEnabled }, ref) => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const websocketRef = useRef<WebSocket | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    useImperativeHandle(ref, () => ({
      startStreaming,
      stopStreaming,
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

    const startStreaming = async () => {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        })

        streamRef.current = stream

        // Setup WebSocket connection for real-time streaming
        websocketRef.current = new WebSocket("ws://localhost:3001/ws/transcript")

        websocketRef.current.onopen = () => {
          console.log("WebSocket connected for transcript streaming")
        }

        websocketRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.text) {
            onTranscriptUpdate(data.text)
          }
        }

        websocketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error)
          // Fallback to simulation
          simulateTranscription()
        }

        // Setup MediaRecorder for audio chunks
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
      } catch (error) {
        console.error("Error starting audio stream:", error)
        // Fallback to simulation for demo
        simulateTranscription()
      }
    }

    const stopStreaming = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }

    const sendAudioChunk = async (audioBlob: Blob) => {
      try {
        // Convert blob to base64 for transmission
        const arrayBuffer = await audioBlob.arrayBuffer()
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

        // Send to STT service
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
    }

    const simulateTranscription = () => {
      // Simulate real-time transcription for demo
      const samplePhrases = [
        "I believe that this policy would significantly benefit students by reducing stress levels.",
        "The evidence clearly demonstrates that homework creates an unnecessary burden on families.",
        "We must consider the long-term implications for child development and mental health.",
        "Studies have shown that excessive homework leads to decreased motivation and burnout.",
        "The opposition fails to address the core issue of educational inequality in our system.",
        "This approach would create more problems than it solves in the current educational framework.",
        "We need to examine the broader context of educational reform and student wellbeing.",
        "The current system is failing our children by prioritizing quantity over quality of learning.",
        "Research indicates that countries with less homework often outperform those with more.",
        "We should focus on making classroom time more effective rather than extending learning hours.",
      ]

      let phraseIndex = 0
      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval)
          return
        }

        if (phraseIndex < samplePhrases.length) {
          onTranscriptUpdate(samplePhrases[phraseIndex])
          phraseIndex++
        } else {
          phraseIndex = 0 // Loop back
        }
      }, 3000) // New phrase every 3 seconds
    }

    return null // This component doesn't render anything
  },
)

AudioStreamer.displayName = "AudioStreamer"
