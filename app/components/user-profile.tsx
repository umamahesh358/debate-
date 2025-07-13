"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Trophy, Target, TrendingUp, Calendar, BookOpen, Clock, Star, BarChart3, Settings } from "lucide-react"

interface UserStats {
  totalXP: number
  currentLevel: number
  nextLevelXP: number
  currentLevelXP: number
  debatesCompleted: number
  lessonsFinished: number
  averageScore: number
  streakDays: number
  totalTimeSpent: number
}

interface SkillProgress {
  skill: string
  level: number
  progress: number
  maxProgress: number
  description: string
}

interface RecentActivity {
  id: string
  type: "lesson" | "debate" | "challenge" | "achievement"
  title: string
  description: string
  timestamp: string
  xpGained?: number
}

export function UserProfile() {
  const [activeTab, setActiveTab] = useState("overview")

  const userStats: UserStats = {
    totalXP: 2450,
    currentLevel: 12,
    nextLevelXP: 2800,
    currentLevelXP: 2200,
    debatesCompleted: 47,
    lessonsFinished: 23,
    averageScore: 78,
    streakDays: 12,
    totalTimeSpent: 1440, // minutes
  }

  const skillProgress: SkillProgress[] = [
    {
      skill: "Argument Construction",
      level: 8,
      progress: 340,
      maxProgress: 400,
      description: "Building compelling, evidence-based arguments",
    },
    {
      skill: "Rebuttal Techniques",
      level: 6,
      progress: 180,
      maxProgress: 300,
      description: "Countering and dismantling opposing arguments",
    },
    {
      skill: "Logical Reasoning",
      level: 7,
      progress: 220,
      maxProgress: 350,
      description: "Identifying fallacies and logical errors",
    },
    {
      skill: "Public Speaking",
      level: 5,
      progress: 120,
      maxProgress: 250,
      description: "Delivery, pace, and presentation skills",
    },
    {
      skill: "Research & Evidence",
      level: 9,
      progress: 380,
      maxProgress: 450,
      description: "Finding and evaluating credible sources",
    },
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "achievement",
      title: "Fallacy Detective",
      description: "Identified 25 logical fallacies",
      timestamp: "2 hours ago",
      xpGained: 100,
    },
    {
      id: "2",
      type: "debate",
      title: "Climate Change Policy Debate",
      description: "Scored 85% in Parliamentary format",
      timestamp: "1 day ago",
      xpGained: 75,
    },
    {
      id: "3",
      type: "lesson",
      title: "Advanced Rebuttal Techniques",
      description: "Completed with 92% score",
      timestamp: "2 days ago",
      xpGained: 50,
    },
    {
      id: "4",
      type: "challenge",
      title: "Daily Argument Builder",
      description: "Built PEEL argument in under 5 minutes",
      timestamp: "3 days ago",
      xpGained: 25,
    },
  ]

  const achievements = [
    { id: "1", title: "First Steps", description: "Complete first lesson", unlocked: true, rare: false },
    { id: "2", title: "Argument Master", description: "Build 50 strong arguments", unlocked: true, rare: false },
    { id: "3", title: "Debate Champion", description: "Win 10 debates in a row", unlocked: false, rare: true },
    { id: "4", title: "Logic Lord", description: "Identify 100 fallacies", unlocked: false, rare: true },
    { id: "5", title: "Speed Demon", description: "Complete 20 timed challenges", unlocked: true, rare: false },
    { id: "6", title: "Consistency King", description: "30-day learning streak", unlocked: false, rare: true },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="w-4 h-4 text-blue-600" />
      case "debate":
        return <Target className="w-4 h-4 text-green-600" />
      case "challenge":
        return <Clock className="w-4 h-4 text-orange-600" />
      case "achievement":
        return <Trophy className="w-4 h-4 text-yellow-600" />
      default:
        return <Star className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const levelProgress =
    ((userStats.totalXP - userStats.currentLevelXP) / (userStats.nextLevelXP - userStats.currentLevelXP)) * 100

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alex Johnson</h1>
                <p className="text-gray-600">Debate Enthusiast • Level {userStats.currentLevel}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">{userStats.totalXP.toLocaleString()} XP</Badge>
                  <Badge className="bg-green-100 text-green-800">{userStats.streakDays} day streak</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {userStats.currentLevel} Progress</span>
              <span>
                {userStats.totalXP - userStats.currentLevelXP} / {userStats.nextLevelXP - userStats.currentLevelXP} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            <p className="text-xs text-gray-600">
              {userStats.nextLevelXP - userStats.totalXP} XP needed for Level {userStats.currentLevel + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{userStats.debatesCompleted}</div>
            <div className="text-sm text-gray-600">Debates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{userStats.lessonsFinished}</div>
            <div className="text-sm text-gray-600">Lessons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{userStats.averageScore}%</div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{formatTime(userStats.totalTimeSpent)}</div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Week</span>
                    <span className="font-bold text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <span className="font-bold text-blue-600">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">All Time Best</span>
                    <span className="font-bold text-purple-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>Current Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Complete 5 lessons this week</span>
                      <span>3/5</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win 3 debates</span>
                      <span>1/3</span>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Maintain 14-day streak</span>
                      <span>12/14</span>
                    </div>
                    <Progress value={86} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillProgress.map((skill, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{skill.skill}</CardTitle>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Level {skill.level}</Badge>
                      <span className="text-sm text-gray-600">
                        {skill.progress}/{skill.maxProgress} XP
                      </span>
                    </div>
                    <Progress value={(skill.progress / skill.maxProgress) * 100} className="h-3" />
                    <p className="text-xs text-gray-600">
                      {skill.maxProgress - skill.progress} XP to Level {skill.level + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`${achievement.unlocked ? "bg-yellow-50 border-yellow-200" : "opacity-60"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? "bg-yellow-500" : "bg-gray-300"
                      }`}
                    >
                      <Trophy className={`w-6 h-6 ${achievement.unlocked ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        {achievement.rare && <Badge className="bg-purple-100 text-purple-800 text-xs">Rare</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      {achievement.unlocked && <p className="text-xs text-green-600 mt-1">✓ Unlocked</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                    {activity.xpGained && <Badge className="bg-blue-100 text-blue-800">+{activity.xpGained} XP</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
