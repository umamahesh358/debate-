"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  Users,
  BarChart3,
  FileText,
  Eye,
  Download,
  Calendar,
  Mic,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  xp: number
  level: number
  badges: string[]
  lastActive: string
  currentStatus: "offline" | "practicing" | "in-debate"
  recentScores: {
    matter: number
    manner: number
    method: number
    date: string
  }[]
}

interface ClassData {
  id: number
  name: string
  students: Student[]
  assignments: Assignment[]
}

interface Assignment {
  id: number
  title: string
  motion: string
  dueDate: string
  completedBy: number[]
  totalStudents: number
}

export function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [newAssignment, setNewAssignment] = useState({ title: "", motion: "", dueDate: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockClasses: ClassData[] = [
      {
        id: 1,
        name: "Advanced Debate Club",
        students: [
          {
            id: 1,
            name: "Alice Johnson",
            email: "alice@school.edu",
            xp: 2450,
            level: 5,
            badges: ["Logic Master", "Rebuttal Expert", "Tournament Victor"],
            lastActive: "2024-01-15T10:30:00Z",
            currentStatus: "practicing",
            recentScores: [
              { matter: 85, manner: 78, method: 82, date: "2024-01-14" },
              { matter: 88, manner: 80, method: 85, date: "2024-01-13" },
            ],
          },
          {
            id: 2,
            name: "Bob Smith",
            email: "bob@school.edu",
            xp: 1890,
            level: 4,
            badges: ["First Steps", "Feedback Master"],
            lastActive: "2024-01-15T09:15:00Z",
            currentStatus: "in-debate",
            recentScores: [
              { matter: 75, manner: 82, method: 78, date: "2024-01-14" },
              { matter: 78, manner: 79, method: 80, date: "2024-01-12" },
            ],
          },
          {
            id: 3,
            name: "Carol Davis",
            email: "carol@school.edu",
            xp: 1200,
            level: 3,
            badges: ["First Steps"],
            lastActive: "2024-01-14T16:45:00Z",
            currentStatus: "offline",
            recentScores: [
              { matter: 70, manner: 75, method: 72, date: "2024-01-13" },
              { matter: 68, manner: 73, method: 70, date: "2024-01-11" },
            ],
          },
        ],
        assignments: [
          {
            id: 1,
            title: "Homework Policy Debate",
            motion: "This House would ban homework in primary schools",
            dueDate: "2024-01-20",
            completedBy: [1, 2],
            totalStudents: 3,
          },
          {
            id: 2,
            title: "Technology in Education",
            motion: "This House believes AI should replace human teachers",
            dueDate: "2024-01-25",
            completedBy: [],
            totalStudents: 3,
          },
        ],
      },
      {
        id: 2,
        name: "Beginner Debate Class",
        students: [
          {
            id: 4,
            name: "David Wilson",
            email: "david@school.edu",
            xp: 650,
            level: 2,
            badges: ["First Steps"],
            lastActive: "2024-01-15T11:00:00Z",
            currentStatus: "practicing",
            recentScores: [{ matter: 65, manner: 70, method: 68, date: "2024-01-14" }],
          },
          {
            id: 5,
            name: "Eva Brown",
            email: "eva@school.edu",
            xp: 420,
            level: 1,
            badges: [],
            lastActive: "2024-01-14T14:20:00Z",
            currentStatus: "offline",
            recentScores: [{ matter: 60, manner: 65, method: 62, date: "2024-01-13" }],
          },
        ],
        assignments: [
          {
            id: 3,
            title: "Introduction to Argumentation",
            motion: "This House supports school uniforms",
            dueDate: "2024-01-22",
            completedBy: [4],
            totalStudents: 2,
          },
        ],
      },
    ]

    setClasses(mockClasses)
    setSelectedClass(mockClasses[0])
    setLoading(false)
  }

  const createAssignment = async () => {
    if (!newAssignment.title || !newAssignment.motion || !selectedClass) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const assignment: Assignment = {
      id: Date.now(),
      title: newAssignment.title,
      motion: newAssignment.motion,
      dueDate: newAssignment.dueDate,
      completedBy: [],
      totalStudents: selectedClass.students.length,
    }

    setClasses(
      classes.map((c) => (c.id === selectedClass.id ? { ...c, assignments: [...c.assignments, assignment] } : c)),
    )

    setNewAssignment({ title: "", motion: "", dueDate: "" })
    setLoading(false)
  }

  const downloadReport = async (classId: number) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate CSV generation
    const csvContent = `Student Name,XP,Level,Recent Matter Score,Recent Manner Score,Recent Method Score,Last Active
${selectedClass?.students
  .map(
    (s) =>
      `${s.name},${s.xp},${s.level},${s.recentScores[0]?.matter || 0},${s.recentScores[0]?.manner || 0},${s.recentScores[0]?.method || 0},${s.lastActive}`,
  )
  .join("\n")}`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedClass?.name}_report.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "practicing":
        return "bg-blue-100 text-blue-800"
      case "in-debate":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "practicing":
        return <Mic className="w-3 h-3" />
      case "in-debate":
        return <Target className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <span>Teacher Dashboard</span>
          </CardTitle>
          <p className="text-gray-600">Monitor student progress, assign debates, and track class performance</p>
        </CardHeader>
      </Card>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((classData) => (
              <Card
                key={classData.id}
                className={`cursor-pointer transition-all ${
                  selectedClass?.id === classData.id ? "border-blue-500 bg-blue-50" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedClass(classData)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium">{classData.name}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{classData.students.length} students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{classData.assignments.length} assignments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="roster">Student Roster</TabsTrigger>
            <TabsTrigger value="live">Live Monitor</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedClass.name} - Student Roster</span>
                  <Badge variant="outline">{selectedClass.students.length} students</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedClass.students.map((student) => (
                    <Card key={student.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h3 className="font-medium">{student.name}</h3>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                              <Badge className={getStatusColor(student.currentStatus)}>
                                {getStatusIcon(student.currentStatus)}
                                <span className="ml-1">{student.currentStatus}</span>
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Level:</span>
                                <span className="ml-1 font-medium">{student.level}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">XP:</span>
                                <span className="ml-1 font-medium">{student.xp}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Badges:</span>
                                <span className="ml-1 font-medium">{student.badges.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Last Active:</span>
                                <span className="ml-1 font-medium">
                                  {new Date(student.lastActive).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {student.recentScores.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 mb-2">Recent Performance:</p>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Matter</span>
                                      <span>{student.recentScores[0].matter}%</span>
                                    </div>
                                    <Progress value={student.recentScores[0].matter} className="h-2" />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Manner</span>
                                      <span>{student.recentScores[0].manner}%</span>
                                    </div>
                                    <Progress value={student.recentScores[0].manner} className="h-2" />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>Method</span>
                                      <span>{student.recentScores[0].method}%</span>
                                    </div>
                                    <Progress value={student.recentScores[0].method} className="h-2" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <span>Live Activity Monitor</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedClass.students
                    .filter((s) => s.currentStatus !== "offline")
                    .map((student) => (
                      <Card key={student.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <div>
                                <h3 className="font-medium">{student.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {student.currentStatus === "practicing"
                                    ? "Practicing voice feedback"
                                    : "In live debate session"}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(student.currentStatus)}>
                              {getStatusIcon(student.currentStatus)}
                              <span className="ml-1">{student.currentStatus}</span>
                            </Badge>
                          </div>

                          {student.currentStatus === "practicing" && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                💬 Latest feedback: "Great argument structure! Try adding more evidence to support your
                                claims."
                              </p>
                              <p className="text-xs text-blue-600 mt-1">Relevance score: 87%</p>
                            </div>
                          )}

                          {student.currentStatus === "in-debate" && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-800">
                                🎯 Currently debating: "This House supports renewable energy subsidies"
                              </p>
                              <p className="text-xs text-green-600 mt-1">Round 2 of 3 • Government side</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                  {selectedClass.students.filter((s) => s.currentStatus !== "offline").length === 0 && (
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-gray-600">No active sessions</p>
                      <p className="text-sm text-gray-500">Students will appear here when they start practicing</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedClass.assignments.map((assignment) => (
                    <Card key={assignment.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{assignment.title}</h3>
                            <Badge variant="outline">
                              {assignment.completedBy.length}/{assignment.totalStudents}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 italic">"{assignment.motion}"</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Progress
                            value={(assignment.completedBy.length / assignment.totalStudents) * 100}
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Create New Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignment Title</label>
                    <Input
                      placeholder="Enter assignment title..."
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Debate Motion</label>
                    <Textarea
                      placeholder="This House believes that..."
                      value={newAssignment.motion}
                      onChange={(e) => setNewAssignment({ ...newAssignment, motion: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={createAssignment}
                    disabled={loading || !newAssignment.title || !newAssignment.motion}
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Create Assignment"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Class Performance Reports</span>
                  <Button onClick={() => downloadReport(selectedClass.id)} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? "Generating..." : "Download CSV"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-800">
                        {Math.round(
                          selectedClass.students.reduce((acc, s) => acc + (s.recentScores[0]?.matter || 0), 0) /
                            selectedClass.students.length,
                        )}
                        %
                      </div>
                      <div className="text-sm text-blue-700">Avg Matter Score</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-800">
                        {Math.round(
                          selectedClass.students.reduce((acc, s) => acc + (s.recentScores[0]?.manner || 0), 0) /
                            selectedClass.students.length,
                        )}
                        %
                      </div>
                      <div className="text-sm text-green-700">Avg Manner Score</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-800">
                        {Math.round(
                          selectedClass.students.reduce((acc, s) => acc + (s.recentScores[0]?.method || 0), 0) /
                            selectedClass.students.length,
                        )}
                        %
                      </div>
                      <div className="text-sm text-purple-700">Avg Method Score</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Individual Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedClass.students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{student.name}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>Level {student.level}</span>
                              <span>{student.xp} XP</span>
                              <span>{student.badges.length} badges</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {student.recentScores.length > 1 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm font-medium">
                              {student.recentScores[0]
                                ? Math.round(
                                    (student.recentScores[0].matter +
                                      student.recentScores[0].manner +
                                      student.recentScores[0].method) /
                                      3,
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
