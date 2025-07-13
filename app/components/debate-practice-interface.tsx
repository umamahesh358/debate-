"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Timer,
  MessageSquare,
  Brain,
  Target,
  Zap,
  Users,
  Clock,
  RotateCcw,
  Trophy,
  Star,
} from "lucide-react"

interface DebateMessage {
  id: string
  speaker: "user" | "ai"
  content: string
  timestamp: number
  isProcessing?: boolean
}

interface DebateTopic {
  id: string
  title: string
  motion: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  timeLimit: number
  keyArguments: {
    government: string[]
    opposition: string[]
  }
}

export function DebatePracticeInterface() {
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null)
  const [userRole, setUserRole] = useState<"government" | "opposition">("government")
  const [debatePhase, setDebatePhase] = useState<"setup" | "prep" | "debate" | "results">("setup")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [maxRounds] = useState(6)

  // Voice features
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")

  // Debate state
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [preparationNotes, setPreparationNotes] = useState("")
  const [debateScore, setDebateScore] = useState(0)

  // Refs for voice functionality
  const recognitionRef = useRef<any>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const debateTopics: DebateTopic[] = [
    {
      id: "homework-ban",
      title: "Homework Ban in Primary Schools",
      motion: "This house would ban homework in primary schools",
      description: "Debate whether young children should have homework assignments",
      difficulty: "Beginner",
      timeLimit: 600, // 10 minutes
      keyArguments: {
        government: [
          "Homework creates unnecessary stress for young children and families",
          "Children learn better through play and exploration at home",
          "Family time is more valuable than additional study time",
          "Homework creates inequality between families with different resources",
        ],
        opposition: [
          "Homework reinforces learning and helps develop study habits",
          "Parents can be involved in their child's education through homework",
          "Homework prepares children for increased academic responsibility",
          "Practice at home helps consolidate classroom learning",
        ],
      },
    },
    {
      id: "social-media-age",
      title: "Social Media Age Restrictions",
      motion: "This house would ban social media for users under 16",
      description: "Explore the impact of social media on young people's development",
      difficulty: "Intermediate",
      timeLimit: 900, // 15 minutes
      keyArguments: {
        government: [
          "Social media negatively impacts mental health and self-esteem in teenagers",
          "Young people are vulnerable to cyberbullying and online predators",
          "Social media addiction interferes with academic performance and real-world relationships",
          "Age restrictions would protect developing minds from harmful content",
        ],
        opposition: [
          "Social media provides valuable educational and creative opportunities",
          "Young people can develop digital literacy and communication skills",
          "Age restrictions are difficult to enforce and may drive underground usage",
          "Social media helps young people connect with communities and support networks",
        ],
      },
    },
    {
      id: "climate-refugees",
      title: "Climate Refugee Acceptance",
      motion: "This house believes developed nations should accept unlimited climate refugees",
      description: "Examine the responsibilities of wealthy nations toward climate displacement",
      difficulty: "Advanced",
      timeLimit: 1200, // 20 minutes
      keyArguments: {
        government: [
          "Developed nations have historical responsibility for climate change",
          "Moral obligation to help those displaced by environmental disasters",
          "Economic benefits from increased immigration and workforce diversity",
          "International cooperation is essential for addressing global challenges",
        ],
        opposition: [
          "Unlimited immigration could strain public services and infrastructure",
          "Need for controlled immigration to maintain social cohesion",
          "Other solutions like climate adaptation funding may be more effective",
          "National sovereignty includes the right to control immigration policy",
        ],
      },
    },
  ]

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize Speech Recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onstart = () => {
          setIsProcessingVoice(true)
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

          setCurrentTranscript(interimTranscript)

          if (finalTranscript.trim()) {
            handleUserSpeech(finalTranscript.trim())
            setCurrentTranscript("")
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsRecording(false)
          setIsProcessingVoice(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
          setIsProcessingVoice(false)
        }
      }

      // Initialize Speech Synthesis
      speechSynthRef.current = window.speechSynthesis
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.stop()
      if (speechSynthRef.current) speechSynthRef.current.cancel()
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [debateMessages])

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            handlePhaseComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning, timeRemaining])

  const handlePhaseComplete = () => {
    if (debatePhase === "prep") {
      setDebatePhase("debate")
      setTimeRemaining(selectedTopic?.timeLimit || 600)
      setIsTimerRunning(true)
      startDebateWithAI()
    } else if (debatePhase === "debate") {
      setDebatePhase("results")
      calculateFinalScore()
    }
  }

  const handleUserSpeech = useCallback(
    (transcript: string) => {
      if (debatePhase !== "debate" || transcript.length < 10) return

      const userMessage: DebateMessage = {
        id: `user-${Date.now()}`,
        speaker: "user",
        content: transcript,
        timestamp: Date.now(),
      }

      setDebateMessages((prev) => [...prev, userMessage])
      setUserInput(transcript)
      setIsProcessingVoice(false)

      // Generate AI response after a brief delay
      setTimeout(() => {
        generateAiResponse(transcript)
      }, 2000)
    },
    [debatePhase],
  )

  const generateAiResponse = useCallback(
    async (userInput: string) => {
      if (!selectedTopic) return

      const processingMessage: DebateMessage = {
        id: `ai-processing-${Date.now()}`,
        speaker: "ai",
        content: "Thinking...",
        timestamp: Date.now(),
        isProcessing: true,
      }

      setDebateMessages((prev) => [...prev, processingMessage])

      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2500))

      const aiResponse = await generateContextualResponse(userInput, currentRound)

      setDebateMessages((prev) =>
        prev
          .filter((msg) => !msg.isProcessing)
          .concat({
            id: `ai-${Date.now()}`,
            speaker: "ai",
            content: aiResponse,
            timestamp: Date.now(),
          }),
      )

      if (aiVoiceEnabled) {
        speakText(aiResponse)
      }

      setCurrentRound((prev) => Math.min(prev + 1, maxRounds))
    },
    [selectedTopic, currentRound, aiVoiceEnabled, maxRounds],
  )

  const generateContextualResponse = async (userInput: string, round: number): Promise<string> => {
    if (!selectedTopic) return "I need more information to respond."

    const opposingRole = userRole === "government" ? "opposition" : "government"
    const opposingArgs = selectedTopic.keyArguments[opposingRole]

    // Analyze user input for sophistication
    const inputLower = userInput.toLowerCase()
    const hasEvidence = inputLower.includes("study") || inputLower.includes("research") || inputLower.includes("data")
    const hasExample = inputLower.includes("example") || inputLower.includes("instance")
    const isStrong = userInput.length > 100 && (hasEvidence || hasExample)

    let responseType = "counter"
    if (round <= 1) responseType = "opening"
    else if (round >= maxRounds - 1) responseType = "closing"
    else if (isStrong) responseType = "strong_counter"

    const responses = {
      opening: [
        `Thank you for that opening statement. However, I fundamentally disagree with your position. ${opposingArgs[0]} This is a critical point that undermines the foundation of your argument.`,
        `I appreciate your perspective, but there are several significant flaws in that reasoning. ${opposingArgs[1]} This is particularly important when we consider the real-world implications.`,
      ],
      counter: [
        `While you make some valid points, your argument overlooks a fundamental issue: ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} This significantly weakens your position.`,
        `I understand your perspective, but the evidence actually suggests otherwise. ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} This contradicts your central claims.`,
      ],
      strong_counter: [
        `You've presented a well-researched argument, and I respect the evidence you've provided. However, there's a critical counterpoint: ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} Recent studies have shown that this correlation doesn't hold up under scrutiny.`,
        `I acknowledge the strength of your evidence, but there's a significant methodological flaw in that reasoning. ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} Leading experts consistently argue that this approach creates more problems than it solves.`,
      ],
      closing: [
        `As we conclude this debate, I want to emphasize that while you've made some compelling points, the fundamental issues remain unresolved. ${opposingArgs[0]} The evidence clearly supports my position on this matter.`,
        `Thank you for this engaging debate. Throughout our discussion, it's become clear that ${opposingArgs[Math.floor(Math.random() * opposingArgs.length)]} The arguments I've presented demonstrate why this position is ultimately the most sound.`,
      ],
    }

    return responses[responseType as keyof typeof responses][
      Math.floor(Math.random() * responses[responseType as keyof typeof responses].length)
    ]
  }

  const speakText = useCallback(
    (text: string) => {
      if (!speechSynthRef.current || !aiVoiceEnabled) return

      speechSynthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      const voices = speechSynthRef.current.getVoices()
      const preferredVoice = voices.find((voice) => voice.name.includes("Google") || voice.name.includes("Microsoft"))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => setIsAiSpeaking(true)
      utterance.onend = () => setIsAiSpeaking(false)
      utterance.onerror = () => setIsAiSpeaking(false)

      speechSynthRef.current.speak(utterance)
    },
    [aiVoiceEnabled],
  )

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const stopAiSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel()
      setIsAiSpeaking(false)
    }
  }

  const handleTextSubmit = () => {
    if (!userInput.trim() || debatePhase !== "debate") return

    const userMessage: DebateMessage = {
      id: `user-${Date.now()}`,
      speaker: "user",
      content: userInput.trim(),
      timestamp: Date.now(),
    }

    setDebateMessages((prev) => [...prev, userMessage])
    const currentInput = userInput.trim()
    setUserInput("")

    setTimeout(() => {
      generateAiResponse(currentInput)
    }, 2000)
  }

  const startDebateWithAI = () => {
    const aiOpening = `Welcome to this debate on "${selectedTopic?.motion}". I'll be arguing for the ${userRole === "government" ? "opposition" : "government"} side. I believe there are significant issues with your position. Please present your opening argument, and I'll respond accordingly.`

    const aiMessage: DebateMessage = {
      id: `ai-opening-${Date.now()}`,
      speaker: "ai",
      content: aiOpening,
      timestamp: Date.now(),
    }

    setDebateMessages([aiMessage])

    if (aiVoiceEnabled) {
      speakText(aiOpening)
    }
  }

  const calculateFinalScore = () => {
    const messageCount = debateMessages.filter((msg) => msg.speaker === "user").length
    const avgMessageLength =
      debateMessages.filter((msg) => msg.speaker === "user").reduce((sum, msg) => sum + msg.content.length, 0) /
        messageCount || 0

    const baseScore = Math.min(messageCount * 15 + avgMessageLength * 0.5, 100)
    setDebateScore(Math.round(baseScore))
  }

  const resetDebate = () => {
    setDebatePhase("prep")
    setTimeRemaining(300) // 5 minutes prep
    setIsTimerRunning(false)
    setDebateMessages([])
    setCurrentRound(1)
    setUserInput("")
    setPreparationNotes("")
    setDebateScore(0)
    if (speechSynthRef.current) speechSynthRef.current.cancel()
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  const startTopic = (topic: DebateTopic) => {
    setSelectedTopic(topic)
    setDebatePhase("prep")
    setTimeRemaining(300) // 5 minutes prep time
    setIsTimerRunning(true)
    setDebateMessages([])
    setCurrentRound(1)
    setUserInput("")
    setPreparationNotes("")
    setDebateScore(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPhaseTitle = () => {
    switch (debatePhase) {
      case "setup":
        return "Choose Your Topic"
      case "prep":
        return "Preparation Time"
      case "debate":
        return "Live Debate"
      case "results":
        return "Debate Complete"
      default:
        return ""
    }
  }

  if (debatePhase === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">AI Debate Practice</h1>
            <p className="text-xl text-gray-600">Practice your debate skills with our intelligent AI opponent</p>
            <div className="flex justify-center space-x-4">
              <Badge className="bg-blue-100 text-blue-800">Voice Enabled</Badge>
              <Badge className="bg-purple-100 text-purple-800">Real-time Feedback</Badge>
              <Badge className="bg-green-100 text-green-800">Adaptive AI</Badge>
            </div>
          </div>

          {/* Topic Selection */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">Choose Your Debate Topic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {debateTopics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <Badge className={getDifficultyColor(topic.difficulty)}>{topic.difficulty}</Badge>
                    </div>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm text-gray-800">Motion:</p>
                      <p className="text-sm text-gray-600 italic">"{topic.motion}"</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(topic.timeLimit / 60)} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>1v1 AI</span>
                      </div>
                    </div>

                    <Button className="w-full" onClick={() => startTopic(topic)}>
                      Start Debate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Overview */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-center">Practice Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Voice Interaction</h3>
                  <p className="text-sm text-gray-600">Speak naturally and hear AI responses</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Intelligent AI</h3>
                  <p className="text-sm text-gray-600">Adaptive responses based on your arguments</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Real-time Feedback</h3>
                  <p className="text-sm text-gray-600">Instant analysis and improvement tips</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => setDebatePhase("setup")}
                  className="text-white hover:bg-white/20 p-0 h-auto"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Back to Topics
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/20 text-white border-white/30">{getPhaseTitle()}</Badge>
                  <Badge className={getDifficultyColor(selectedTopic?.difficulty || "Beginner")}>
                    {selectedTopic?.difficulty}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                    Round {currentRound}/{maxRounds}
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                    {userRole === "government" ? "Government" : "Opposition"}
                  </Badge>
                </div>
                <CardTitle className="text-xl lg:text-2xl">{selectedTopic?.title}</CardTitle>
                <p className="text-white/90 text-sm">"{selectedTopic?.motion}"</p>
              </div>

              {/* Timer and Controls */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold flex items-center">
                    <Timer className="w-8 h-8 mr-2" />
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      disabled={debatePhase === "results"}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetDebate}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-white/80 mb-1">Role</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserRole(userRole === "government" ? "opposition" : "government")}
                    disabled={debatePhase !== "prep"}
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                  >
                    Switch to {userRole === "government" ? "Opposition" : "Government"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {debatePhase === "prep" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Preparation Area */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Debate Preparation</CardTitle>
                <CardDescription>
                  Use this time to plan your arguments and strategy. You are arguing for the <strong>{userRole}</strong>{" "}
                  side.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Motion:</h4>
                  <p className="text-blue-800 italic">"{selectedTopic?.motion}"</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Your Role:</h4>
                  <p className="text-purple-800">
                    You are arguing for the <strong>{userRole}</strong> side. This means you{" "}
                    {userRole === "government" ? "support" : "oppose"} the motion.
                  </p>
                </div>

                <Textarea
                  placeholder="Write your preparation notes and key arguments here..."
                  value={preparationNotes}
                  onChange={(e) => setPreparationNotes(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{preparationNotes.length} characters</span>
                  <Button
                    onClick={handlePhaseComplete}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={timeRemaining > 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {timeRemaining > 0 ? `Start in ${formatTime(timeRemaining)}` : "Start Debate"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Key Arguments Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Key Arguments Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">
                      Your Arguments ({userRole === "government" ? "Government" : "Opposition"})
                    </h4>
                    <div className="space-y-2">
                      {selectedTopic?.keyArguments[userRole].map((argument, index) => (
                        <div key={index} className="p-2 bg-green-50 rounded text-xs border border-green-200">
                          <Badge variant="secondary" className="mr-2 text-xs">
                            {index + 1}
                          </Badge>
                          {argument}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-800 mb-2">
                      AI Arguments ({userRole === "government" ? "Opposition" : "Government"})
                    </h4>
                    <div className="space-y-2">
                      {selectedTopic?.keyArguments[userRole === "government" ? "opposition" : "government"]
                        .slice(0, 2)
                        .map((argument, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded text-xs border border-red-200">
                            <Badge variant="secondary" className="mr-2 text-xs">
                              {index + 1}
                            </Badge>
                            {argument}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {debatePhase === "debate" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Debate Interface */}
            <div className="xl:col-span-3 space-y-6">
              {/* Voice Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        onClick={toggleRecording}
                        variant={isRecording ? "destructive" : "default"}
                        size="lg"
                        disabled={isAiSpeaking}
                        className="min-w-[140px]"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-4 h-4 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>

                      {isAiSpeaking && (
                        <Button onClick={stopAiSpeaking} variant="outline" size="lg">
                          <Square className="w-4 h-4 mr-2" />
                          Stop AI
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <VolumeX className="w-4 h-4 text-gray-500" />
                        <Switch checked={aiVoiceEnabled} onCheckedChange={setAiVoiceEnabled} />
                        <Volume2 className="w-4 h-4 text-gray-700" />
                        <span className="text-sm text-gray-600">AI Voice</span>
                      </div>

                      <Badge
                        variant={
                          isRecording
                            ? "destructive"
                            : isProcessingVoice
                              ? "default"
                              : isAiSpeaking
                                ? "secondary"
                                : "outline"
                        }
                        className="min-w-[100px] justify-center"
                      >
                        {isRecording
                          ? "Recording..."
                          : isProcessingVoice
                            ? "Processing..."
                            : isAiSpeaking
                              ? "AI Speaking..."
                              : "Ready"}
                      </Badge>
                    </div>
                  </div>

                  {/* Live Transcript */}
                  {(currentTranscript || isProcessingVoice) && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-600 mb-1">Live Transcript:</div>
                      <div className="text-blue-800">
                        {currentTranscript || (isProcessingVoice && "Processing your speech...")}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Debate Messages */}
              <Card className="h-[400px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>Debate Conversation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {debateMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>The AI opponent will make an opening statement when the debate begins.</p>
                      </div>
                    ) : (
                      debateMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.speaker === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-lg ${
                              message.speaker === "user"
                                ? "bg-purple-600 text-white"
                                : message.isProcessing
                                  ? "bg-gray-100 text-gray-600 animate-pulse"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  message.speaker === "user" ? "bg-white/70" : "bg-purple-500"
                                }`}
                              />
                              <span className="text-xs opacity-70">
                                {message.speaker === "user" ? "You" : "AI Opponent"}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Text Input Alternative */}
                  <div className="border-t pt-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your response here (alternative to voice)..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        rows={2}
                        className="flex-1 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleTextSubmit()
                          }
                        }}
                      />
                      <Button
                        onClick={handleTextSubmit}
                        disabled={!userInput.trim() || isAiSpeaking}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span>Debate Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rounds</span>
                        <span>
                          {currentRound}/{maxRounds}
                        </span>
                      </div>
                      <Progress value={(currentRound / maxRounds) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Time Used</span>
                        <span>
                          {Math.round(((selectedTopic!.timeLimit - timeRemaining) / selectedTopic!.timeLimit) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={((selectedTopic!.timeLimit - timeRemaining) / selectedTopic!.timeLimit) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span>Live Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800">
                        <strong>Round {currentRound}:</strong>{" "}
                        {currentRound <= 1
                          ? "Present your strongest opening arguments"
                          : currentRound >= maxRounds - 1
                            ? "Summarize and reinforce your key points"
                            : "Address the AI's counterarguments directly"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-medium text-gray-700">Quick Reminders:</p>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Use evidence to support claims</li>
                        <li>• Address counterarguments</li>
                        <li>• Speak clearly and confidently</li>
                        <li>• Link back to the motion</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {debateMessages.filter((msg) => msg.speaker === "user").length}
                      </div>
                      <div className="text-xs text-gray-600">Arguments Made</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(
                          debateMessages
                            .filter((msg) => msg.speaker === "user")
                            .reduce((sum, msg) => sum + msg.content.length, 0) /
                            Math.max(debateMessages.filter((msg) => msg.speaker === "user").length, 1),
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Avg. Argument Length</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {debatePhase === "results" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <span>Debate Complete!</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Excellent Debate!</h3>
                <p className="text-gray-600">You've completed your debate on "{selectedTopic?.motion}"</p>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">{debateScore}</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {debateMessages.filter((msg) => msg.speaker === "user").length}
                  </div>
                  <div className="text-sm text-gray-600">Arguments Made</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-600">{currentRound}</div>
                  <div className="text-sm text-gray-600">Rounds Completed</div>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-600">
                    {formatTime(selectedTopic!.timeLimit - timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-600">Time Used</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => setDebatePhase("setup")} variant="outline" className="flex-1 bg-transparent">
                  Try Another Topic
                </Button>
                <Button onClick={resetDebate} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Retry This Debate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
