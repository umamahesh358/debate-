"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target, BookOpen, Users, Zap, Mic, Swords, GraduationCap, Video } from "lucide-react"
import { LearningPath } from "./components/learning-path"
import { GameifiedChallenge } from "./components/gamified-challenge"
import { UserProfile } from "./components/user-profile"
import { ContinuousVoiceFeedback } from "./components/continuous-voice-feedback"
import { TournamentBracket } from "./components/tournament-bracket"
import { TeacherDashboard } from "./components/teacher-dashboard"
import { VideoAnalysisMode } from "./components/video-analysis-mode"

interface UserStats {
  level: number
  xp: number
  xpToNext: number
  totalDebates: number
  winRate: number
  badges: string[]
  currentStreak: number
  role?: "student" | "teacher"
}

export default function DebatePlatform() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "learn" | "practice" | "profile" | "voice-feedback" | "tournament" | "teacher" | "video-analysis"
  >("dashboard")
  const [userStats, setUserStats] = useState<UserStats>({
    level: 3,
    xp: 1250,
    xpToNext: 500,
    totalDebates: 15,
    winRate: 73,
    badges: ["First Debate", "Logic Master", "Rebuttal Expert"],
    currentStreak: 5,
    role: "student", // Can be "teacher" for teacher dashboard access
  })
  const [isLive, setIsLive] = useState(false)
  const [feedbackEnabled, setFeedbackEnabled] = useState(true)

  const achievements = [
    { name: "First Steps", description: "Complete your first lesson", icon: "🎯", unlocked: true },
    { name: "Logic Master", description: "Identify 10 logical fallacies correctly", icon: "🧠", unlocked: true },
    { name: "Tournament Victor", description: "Win your first tournament", icon: "🏆", unlocked: false },
    { name: "Feedback Master", description: "Successfully apply 50 AI suggestions", icon: "🎯", unlocked: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header with Live Status */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">DebateMaster Pro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">{userStats.xp} XP</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Level {userStats.level}</span>
              </div>
              <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "animate-pulse" : ""}>
                {isLive ? "🔴 LIVE" : "Ready"}
              </Badge>
              {userStats.role === "teacher" && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Teacher
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: Target },
              { id: "learn", label: "Learn", icon: BookOpen },
              { id: "practice", label: "Practice", icon: Zap },
              { id: "voice-feedback", label: "Live Coaching", icon: Mic },
              { id: "tournament", label: "Tournaments", icon: Swords },
              { id: "video-analysis", label: "Video Analysis", icon: Video },
              ...(userStats.role === "teacher" ? [{ id: "teacher", label: "Teacher Hub", icon: GraduationCap }] : []),
              { id: "profile", label: "Profile", icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Enhanced Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.level}</div>
                  <Progress value={(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">{userStats.xpToNext} XP to next level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.winRate}%</div>
                  <p className="text-xs text-muted-foreground">{userStats.totalDebates} debates completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.currentStreak} days</div>
                  <p className="text-xs text-muted-foreground">Keep it up!</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Feedback</CardTitle>
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">Tips applied successfully</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-200"
                onClick={() => setActiveTab("voice-feedback")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="w-5 h-5 text-blue-600" />
                    <span>Live Voice Coaching</span>
                  </CardTitle>
                  <CardDescription>Real-time AI feedback without interrupting your flow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700">Continuous analysis active</span>
                    </div>
                    <Button className="w-full">Start Live Session</Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-200"
                onClick={() => setActiveTab("tournament")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Swords className="w-5 h-5 text-purple-600" />
                    <span>Tournament Mode</span>
                  </CardTitle>
                  <CardDescription>Compete in structured debate tournaments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Next tournament: Tomorrow 3PM</span>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">Join Tournament</Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-200"
                onClick={() => setActiveTab("video-analysis")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="w-5 h-5 text-green-600" />
                    <span>Video Analysis</span>
                  </CardTitle>
                  <CardDescription>AI-powered presentation skills feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700">Gesture & posture analysis</span>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">Enable Camera</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Your debate learning milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? "border-green-200 bg-green-50 hover:bg-green-100"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{achievement.icon}</div>
                      <h3 className={`font-medium ${achievement.unlocked ? "text-green-800" : "text-gray-600"}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${achievement.unlocked ? "text-green-600" : "text-gray-500"}`}>
                        {achievement.description}
                      </p>
                      {achievement.unlocked && <Badge className="mt-2 bg-green-100 text-green-800">Unlocked</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "learn" && <LearningPath />}
        {activeTab === "practice" && <GameifiedChallenge />}
        {activeTab === "profile" && <UserProfile userStats={userStats} />}
        {activeTab === "voice-feedback" && (
          <ContinuousVoiceFeedback
            isLive={isLive}
            onLiveChange={setIsLive}
            feedbackEnabled={feedbackEnabled}
            onFeedbackToggle={setFeedbackEnabled}
          />
        )}
        {activeTab === "tournament" && <TournamentBracket />}
        {activeTab === "teacher" && userStats.role === "teacher" && <TeacherDashboard />}
        {activeTab === "video-analysis" && <VideoAnalysisMode />}
      </main>
    </div>
  )
}
