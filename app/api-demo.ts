import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, DebateTopic, DebateSession } from './services/debateApi';
import { api as apiClient } from './services/api';

// Simple demo component to test backend integration
export default function ApiDemo() {
  const [topics, setTopics] = useState<DebateTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load topics on mount
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getTopics();

        if (response.success) {
          setTopics(response.data.topics);
          setError(null);
        } else {
          setError(response.error || 'Failed to load topics');
        }
      } catch (err) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const handleTopicSelect = (topic: DebateTopic) => {
    setSelectedTopic(topic);
    // Create session for selected topic
    apiClient.createDebateSession({
      topicId: topic.id,
      role: 'government'
    }).then(response => {
      if (response.success) {
        const session = response.data.session;
        console.log('Session created:', session);
      } else {
        setError(response.error || 'Failed to create session');
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4">Debate Practice Demo</h2>
        <p className="text-gray-600 mb-4">This demo shows how the frontend integrates with the backend API. Select a topic and start a debate session.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Topics List */}
          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Available Topics</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
                Error: {error}
              </div>
            )}
            {loading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500">
                  <div className="inline-block animate-ping">Loading topics...</div>
                </div>
              </div>
            )}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  selected={selectedTopic?.id === topic.id}
                >
                  <CardHeader>
                    <CardTitle>{topic.title}</CardTitle>
                    <div className="flex items-center justify-between">
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty}
                      </Badge>
                      <span className="ml-2">{topic.timeLimit} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Level {topic.difficulty}</span>
                    </div>
                  </div>
                </CardHeader>
                  <CardContent>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardContent>
                </Card>
              </Card>
            ))}
          </div>

          {/* Topic Selection */}
          <div className="col-span-2 mt-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Selected Topic</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
                Error: {error}
              </div>
            )}
            {selectedTopic ? (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-0 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <CardTitle>{selectedTopic.title}</CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(selectedTopic.difficulty)}>
                      {selectedTopic.difficulty}
                    </Badge>
                    <span className="ml-2">{selectedTopic.timeLimit} min</span>
                  </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{selectedTopic.description}</CardDescription>
                </CardContent>
                </Card>
              </Card>
            ) : (
              <div className="text-center text-gray-500 p-8">
                <p>No topic selected</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="col-span-1 mt-8">
            <div className="flex space-x-4">
              <Button
                onClick={() => handleTopicSelect(selectedTopic!)}
                disabled={!selectedTopic}
                variant="outline"
                className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg"
              >
                Choose This Topic
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ApiDemo;