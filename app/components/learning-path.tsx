"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Lock, Play, BookOpen, Brain, Target } from "lucide-react"
import { InteractiveLesson } from "./interactive-lesson"

interface Module {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  progress: number
  completed: boolean
  locked: boolean
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: "video" | "interactive" | "quiz" | "simulation"
  duration: number
  completed: boolean
}

export function LearningPath() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  const modules: Module[] = [
    {
      id: "basics",
      title: "Debate Fundamentals",
      description: "Learn the core concepts and structure of formal debating",
      difficulty: "Beginner",
      progress: 100,
      completed: true,
      locked: false,
      lessons: [
        { id: "intro", title: "What is Debate?", type: "video", duration: 10, completed: true },
        { id: "formats", title: "Debate Formats Overview", type: "interactive", duration: 15, completed: true },
        { id: "roles", title: "Speaker Roles & Responsibilities", type: "quiz", duration: 12, completed: true },
      ],
    },
    {
      id: "argumentation",
      title: "Building Strong Arguments",
      description: "Master the art of constructing compelling and logical arguments",
      difficulty: "Beginner",
      progress: 75,
      completed: false,
      locked: false,
      lessons: [
        { id: "structure", title: "Argument Structure (PEEL)", type: "interactive", duration: 20, completed: true },
        { id: "evidence", title: "Using Evidence Effectively", type: "video", duration: 18, completed: true },
        { id: "practice", title: "Argument Building Practice", type: "simulation", duration: 25, completed: false },
      ],
    },
    {
      id: "rebuttals",
      title: "Rebuttal Techniques",
      description: "Learn to effectively counter opposing arguments",
      difficulty: "Intermediate",
      progress: 30,
      completed: false,
      locked: false,
      lessons: [
        { id: "types", title: "Types of Rebuttals", type: "video", duration: 15, completed: true },
        { id: "timing", title: "Strategic Timing", type: "interactive", duration: 20, completed: false },
        { id: "practice", title: "Rebuttal Practice", type: "simulation", duration: 30, completed: false },
      ],
    },
    {
      id: "fallacies",
      title: "Logical Fallacies",
      description: "Identify and avoid common logical errors in arguments",
      difficulty: "Intermediate",
      progress: 0,
      completed: false,
      locked: false,
      lessons: [
        { id: "common", title: "Common Fallacies", type: "interactive", duration: 25, completed: false },
        { id: "identification", title: "Fallacy Identification Game", type: "quiz", duration: 20, completed: false },
        { id: "avoiding", title: "Avoiding Fallacies", type: "simulation", duration: 30, completed: false },
      ],
    },
    {
      id: "advanced",
      title: "Advanced Techniques",
      description: "Master advanced debating strategies and techniques",
      difficulty: "Advanced",
      progress: 0,
      completed: false,
      locked: true,
      lessons: [
        { id: "framing", title: "Strategic Framing", type: "video", duration: 22, completed: false },
        { id: "weighing", title: "Weighing Arguments", type: "interactive", duration: 28, completed: false },
        { id: "closing", title: "Powerful Closing Statements", type: "simulation", duration: 35, completed: false },
      ],
    },
  ]

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

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />
      case "interactive":
        return <Brain className="w-4 h-4" />
      case "quiz":
        return <Target className="w-4 h-4" />
      case "simulation":
        return <BookOpen className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  if (activeLesson) {
    return (
      <InteractiveLesson
        lesson={activeLesson}
        onComplete={() => setActiveLesson(null)}
        onBack={() => setActiveLesson(null)}
      />
    )
  }

  if (selectedModule) {
    const module = modules.find((m) => m.id === selectedModule)
    if (!module) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
            <p className="text-gray-600">{module.description}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedModule(null)}>
            Back to Modules
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Module Progress</CardTitle>
                <CardDescription>{module.progress}% Complete</CardDescription>
              </div>
              <Badge className={getDifficultyColor(module.difficulty)}>{module.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={module.progress} className="mb-4" />
            <div className="space-y-4">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${lesson.completed ? "bg-green-100" : "bg-gray-100"}`}>
                      {lesson.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        getLessonIcon(lesson.type)
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-gray-500">{lesson.duration} minutes</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setActiveLesson(lesson)} disabled={lesson.completed}>
                    {lesson.completed ? "Completed" : "Start"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Learning Path</h2>
        <p className="text-gray-600">Master debate skills through our structured learning modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card
            key={module.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${module.locked ? "opacity-50" : ""}`}
            onClick={() => !module.locked && setSelectedModule(module.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {module.locked ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : module.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  )}
                  <span>{module.title}</span>
                </CardTitle>
                <Badge className={getDifficultyColor(module.difficulty)}>{module.difficulty}</Badge>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{module.progress}%</span>
                </div>
                <Progress value={module.progress} />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{module.lessons.length} lessons</span>
                  <span>{module.lessons.reduce((acc, lesson) => acc + lesson.duration, 0)} min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
