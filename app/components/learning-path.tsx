"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Target, Shield, Brain, Zap, Play, CheckCircle, Lock, Clock, Users } from "lucide-react"
import { InteractiveLesson } from "./interactive-lesson"

interface LearningModule {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  progress: number
  totalLessons: number
  completedLessons: number
  locked: boolean
  objectives: string[]
  icon: React.ReactNode
  color: string
}

export function LearningPath() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [showModuleDetails, setShowModuleDetails] = useState<string | null>(null)

  const modules: LearningModule[] = [
    {
      id: "fundamentals",
      title: "Debate Fundamentals",
      description: "Master the core principles and structure of formal debate",
      difficulty: "Beginner",
      duration: "2.5 hours",
      progress: 75,
      totalLessons: 8,
      completedLessons: 6,
      locked: false,
      color: "blue",
      icon: <BookOpen className="w-6 h-6" />,
      objectives: [
        "Understand different debate formats (Parliamentary, Oxford Union, Lincoln-Douglas)",
        "Learn speaker roles and time allocations",
        "Master motion analysis and case building basics",
        "Develop effective delivery techniques",
        "Practice opening and closing statements",
      ],
    },
    {
      id: "arguments",
      title: "Building Strong Arguments",
      description: "Learn to construct compelling, evidence-based arguments using proven frameworks",
      difficulty: "Beginner",
      duration: "3 hours",
      progress: 60,
      totalLessons: 10,
      completedLessons: 6,
      locked: false,
      color: "green",
      icon: <Target className="w-6 h-6" />,
      objectives: [
        "Master the PEEL argument structure (Point, Evidence, Explanation, Link)",
        "Learn to evaluate and use different types of evidence",
        "Understand argument hierarchy and prioritization",
        "Practice impact analysis and weighing mechanisms",
        "Develop comparative advantage arguments",
      ],
    },
    {
      id: "rebuttals",
      title: "Rebuttal Techniques",
      description: "Master the art of responding to and dismantling opposing arguments",
      difficulty: "Intermediate",
      duration: "2.5 hours",
      progress: 40,
      totalLessons: 8,
      completedLessons: 3,
      locked: false,
      color: "orange",
      icon: <Shield className="w-6 h-6" />,
      objectives: [
        "Learn the DARE rebuttal method (Dismiss, Accept, Reverse, Extend)",
        "Master techniques for attacking evidence quality",
        "Practice turning opponent arguments to your advantage",
        "Develop defensive strategies for protecting your case",
        "Learn strategic concession and damage limitation",
      ],
    },
    {
      id: "fallacies",
      title: "Logical Fallacies",
      description: "Identify, avoid, and exploit logical errors in reasoning",
      difficulty: "Intermediate",
      duration: "2 hours",
      progress: 20,
      totalLessons: 12,
      completedLessons: 2,
      locked: false,
      color: "purple",
      icon: <Brain className="w-6 h-6" />,
      objectives: [
        "Identify 15+ common logical fallacies",
        "Learn to spot fallacies in real-time during debates",
        "Master techniques for calling out opponent fallacies",
        "Understand how to avoid fallacies in your own arguments",
        "Practice fallacy identification through interactive exercises",
      ],
    },
    {
      id: "advanced",
      title: "Advanced Techniques",
      description: "Master sophisticated debate strategies and psychological tactics",
      difficulty: "Advanced",
      duration: "4 hours",
      progress: 0,
      totalLessons: 15,
      completedLessons: 0,
      locked: true,
      color: "red",
      icon: <Zap className="w-6 h-6" />,
      objectives: [
        "Learn strategic framing and narrative control",
        "Master cross-examination techniques",
        "Understand audience psychology and persuasion",
        "Practice advanced rhetorical devices",
        "Develop tournament-level closing arguments",
      ],
    },
  ]

  const getColorClasses = (color: string, variant: "bg" | "text" | "border") => {
    const colorMap = {
      blue: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      green: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
      purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
      red: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
    }
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant]
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

  const handleStartModule = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId)
    if (module && !module.locked) {
      setSelectedModule(moduleId)
    }
  }

  const handleShowDetails = (moduleId: string) => {
    setShowModuleDetails(showModuleDetails === moduleId ? null : moduleId)
  }

  if (selectedModule) {
    return (
      <InteractiveLesson
        moduleId={selectedModule}
        onBack={() => setSelectedModule(null)}
        onComplete={() => {
          setSelectedModule(null)
          // Update progress here
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Master Debate Skills</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Learn through interactive lessons, practice with AI opponents, and master the art of persuasive argumentation
        </p>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-900">
                  {modules.reduce((acc, m) => acc + m.completedLessons, 0)}
                </h3>
                <p className="text-blue-700">Lessons Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900">
                  {Math.round(modules.reduce((acc, m) => acc + m.progress, 0) / modules.length)}%
                </h3>
                <p className="text-green-700">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-purple-900">{modules.filter((m) => !m.locked).length}</h3>
                <p className="text-purple-700">Modules Unlocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Modules */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Learning Modules</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <Card
              key={module.id}
              className={`transition-all duration-300 hover:shadow-lg ${
                module.locked ? "opacity-60" : "hover:scale-[1.02]"
              } ${showModuleDetails === module.id ? "ring-2 ring-blue-500" : ""}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        module.locked ? "bg-gray-100" : getColorClasses(module.color, "bg")
                      }`}
                    >
                      {module.locked ? (
                        <Lock className="w-6 h-6 text-gray-400" />
                      ) : (
                        <div className={module.locked ? "text-gray-400" : `text-${module.color}-600`}>
                          {module.icon}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">Module {index + 1}</span>
                        <Badge className={getDifficultyColor(module.difficulty)}>{module.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                    </div>
                  </div>
                  {module.progress > 0 && !module.locked && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{module.progress}%</div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  )}
                </div>
                <CardDescription className="text-base">{module.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                {module.progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {module.completedLessons}/{module.totalLessons} lessons
                      </span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                )}

                {/* Module Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{module.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{module.totalLessons} lessons</span>
                  </div>
                </div>

                {/* Learning Objectives Preview */}
                {showModuleDetails === module.id && (
                  <div
                    className={`p-4 rounded-lg ${getColorClasses(module.color, "bg")} ${getColorClasses(module.color, "border")} border`}
                  >
                    <h4 className={`font-semibold mb-3 ${getColorClasses(module.color, "text")}`}>
                      Learning Objectives
                    </h4>
                    <ul className="space-y-2">
                      {module.objectives.map((objective, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start space-x-2 text-sm ${getColorClasses(module.color, "text")}`}
                        >
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleStartModule(module.id)}
                    disabled={module.locked}
                    className="flex-1"
                    variant={module.progress > 0 ? "outline" : "default"}
                  >
                    {module.locked ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </>
                    ) : module.progress > 0 ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Module
                      </>
                    )}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => handleShowDetails(module.id)} className="px-3">
                    {showModuleDetails === module.id ? "Hide" : "Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Learning Path Guide */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Your Learning Journey</span>
          </CardTitle>
          <CardDescription>Follow our structured path to become a master debater</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Learn Fundamentals</h3>
              <p className="text-sm text-gray-600">Master basic debate structure and principles</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Build Arguments</h3>
              <p className="text-sm text-gray-600">Construct compelling, evidence-based cases</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Master Rebuttals</h3>
              <p className="text-sm text-gray-600">Learn to counter opposing arguments effectively</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Advanced Tactics</h3>
              <p className="text-sm text-gray-600">Develop sophisticated debate strategies</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
