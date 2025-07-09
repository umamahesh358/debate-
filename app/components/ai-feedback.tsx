"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react"

interface AIFeedbackProps {
  userAnswer: string
  correctAnswer?: string
  lessonType: string
  questionType: string
}

export function AIFeedback({ userAnswer, correctAnswer, lessonType, questionType }: AIFeedbackProps) {
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate AI feedback generation
    const generateFeedback = async () => {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      let feedbackData

      if (questionType === "practice" && correctAnswer) {
        const isCorrect = userAnswer === correctAnswer

        if (correctAnswer === "Slippery Slope") {
          feedbackData = {
            isCorrect,
            score: isCorrect ? 10 : 5,
            mainFeedback: isCorrect
              ? "Excellent! You correctly identified the Slippery Slope fallacy."
              : "Not quite. This is actually a Slippery Slope fallacy.",
            explanation:
              "A Slippery Slope fallacy occurs when someone argues that one event will inevitably lead to a chain of negative consequences without providing evidence for this chain reaction. In this case, allowing exam retakes doesn't necessarily lead to educational system collapse.",
            improvements: isCorrect
              ? ["Great logical reasoning!", "You understand cause-and-effect relationships well"]
              : [
                  "Look for arguments that assume extreme consequences",
                  "Consider whether each step in the chain is actually inevitable",
                ],
            strengths: ["Good attention to argument structure"],
            nextSteps: ["Practice identifying other fallacy types", "Learn to explain why fallacies weaken arguments"],
          }
        } else if (correctAnswer === "Ad Hominem") {
          feedbackData = {
            isCorrect,
            score: isCorrect ? 10 : 5,
            mainFeedback: isCorrect
              ? "Perfect! You spotted the Ad Hominem attack."
              : "This is actually an Ad Hominem fallacy.",
            explanation:
              "An Ad Hominem fallacy attacks the person making the argument rather than addressing the argument itself. John's personal choices don't invalidate his climate change argument - the argument should be evaluated on its own merits.",
            improvements: isCorrect
              ? ["Excellent critical thinking!", "You can distinguish between person and argument"]
              : [
                  "Focus on what's being attacked - the person or the argument",
                  "Remember: personal characteristics don't determine argument validity",
                ],
            strengths: ["Good analytical skills"],
            nextSteps: [
              "Learn to construct fallacy-free rebuttals",
              "Practice separating arguments from their sources",
            ],
          }
        }
      } else if (questionType === "practice" && lessonType === "interactive") {
        // For PEEL structure practice
        const hasPEELStructure = analyzeArgumentStructure(userAnswer)
        feedbackData = {
          isCorrect: hasPEELStructure.score > 6,
          score: hasPEELStructure.score * 2,
          mainFeedback:
            hasPEELStructure.score > 6
              ? "Good work! Your argument shows understanding of the PEEL structure."
              : "Your argument needs more structure. Let's work on the PEEL format.",
          explanation:
            "A strong PEEL argument should have: a clear Point, supporting Evidence, Explanation of how evidence supports the point, and a Link back to the main topic.",
          improvements: hasPEELStructure.missing,
          strengths: hasPEELStructure.present,
          nextSteps: [
            "Practice with more complex topics",
            "Work on finding stronger evidence",
            "Improve explanation clarity",
          ],
        }
      }

      setFeedback(feedbackData)
      setLoading(false)
    }

    generateFeedback()
  }, [userAnswer, correctAnswer, lessonType, questionType])

  const analyzeArgumentStructure = (text: string) => {
    const analysis = {
      score: 0,
      present: [] as string[],
      missing: [] as string[],
    }

    // Simple analysis (in real implementation, this would use NLP)
    const hasPoint = text.toLowerCase().includes("should") || text.toLowerCase().includes("because") || text.length > 20
    const hasEvidence =
      text.toLowerCase().includes("study") ||
      text.toLowerCase().includes("research") ||
      text.toLowerCase().includes("example") ||
      text.toLowerCase().includes("data")
    const hasExplanation =
      text.toLowerCase().includes("this shows") ||
      text.toLowerCase().includes("therefore") ||
      text.toLowerCase().includes("this means")
    const hasLink =
      text.toLowerCase().includes("overall") ||
      text.toLowerCase().includes("in conclusion") ||
      text.toLowerCase().includes("this supports")

    if (hasPoint) {
      analysis.score += 3
      analysis.present.push("Clear main point stated")
    } else {
      analysis.missing.push("State your main argument more clearly")
    }

    if (hasEvidence) {
      analysis.score += 2
      analysis.present.push("Evidence provided")
    } else {
      analysis.missing.push("Add supporting evidence or examples")
    }

    if (hasExplanation) {
      analysis.score += 2
      analysis.present.push("Good explanation of reasoning")
    } else {
      analysis.missing.push("Explain how your evidence supports your point")
    }

    if (hasLink) {
      analysis.score += 1
      analysis.present.push("Links back to main topic")
    } else {
      analysis.missing.push("Connect your argument back to the debate motion")
    }

    return analysis
  }

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">AI is analyzing your response...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) return null

  return (
    <Card
      className={`border-2 ${feedback.isCorrect ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {feedback.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-600" />
            )}
            <span className={feedback.isCorrect ? "text-green-800" : "text-orange-800"}>AI Feedback</span>
          </div>
          <Badge variant="secondary">+{feedback.score} XP</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-3 rounded-lg ${feedback.isCorrect ? "bg-green-100" : "bg-orange-100"}`}>
          <p className={`font-medium ${feedback.isCorrect ? "text-green-800" : "text-orange-800"}`}>
            {feedback.mainFeedback}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-800">Explanation</h4>
              <p className="text-sm text-blue-700">{feedback.explanation}</p>
            </div>
          </div>

          {feedback.strengths.length > 0 && (
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-green-800">Strengths</h4>
                <ul className="text-sm text-green-700 list-disc list-inside">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-1" />
              <div>
                <h4 className="font-medium text-orange-800">Areas for Improvement</h4>
                <ul className="text-sm text-orange-700 list-disc list-inside">
                  {feedback.improvements.map((improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-600 mt-1" />
            <div>
              <h4 className="font-medium text-purple-800">Next Steps</h4>
              <ul className="text-sm text-purple-700 list-disc list-inside">
                {feedback.nextSteps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
