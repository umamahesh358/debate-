"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Activity, Target } from "lucide-react"

interface RealtimeTranscriptProps {
  transcript: string[]
  isListening: boolean
  relevanceScore: number
}

export function RealtimeTranscript({ transcript, isListening, relevanceScore }: RealtimeTranscriptProps) {
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

  return (
    <Card className="h-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Live Transcript</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isListening && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Mic className="w-3 h-3 mr-1" />
                Listening
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
        <ScrollArea className="h-48" ref={scrollAreaRef}>
          <div className="space-y-3">
            {transcript.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Start speaking to see your transcript here</p>
                <p className="text-sm">AI will analyze your arguments in real-time</p>
              </div>
            ) : (
              transcript.map((text, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    index === transcript.length - 1
                      ? "bg-blue-50 border-l-blue-500 animate-pulse"
                      : "bg-gray-50 border-l-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-800 flex-1">{text}</p>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isListening && (
              <div className="flex items-center space-x-2 text-blue-600 animate-pulse">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span className="text-sm">Processing speech...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
