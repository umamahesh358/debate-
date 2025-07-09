"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Calendar, Swords, Crown, Clock, Target } from "lucide-react"

interface Tournament {
  id: number
  name: string
  status: "upcoming" | "active" | "completed"
  participants: number
  maxParticipants: number
  startTime: string
  format: "single-elimination" | "double-elimination"
  rounds: Round[]
}

interface Round {
  roundNumber: number
  matches: Match[]
}

interface Match {
  id: number
  player1: Participant | null
  player2: Participant | null
  winner: Participant | null
  scheduled_at: string
  status: "pending" | "active" | "completed"
  scores?: {
    player1: { matter: number; manner: number; method: number }
    player2: { matter: number; manner: number; method: number }
  }
}

interface Participant {
  id: number
  name: string
  avatar?: string
  rating: number
  wins: number
  losses: number
}

export function TournamentBracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [newTournamentName, setNewTournamentName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockTournaments: Tournament[] = [
      {
        id: 1,
        name: "Spring Championship 2024",
        status: "active",
        participants: 16,
        maxParticipants: 16,
        startTime: "2024-03-15T14:00:00Z",
        format: "single-elimination",
        rounds: generateMockBracket(16),
      },
      {
        id: 2,
        name: "Weekly Practice Tournament",
        status: "upcoming",
        participants: 8,
        maxParticipants: 16,
        startTime: "2024-03-20T16:00:00Z",
        format: "single-elimination",
        rounds: [],
      },
      {
        id: 3,
        name: "Beginner's Cup",
        status: "completed",
        participants: 8,
        maxParticipants: 8,
        startTime: "2024-03-10T13:00:00Z",
        format: "single-elimination",
        rounds: generateMockBracket(8, true),
      },
    ]

    setTournaments(mockTournaments)
    setLoading(false)
  }

  const generateMockBracket = (participantCount: number, completed = false): Round[] => {
    const participants: Participant[] = Array.from({ length: participantCount }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      rating: 1200 + Math.floor(Math.random() * 400),
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 10),
    }))

    const rounds: Round[] = []
    let currentParticipants = [...participants]
    let roundNumber = 1

    while (currentParticipants.length > 1) {
      const matches: Match[] = []
      const nextRoundParticipants: Participant[] = []

      for (let i = 0; i < currentParticipants.length; i += 2) {
        const player1 = currentParticipants[i]
        const player2 = currentParticipants[i + 1] || null

        let winner = null
        let status: "pending" | "active" | "completed" = "pending"

        if (completed || (roundNumber === 1 && Math.random() > 0.3)) {
          winner = player2 ? (Math.random() > 0.5 ? player1 : player2) : player1
          status = "completed"
          if (winner) nextRoundParticipants.push(winner)
        }

        matches.push({
          id: i / 2 + 1,
          player1,
          player2,
          winner,
          scheduled_at: new Date(Date.now() + roundNumber * 3600000).toISOString(),
          status,
          scores: completed
            ? {
                player1: {
                  matter: 70 + Math.floor(Math.random() * 30),
                  manner: 70 + Math.floor(Math.random() * 30),
                  method: 70 + Math.floor(Math.random() * 30),
                },
                player2: {
                  matter: 70 + Math.floor(Math.random() * 30),
                  manner: 70 + Math.floor(Math.random() * 30),
                  method: 70 + Math.floor(Math.random() * 30),
                },
              }
            : undefined,
        })
      }

      rounds.push({ roundNumber, matches })
      currentParticipants = nextRoundParticipants
      roundNumber++
    }

    return rounds
  }

  const createTournament = async () => {
    if (!newTournamentName.trim()) return

    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newTournament: Tournament = {
      id: tournaments.length + 1,
      name: newTournamentName,
      status: "upcoming",
      participants: 1,
      maxParticipants: 16,
      startTime: new Date(Date.now() + 24 * 3600000).toISOString(),
      format: "single-elimination",
      rounds: [],
    }

    setTournaments([...tournaments, newTournament])
    setNewTournamentName("")
    setLoading(false)
  }

  const joinTournament = async (tournamentId: number) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    setTournaments(
      tournaments.map((t) =>
        t.id === tournamentId ? { ...t, participants: Math.min(t.participants + 1, t.maxParticipants) } : t,
      ),
    )
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return "Final"
    if (roundNumber === totalRounds - 1) return "Semi-Final"
    if (roundNumber === totalRounds - 2) return "Quarter-Final"
    return `Round ${roundNumber}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Swords className="w-6 h-6 text-purple-600" />
            <span>Tournament Mode</span>
          </CardTitle>
          <p className="text-gray-600">
            Compete in structured debate tournaments with automated brackets and real-time scoring
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tournaments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="bracket">Live Bracket</TabsTrigger>
          <TabsTrigger value="create">Create Tournament</TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedTournament(tournament)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <Badge className={getStatusColor(tournament.status)}>{tournament.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>
                        {tournament.participants}/{tournament.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(tournament.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Trophy className="w-4 h-4" />
                    <span>{tournament.format.replace("-", " ")}</span>
                  </div>

                  {tournament.status === "upcoming" && tournament.participants < tournament.maxParticipants && (
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        joinTournament(tournament.id)
                      }}
                      disabled={loading}
                    >
                      Join Tournament
                    </Button>
                  )}

                  {tournament.status === "active" && (
                    <Button className="w-full bg-transparent" variant="outline">
                      View Live Bracket
                    </Button>
                  )}

                  {tournament.status === "completed" && (
                    <Button className="w-full bg-transparent" variant="outline">
                      View Results
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bracket" className="space-y-4">
          {selectedTournament ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedTournament.name}</span>
                    <Badge className={getStatusColor(selectedTournament.status)}>{selectedTournament.status}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              {selectedTournament.rounds.length > 0 ? (
                <div className="space-y-6">
                  {selectedTournament.rounds.map((round) => (
                    <Card key={round.roundNumber}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Crown className="w-5 h-5 text-yellow-600" />
                          <span>{getRoundName(round.roundNumber, selectedTournament.rounds.length)}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {round.matches.map((match) => (
                            <Card key={match.id} className="border-2">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Match {match.id}</span>
                                    <Badge
                                      variant={
                                        match.status === "completed"
                                          ? "default"
                                          : match.status === "active"
                                            ? "secondary"
                                            : "outline"
                                      }
                                    >
                                      {match.status}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2">
                                    <div
                                      className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.player1?.id ? "bg-green-100" : "bg-gray-50"
                                      }`}
                                    >
                                      <span className="font-medium">{match.player1?.name || "TBD"}</span>
                                      {match.scores && (
                                        <span className="text-sm">
                                          {match.scores.player1.matter +
                                            match.scores.player1.manner +
                                            match.scores.player1.method}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-center text-sm text-gray-500">vs</div>

                                    <div
                                      className={`flex items-center justify-between p-2 rounded ${
                                        match.winner?.id === match.player2?.id ? "bg-green-100" : "bg-gray-50"
                                      }`}
                                    >
                                      <span className="font-medium">{match.player2?.name || "TBD"}</span>
                                      {match.scores && (
                                        <span className="text-sm">
                                          {match.scores.player2.matter +
                                            match.scores.player2.manner +
                                            match.scores.player2.method}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {match.status === "pending" && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <Clock className="w-4 h-4" />
                                      <span>Scheduled: {new Date(match.scheduled_at).toLocaleString()}</span>
                                    </div>
                                  )}

                                  {match.winner && (
                                    <div className="flex items-center space-x-2 text-sm text-green-700">
                                      <Trophy className="w-4 h-4" />
                                      <span>Winner: {match.winner.name}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Swords className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">Bracket not generated yet</p>
                    <p className="text-sm text-gray-500">Waiting for more participants to join</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Select a tournament</p>
                <p className="text-sm text-gray-500">Choose a tournament from the list to view its bracket</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Tournament</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tournament Name</label>
                <Input
                  placeholder="Enter tournament name..."
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                />
              </div>

              <Button onClick={createTournament} disabled={loading || !newTournamentName.trim()} className="w-full">
                {loading ? "Creating..." : "Create Tournament"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Tournament Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">🏆 Automated Brackets</h4>
                  <p className="text-blue-700">Single and double elimination formats with automatic seeding</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">⚡ Real-time Scoring</h4>
                  <p className="text-blue-700">Live updates with Matter, Manner, and Method scoring</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">👥 Spectator Mode</h4>
                  <p className="text-blue-700">Watch live debates with real-time transcripts and feedback</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">📊 Advanced Analytics</h4>
                  <p className="text-blue-700">Detailed performance metrics and improvement tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
