"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Star } from "lucide-react"
import { AIFeedback } from "./ai-feedback"

interface Lesson {
  id: string
  title: string
  type: "video" | "interactive" | "quiz" | "simulation"
  duration: number
  completed: boolean
}

interface InteractiveLessonProps {
  lesson: Lesson
  onComplete: () => void
  onBack: () => void
}

export function InteractiveLesson({ lesson, onComplete, onBack }: InteractiveLessonProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)

  // Sample lesson content based on type
  const getLessonContent = () => {
    if (lesson.id === "fallacy-identification") {
      return {
        title: "Logical Fallacy Identification",
        steps: [
          {
            type: "instruction",
            content:
              "In this exercise, you'll learn to identify common logical fallacies in arguments. This is crucial for both building strong arguments and effectively rebutting weak ones.",
            question: null,
          },
          {
            type: "example",
            content:
              "Let's start with an example:\n\n\"Everyone I know loves pizza, so pizza must be the best food in the world.\"\n\nThis is an example of 'Hasty Generalization' - drawing a broad conclusion from a small sample size.",
            question: null,
          },
          {
            type: "practice",
            content:
              "Now it's your turn! Identify the logical fallacy in this argument:\n\n\"If we allow students to retake exams, next they'll want to retake entire courses, and eventually the whole education system will collapse.\"",
            question: "What logical fallacy is present in this argument?",
            options: ["Slippery Slope", "Ad Hominem", "False Dilemma", "Straw Man"],
            correct: "Slippery Slope",
          },
          {
            type: "practice",
            content:
              "Great! Let's try another one:\n\n\"You can't trust John's argument about climate change because he drives an SUV.\"",
            question: "What logical fallacy is this?",
            options: ["Ad Hominem", "Appeal to Authority", "Red Herring", "Circular Reasoning"],
            correct: "Ad Hominem",
          },
        ],
      }
    }

    if (lesson.id === "argument-structure") {
      return {
        title: "Building Arguments with PEEL Structure",
        steps: [
          {
            type: "instruction",
            content:
              "The PEEL structure helps you build strong, logical arguments:\n\n• Point: State your main argument\n• Evidence: Provide supporting facts or examples\n• Explanation: Explain how the evidence supports your point\n• Link: Connect back to the overall debate topic",
            question: null,
          },
          {
            type: "practice",
            content:
              "Let's practice! The motion is: 'Schools should ban smartphones during class hours.'\n\nYou're arguing FOR the motion. Write a PEEL argument:",
            question: "Write your argument using the PEEL structure:",
            isTextarea: true,
          },
        ],
      }
    }

    // Default content
    return {
      title: lesson.title,
      steps: [
        {
          type: "instruction",
          content:
            "This is a sample interactive lesson. In a real implementation, this would contain specific content for each lesson type.",
          question: null,
        },
      ],
    }
  }

  const lessonContent = getLessonContent()
  const currentStepData = lessonContent.steps[currentStep]
  const progress = ((currentStep + 1) / lessonContent.steps.length) * 100

  const handleAnswer = (answer: string) => {
    setUserAnswer(answer)
    setShowFeedback(true)

    if (currentStepData.correct && answer === currentStepData.correct) {
      setScore(score + 10)
    }
  }

  const handleNext = () => {
    if (currentStep < lessonContent.steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setUserAnswer("")
      setShowFeedback(false)
    } else {
      onComplete()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{lessonContent.title}</h2>
            <p className="text-gray-600">
              Step {currentStep + 1} of {lessonContent.steps.length}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{score} XP</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {currentStepData.type === "instruction" && <Lightbulb className="w-5 h-5 text-blue-600" />}
            {currentStepData.type === "example" && <CheckCircle className="w-5 h-5 text-green-600" />}
            {currentStepData.type === "practice" && <AlertCircle className="w-5 h-5 text-orange-600" />}
            <span>
              {currentStepData.type === "instruction" && "Learn"}
              {currentStepData.type === "example" && "Example"}
              {currentStepData.type === "practice" && "Practice"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{currentStepData.content}</p>
          </div>

          {currentStepData.question && (
            <div className="space-y-4">
              <h3 className="font-medium">{currentStepData.question}</h3>

              {currentStepData.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStepData.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={userAnswer === option ? "default" : "outline"}
                      className="justify-start h-auto p-4"
                      onClick={() => handleAnswer(option)}
                      disabled={showFeedback}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : currentStepData.isTextarea ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your PEEL argument here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    rows={8}
                  />
                  <Button onClick={() => handleAnswer(userAnswer)} disabled={!userAnswer.trim()}>
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                  <Button onClick={() => handleAnswer(userAnswer)} disabled={!userAnswer.trim()}>
                    Submit Answer
                  </Button>
                </div>
              )}
            </div>
          )}

          {showFeedback && (
            <AIFeedback
              userAnswer={userAnswer}
              correctAnswer={currentStepData.correct}
              lessonType={lesson.type}
              questionType={currentStepData.type}
            />
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={currentStepData.question && !showFeedback}>
              {currentStep === lessonContent.steps.length - 1 ? "Complete Lesson" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
