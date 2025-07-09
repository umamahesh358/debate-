"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Zap, BookOpen, Globe, Mic } from "lucide-react"

interface Topic {
  id: string
  motion: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  description: string
  context: string
  keyArguments: {
    government: string[]
    opposition: string[]
  }
}

interface TopicGeneratorProps {
  onTopicSelected: (topic: Topic) => void
}

export function TopicGenerator({ onTopicSelected }: TopicGeneratorProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)

  const sampleTopics: Topic[] = [
    {
      id: "homework-ban",
      motion: "This House would ban homework in primary schools",
      category: "Education",
      difficulty: "Beginner",
      description: "Debate whether homework should be eliminated for young students",
      context:
        "Many educators argue about the effectiveness and necessity of homework for primary school students, considering factors like stress, family time, and learning outcomes.",
      keyArguments: {
        government: [
          "Homework causes unnecessary stress for young children",
          "Family time is more valuable than additional study time",
          "Children learn better through play and exploration",
          "Homework creates inequality between families with different resources",
        ],
        opposition: [
          "Homework reinforces classroom learning and builds discipline",
          "Parents can engage with their child's education through homework",
          "Practice at home helps identify learning gaps early",
          "Homework prepares students for future academic responsibilities",
        ],
      },
    },
    {
      id: "social-media-age",
      motion: "This House would ban social media for users under 16",
      category: "Technology",
      difficulty: "Intermediate",
      description: "Examine the impact of social media on young people's development",
      context:
        "Growing concerns about mental health, cyberbullying, and developmental impacts of social media on teenagers have sparked debates about age restrictions.",
      keyArguments: {
        government: [
          "Social media negatively impacts mental health and self-esteem",
          "Young people are vulnerable to cyberbullying and online predators",
          "Social media addiction interferes with real-world social development",
          "Age verification can protect children from inappropriate content",
        ],
        opposition: [
          "Social media provides valuable educational and creative opportunities",
          "Digital literacy is essential for modern life and careers",
          "Banning creates a digital divide and limits access to information",
          "Education and parental guidance are better than prohibition",
        ],
      },
    },
    {
      id: "ai-teachers",
      motion: "This House believes AI should replace human teachers",
      category: "Technology & Education",
      difficulty: "Advanced",
      description: "Explore the future of education with artificial intelligence",
      context:
        "As AI technology advances, questions arise about its role in education and whether it could eventually replace human educators entirely.",
      keyArguments: {
        government: [
          "AI provides personalized learning adapted to each student's needs",
          "AI teachers are available 24/7 and never get tired or frustrated",
          "AI can access vast amounts of information instantly",
          "AI eliminates human bias and provides consistent quality education",
        ],
        opposition: [
          "Human teachers provide emotional support and mentorship",
          "Education requires human creativity and adaptability",
          "Teachers inspire and motivate students in ways AI cannot",
          "Human judgment is essential for complex educational decisions",
        ],
      },
    },
  ]

  const generateTopics = async () => {
    setLoading(true)
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, this would call an AI service
    const shuffled = [...sampleTopics].sort(() => Math.random() - 0.5)
    setTopics(shuffled.slice(0, 3))
    setLoading(false)
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

  const getCategoryIcon = (category: string) => {
    if (category.includes("Education")) return <BookOpen className="w-4 h-4" />
    if (category.includes("Technology")) return <Zap className="w-4 h-4" />
    return <Globe className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Debate Topic</CardTitle>
          <CardDescription>Select a motion to begin your voice-powered debate practice session</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={generateTopics}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Topics...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Random Topics
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Topics Grid */}
      {topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-300"
              onClick={() => onTopicSelected(topic)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-blue-600">
                    {getCategoryIcon(topic.category)}
                    <span className="text-sm font-medium">{topic.category}</span>
                  </div>
                  <Badge className={getDifficultyColor(topic.difficulty)}>{topic.difficulty}</Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{topic.motion}</CardTitle>
                <CardDescription className="text-sm">{topic.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 leading-relaxed">{topic.context}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <p className="font-medium text-green-700">Government Args:</p>
                      <ul className="text-green-600 space-y-0.5">
                        {topic.keyArguments.government.slice(0, 2).map((arg, idx) => (
                          <li key={idx} className="truncate">
                            • {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-red-700">Opposition Args:</p>
                      <ul className="text-red-600 space-y-0.5">
                        {topic.keyArguments.opposition.slice(0, 2).map((arg, idx) => (
                          <li key={idx} className="truncate">
                            • {arg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button className="w-full mt-3" size="sm">
                    Select This Topic
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Mic className="w-5 h-5 text-blue-600" />
            <span>How Voice Debate Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🎤 Real-Time Analysis</h4>
              <p className="text-blue-700">
                Speak naturally and get instant feedback on your arguments, structure, and relevance to the topic.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🧠 AI Coaching</h4>
              <p className="text-blue-700">
                Our AI detects logical fallacies, off-topic arguments, and missing elements in real-time.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">📱 Mobile Optimized</h4>
              <p className="text-blue-700">
                Designed for mobile devices with touch-friendly controls and responsive design.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🎯 Instant Feedback</h4>
              <p className="text-blue-700">
                Get immediate suggestions on how to improve your arguments and stay on track.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
