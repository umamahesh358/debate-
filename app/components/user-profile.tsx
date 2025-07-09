"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, TrendingUp, Calendar, Award } from "lucide-react"

interface UserStats {
  level: number
  xp: number
  xpToNext: number
  totalDebates: number
  winRate: number
  badges: string[]
  currentStreak: number
}

interface UserProfileProps {
  userStats: UserStats
}

export function UserProfile({ userStats }: UserProfileProps) {
  const skillAreas = [
    { name: "Argumentation", level: 75, color: "bg-blue-500" },
    { name: "Rebuttal", level: 60, color: "bg-green-500" },
    { name: "Logic & Reasoning", level: 85, color: "bg-purple-500" },
    { name: "Evidence Usage", level: 45, color: "bg-orange-500" },
    { name: "Presentation", level: 70, color: "bg-pink-500" },
  ]

  const recentActivity = [
    { date: "2024-01-15", activity: 'Completed "Logical Fallacies" lesson', xp: 25 },
    { date: "2024-01-14", activity: "Won practice debate on school uniforms", xp: 50 },
    { date: "2024-01-13", activity: 'Completed "Argument Structure" module', xp: 75 },
    { date: "2024-01-12", activity: "Identified 5 fallacies correctly", xp: 30 },
    { date: "2024-01-11", activity: 'Started "Rebuttal Techniques" course', xp: 10 },
  ]

  const achievements = [
    { name: "First Steps", description: "Complete your first lesson", icon: "🎯", date: "2024-01-10" },
    { name: "Logic Master", description: "Identify 10 logical fallacies correctly", icon: "🧠", date: "2024-01-12" },
    { name: "Rebuttal Expert", description: "Master rebuttal techniques", icon: "⚔️", date: "2024-01-14" },
    { name: "Streak Champion", description: "Maintain a 7-day learning streak", icon: "🔥", date: null },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
        <p className="text-gray-600">Track your progress and achievements</p>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{userStats.level}</span>
            </div>
            <CardTitle>Level {userStats.level}</CardTitle>
            <CardDescription>Debate Apprentice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {userStats.level + 1}</span>
                <span>
                  {userStats.xp} / {userStats.xp + userStats.xpToNext} XP
                </span>
              </div>
              <Progress value={(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debates</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalDebates}</div>
            <p className="text-xs text-muted-foreground">{userStats.winRate}% win rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">Keep learning daily!</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Development</CardTitle>
          <CardDescription>Your progress across different debate skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillAreas.map((skill, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${skill.color}`} style={{ width: `${skill.level}%` }}></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements</span>
          </CardTitle>
          <CardDescription>Your debate learning milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  achievement.date ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-2xl mb-2">{achievement.icon}</div>
                    <h3 className={`font-medium ${achievement.date ? "text-green-800" : "text-gray-600"}`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${achievement.date ? "text-green-600" : "text-gray-500"}`}>
                      {achievement.description}
                    </p>
                    {achievement.date && (
                      <p className="text-xs text-green-500 mt-1">
                        Earned on {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {achievement.date && <Badge className="bg-green-100 text-green-800">Unlocked</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Your latest learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.activity}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">+{activity.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your learning preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start bg-transparent">
              <Trophy className="w-4 h-4 mr-2" />
              View All Achievements
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Target className="w-4 h-4 mr-2" />
              Set Learning Goals
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              Learning Schedule
            </Button>
            <Button variant="outline" className="justify-start bg-transparent">
              <Star className="w-4 h-4 mr-2" />
              Export Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
