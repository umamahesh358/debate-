"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, Star, Award } from "lucide-react"

interface AIFeedbackProps {
  userAnswer: string
  lessonType: "lesson" | "challenge" | "simulation"
  questionType?: "multiple-choice" | "essay" | "debate" | "analysis"
  topic?: string
  expectedElements?: string[]
}

interface FeedbackAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  detailedAnalysis: {
    structure: number
    evidence: number
    clarity: number
    relevance: number
    logic: number
  }
  suggestions: string[]
  nextSteps: string[]
}

export function AIFeedback({
  userAnswer,
  lessonType,
  questionType = "essay",
  topic = "debate topic",
  expectedElements = [],
}: AIFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    generateFeedback()
  }, [userAnswer, lessonType, questionType])

  const generateFeedback = async () => {
    setIsLoading(true)
    setAnimationComplete(false)

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const analysis = await analyzeuserAnswer(userAnswer, lessonType, questionType, topic)
    setFeedback(analysis)
    setIsLoading(false)

    // Trigger score animation
    setTimeout(() => setAnimationComplete(true), 500)
  }

  const analyzeuserAnswer = async (
    answer: string,
    type: string,
    qType: string,
    topicName: string,
  ): Promise<FeedbackAnalysis> => {
    // Simulate comprehensive AI analysis
    const wordCount = answer.split(" ").filter((word) => word.length > 0).length
    const hasEvidence =
      answer.toLowerCase().includes("study") ||
      answer.toLowerCase().includes("research") ||
      answer.toLowerCase().includes("data") ||
      answer.toLowerCase().includes("evidence")

    const hasStructure =
      answer.includes("first") ||
      answer.includes("second") ||
      answer.includes("finally") ||
      answer.includes("however") ||
      answer.includes("therefore")

    const hasExamples =
      answer.toLowerCase().includes("example") ||
      answer.toLowerCase().includes("instance") ||
      answer.toLowerCase().includes("such as")

    const isRelevant = answer.toLowerCase().includes(topicName.toLowerCase().split(" ")[0]) || answer.length > 50

    // Calculate scores based on analysis
    const structureScore = hasStructure ? Math.min(85 + Math.random() * 15, 100) : 60 + Math.random() * 20
    const evidenceScore = hasEvidence ? Math.min(80 + Math.random() * 20, 100) : 50 + Math.random() * 30
    const clarityScore = wordCount > 100 ? Math.min(75 + Math.random() * 25, 100) : 60 + Math.random() * 25
    const relevanceScore = isRelevant ? Math.min(80 + Math.random() * 20, 100) : 55 + Math.random() * 25
    const logicScore = hasStructure && hasEvidence ? Math.min(85 + Math.random() * 15, 100) : 65 + Math.random() * 20

    const overallScore = Math.round((structureScore + evidenceScore + clarityScore + relevanceScore + logicScore) / 5)

    // Generate contextual feedback
    const strengths = []
    const improvements = []
    const suggestions = []

    if (hasStructure) {
      strengths.push("Clear logical structure with good use of transitional phrases")
    }
    if (hasEvidence) {
      strengths.push("Strong use of evidence and research to support arguments")
    }
    if (hasExamples) {
      strengths.push("Effective use of concrete examples to illustrate points")
    }
    if (wordCount > 150) {
      strengths.push("Comprehensive coverage of the topic with detailed explanations")
    }

    if (!hasStructure) {
      improvements.push("Argument structure could be clearer with better organization")
      suggestions.push("Use signposting phrases like 'Firstly', 'Moreover', 'In conclusion' to guide readers")
    }
    if (!hasEvidence) {
      improvements.push("Arguments would benefit from more supporting evidence")
      suggestions.push("Include statistics, research findings, or expert opinions to strengthen your points")
    }
    if (wordCount < 100) {
      improvements.push("Response could be more detailed and comprehensive")
      suggestions.push("Expand on your main points with more explanation and examples")
    }
    if (!isRelevant) {
      improvements.push("Ensure all points directly relate to the main topic")
      suggestions.push("Always link your arguments back to the central question or motion")
    }

    // Default feedback if everything is good
    if (strengths.length === 0) {
      strengths.push("Good engagement with the topic and clear communication")
    }
    if (improvements.length === 0) {
      improvements.push("Consider exploring counterarguments to strengthen your position")
    }
    if (suggestions.length === 0) {
      suggestions.push("Continue practicing to refine your argumentation skills")
    }

    const nextSteps = [
      "Practice structuring arguments using the PEEL method (Point, Evidence, Explanation, Link)",
      "Research current examples and statistics related to this topic",
      "Try arguing from the opposite perspective to understand counterarguments",
      "Focus on making clear connections between your evidence and conclusions",
    ]

    return {
      overallScore,
      strengths,
      improvements,
      detailedAnalysis: {
        structure: Math.round(structureScore),
        evidence: Math.round(evidenceScore),
        clarity: Math.round(clarityScore),
        relevance: Math.round(relevanceScore),
        logic: Math.round(logicScore),
      },
      suggestions,
      nextSteps: nextSteps.slice(0, 3),
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 70) return "bg-blue-100 text-blue-800 border-blue-200"
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Satisfactory"
    return "Needs Improvement"
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
            <span>AI Analysis in Progress...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                </div>
                <p className="text-sm text-blue-600 mt-1">Analyzing your response...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) return null

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>AI Feedback & Analysis</span>
            </div>
            <Badge className={`${getScoreBadgeColor(feedback.overallScore)} border`}>
              {getPerformanceLevel(feedback.overallScore)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Score Circle */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center relative overflow-hidden">
                <div
                  className={`absolute inset-0 rounded-full border-8 border-transparent ${
                    feedback.overallScore >= 85
                      ? "border-t-green-500 border-r-green-500"
                      : feedback.overallScore >= 70
                        ? "border-t-blue-500 border-r-blue-500"
                        : feedback.overallScore >= 60
                          ? "border-t-yellow-500 border-r-yellow-500"
                          : "border-t-red-500 border-r-red-500"
                  } transition-all duration-1000 ${animationComplete ? "rotate-180" : "rotate-0"}`}
                  style={{
                    transform: animationComplete ? `rotate(${(feedback.overallScore / 100) * 360}deg)` : "rotate(0deg)",
                  }}
                ></div>
                <div className={`text-2xl font-bold ${getScoreColor(feedback.overallScore)} z-10`}>
                  {animationComplete ? feedback.overallScore : 0}
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Key Strengths
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {feedback.strengths.slice(0, 2).map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Areas for Growth
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {feedback.improvements.slice(0, 2).map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="w-full justify-between p-0 h-auto"
          >
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Detailed Analysis</span>
            </CardTitle>
            {showDetailedAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>

        {showDetailedAnalysis && (
          <CardContent className="space-y-6">
            {/* Skill Breakdown */}
            <div>
              <h4 className="font-semibold mb-4">Skill Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(feedback.detailedAnalysis).map(([skill, score]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{skill}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                Specific Suggestions
              </h4>
              <div className="space-y-2">
                {feedback.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2 text-blue-600" />
                Recommended Next Steps
              </h4>
              <div className="space-y-2">
                {feedback.nextSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-blue-800 flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Encouragement Message */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl mb-2">
              {feedback.overallScore >= 85
                ? "🌟"
                : feedback.overallScore >= 70
                  ? "🎯"
                  : feedback.overallScore >= 60
                    ? "📈"
                    : "💪"}
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">
              {feedback.overallScore >= 85
                ? "Outstanding work!"
                : feedback.overallScore >= 70
                  ? "Great progress!"
                  : feedback.overallScore >= 60
                    ? "Good effort!"
                    : "Keep practicing!"}
            </h3>
            <p className="text-sm text-gray-600">
              {feedback.overallScore >= 85
                ? "Your argumentation skills are excellent. You demonstrate clear thinking and strong evidence use."
                : feedback.overallScore >= 70
                  ? "You're developing strong debate skills. Focus on the suggested improvements to reach the next level."
                  : feedback.overallScore >= 60
                    ? "You're on the right track. With practice and attention to feedback, you'll see significant improvement."
                    : "Every expert was once a beginner. Use this feedback to guide your practice and you'll see improvement soon."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
