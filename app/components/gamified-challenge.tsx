"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Timer, Zap, Target, Users, Clock, Trophy } from "lucide-react"
import { AIFeedback } from "./ai-feedback"

interface Challenge {
  id: string
  title: string
  motion: string
  difficulty: "Easy" | "Medium" | "Hard"
  timeLimit: number
  xpReward: number
  description: string
}

export function GameifiedChallenge() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [currentPhase, setCurrentPhase] = useState<"prep" | "opening" | "rebuttal" | "closing" | "results">("prep")
  const [timeLeft, setTimeLeft] = useState(0)
  const [userArgument, setUserArgument] = useState("")
  const [aiArgument, setAiArgument] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)

  const challenges: Challenge[] = [
    {
      id: "school-uniforms",
      title: "School Uniforms Debate",
      motion: "This house believes that school uniforms should be mandatory",
      difficulty: "Easy",
      timeLimit: 300, // 5 minutes
      xpReward: 50,
      description: "A classic debate topic perfect for beginners",
    },
    {
      id: "social-media",
      title: "Social Media Age Limit",
      motion: "This house would ban social media for users under 16",
      difficulty: "Medium",
      timeLimit: 420, // 7 minutes
      xpReward: 75,
      description: "Explore the impact of social media on young people",
    },
    {
      id: "ai-education",
      title: "AI in Education",
      motion: "This house believes AI should replace human teachers in schools",
      difficulty: "Hard",
      timeLimit: 600, // 10 minutes
      xpReward: 100,
      description: "A complex topic requiring nuanced argumentation",
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const startChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setCurrentPhase("prep")
    setTimeLeft(challenge.timeLimit)
    setUserArgument("")
    setAiArgument("")
    setShowFeedback(false)
  }

  const handlePhaseComplete = () => {
    switch (currentPhase) {
      case "prep":
        setCurrentPhase("opening")
        generateAIArgument()
        break
      case "opening":
        setCurrentPhase("rebuttal")
        break
      case "rebuttal":
        setCurrentPhase("closing")
        break
      case "closing":
        setCurrentPhase("results")
        setShowFeedback(true)
        break
    }
  }

  const generateAIArgument = () => {
    // Simulate AI generating an argument
    const sampleArguments = {
      "school-uniforms":
        "School uniforms create equality among students by removing visible economic differences. When everyone wears the same clothing, students can focus on learning rather than fashion competition. Additionally, uniforms reduce morning decision-making time and can improve school safety by making it easier to identify intruders.",
      "social-media":
        "Social media platforms are designed to be addictive and can harm developing minds. Studies show increased rates of anxiety and depression among heavy social media users under 16. By implementing age restrictions, we protect children during crucial developmental years while allowing them to develop real-world social skills.",
      "ai-education":
        "AI teachers can provide personalized learning experiences for every student, adapting to individual learning styles and paces. They're available 24/7, never get tired or frustrated, and can access vast amounts of information instantly. This could solve teacher shortages and provide consistent, high-quality education globally.",
    }

    setAiArgument(
      sampleArguments[selectedChallenge?.id as keyof typeof sampleArguments] || "AI argument would be generated here.",
    )
  }

  const getPhaseTitle = () => {
    switch (currentPhase) {
      case "prep":
        return "Preparation Time"
      case "opening":
        return "Opening Statement"
      case "rebuttal":
        return "Rebuttal Phase"
      case "closing":
        return "Closing Argument"
      case "results":
        return "Results & Feedback"
    }
  }

  const getPhaseDescription = () => {
    switch (currentPhase) {
      case "prep":
        return "Use this time to plan your arguments and structure your case"
      case "opening":
        return "Present your main arguments for your position"
      case "rebuttal":
        return "Counter the AI's arguments and defend your position"
      case "closing":
        return "Summarize your case and make your final appeal"
      case "results":
        return "See how you performed and get detailed feedback"
    }
  }

  if (!selectedChallenge) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Practice Challenges</h2>
          <p className="text-gray-600">Test your skills against our AI debate opponent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm text-gray-800">Motion:</p>
                  <p className="text-sm text-gray-600 italic">"{challenge.motion}"</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(challenge.timeLimit / 60)} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-4 h-4" />
                    <span>{challenge.xpReward} XP</span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => startChallenge(challenge)}>
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>How Practice Challenges Work</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Preparation</h4>
                  <p className="text-sm text-gray-600">Plan your arguments and strategy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Debate Rounds</h4>
                  <p className="text-sm text-gray-600">Exchange arguments with AI opponent</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium">AI Feedback</h4>
                  <p className="text-sm text-gray-600">Get detailed analysis of your performance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Earn Rewards</h4>
                  <p className="text-sm text-gray-600">Gain XP and unlock achievements</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Challenge Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>{selectedChallenge.title}</span>
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="font-medium">Motion:</span> "{selectedChallenge.motion}"
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge className={getDifficultyColor(selectedChallenge.difficulty)}>{selectedChallenge.difficulty}</Badge>
              <p className="text-sm text-gray-600 mt-1">{selectedChallenge.xpReward} XP Reward</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Phase Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{getPhaseTitle()}</CardTitle>
              <CardDescription>{getPhaseDescription()}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-lg">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={((4 - ["prep", "opening", "rebuttal", "closing", "results"].indexOf(currentPhase)) / 4) * 100}
          />
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {currentPhase !== "results" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Side */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Your Argument</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPhase === "prep" ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Use this time to brainstorm your main arguments. Consider:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>What are your strongest points?</li>
                    <li>What evidence supports your position?</li>
                    <li>What counterarguments might you face?</li>
                    <li>How will you structure your opening?</li>
                  </ul>
                  <Textarea
                    placeholder="Jot down your preparation notes..."
                    value={userArgument}
                    onChange={(e) => setUserArgument(e.target.value)}
                    rows={8}
                  />
                </div>
              ) : (
                <Textarea
                  placeholder={`Write your ${currentPhase} here...`}
                  value={userArgument}
                  onChange={(e) => setUserArgument(e.target.value)}
                  rows={10}
                />
              )}

              <Button onClick={handlePhaseComplete} disabled={!userArgument.trim()} className="w-full">
                {currentPhase === "prep" ? "Start Debate" : "Submit & Continue"}
              </Button>
            </CardContent>
          </Card>

          {/* AI Side */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <span>AI Opponent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPhase === "prep" ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>AI is preparing its arguments...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900">{aiArgument}</p>
                  </div>
                  <Badge variant="secondary">AI Response</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Phase */}
      {currentPhase === "results" && showFeedback && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-green-600" />
                <span>Challenge Complete!</span>
              </CardTitle>
              <CardDescription>
                You've earned {selectedChallenge.xpReward} XP for completing this challenge
              </CardDescription>
            </CardHeader>
          </Card>

          <AIFeedback userAnswer={userArgument} lessonType="simulation" questionType="debate" />

          <div className="flex justify-center space-x-4">
            <Button onClick={() => setSelectedChallenge(null)}>Back to Challenges</Button>
            <Button variant="outline" onClick={() => startChallenge(selectedChallenge)}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
