"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  ArrowRight,
  ArrowLeft,
  Target,
  Brain,
  Award,
  Star,
  Lightbulb,
  Users,
} from "lucide-react"
import { AIFeedback } from "./ai-feedback"

// Move modules outside component to prevent recreation
const LESSON_MODULES = {
  fundamentals: {
    title: "Debate Fundamentals",
    description: "Learn the basic principles of effective debating",
    totalSteps: 8,
    estimatedTime: 45,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "Welcome to Debate Fundamentals",
        content: `
          <h2>What is Debate?</h2>
          <p>Debate is a structured argument where two sides present opposing viewpoints on a specific topic. It's not just about winning - it's about:</p>
          <ul>
            <li><strong>Critical thinking:</strong> Analyzing issues from multiple perspectives</li>
            <li><strong>Communication:</strong> Expressing ideas clearly and persuasively</li>
            <li><strong>Research:</strong> Finding and evaluating evidence</li>
            <li><strong>Listening:</strong> Understanding and responding to opposing arguments</li>
          </ul>
          <p>In this module, you'll learn the essential skills that form the foundation of effective debating.</p>
        `,
      },
      {
        id: 2,
        type: "concept",
        title: "The Structure of Arguments",
        content: `
          <h2>Building Strong Arguments</h2>
          <p>Every good argument has three essential components:</p>
          <div class="argument-structure">
            <div class="component">
              <h3>1. Claim (Point)</h3>
              <p>Your main assertion or position</p>
              <em>Example: "School uniforms should be mandatory"</em>
            </div>
            <div class="component">
              <h3>2. Evidence</h3>
              <p>Facts, statistics, or examples that support your claim</p>
              <em>Example: "Studies show 23% reduction in bullying"</em>
            </div>
            <div class="component">
              <h3>3. Reasoning</h3>
              <p>Explanation of how your evidence supports your claim</p>
              <em>Example: "This reduction occurs because uniforms eliminate visible economic differences"</em>
            </div>
          </div>
        `,
        question:
          "Using the structure above, write a complete argument about why students should learn debate skills in school.",
        questionType: "essay",
        sampleAnswer:
          "Students should learn debate skills in school because these skills improve critical thinking abilities. Research from Harvard University shows that students who participate in debate programs score 15% higher on standardized tests. This improvement occurs because debate requires students to analyze complex issues, evaluate evidence, and construct logical arguments - all essential academic skills.",
      },
      {
        id: 3,
        type: "concept",
        title: "The PEEL Method",
        content: `
          <h2>PEEL: A Framework for Arguments</h2>
          <p>PEEL is an acronym that helps you structure arguments effectively:</p>
          <div class="peel-framework">
            <div class="peel-item">
              <h3><span class="letter">P</span>oint</h3>
              <p>State your main argument clearly</p>
            </div>
            <div class="peel-item">
              <h3><span class="letter">E</span>vidence</h3>
              <p>Provide supporting facts or examples</p>
            </div>
            <div class="peel-item">
              <h3><span class="letter">E</span>xplanation</h3>
              <p>Explain how your evidence supports your point</p>
            </div>
            <div class="peel-item">
              <h3><span class="letter">L</span>ink</h3>
              <p>Connect back to the main topic or motion</p>
            </div>
          </div>
          <div class="example-box">
            <h4>Example PEEL Argument:</h4>
            <p><strong>Point:</strong> Social media negatively impacts teenage mental health.</p>
            <p><strong>Evidence:</strong> A 2023 study by the American Psychological Association found that teens who use social media for more than 3 hours daily are 60% more likely to experience depression.</p>
            <p><strong>Explanation:</strong> This occurs because constant comparison with others online creates unrealistic expectations and damages self-esteem during crucial developmental years.</p>
            <p><strong>Link:</strong> Therefore, implementing age restrictions on social media would protect young people's psychological wellbeing.</p>
          </div>
        `,
        question:
          "Write a PEEL argument about whether homework should be banned in primary schools. Make sure to include all four components clearly.",
        questionType: "essay",
        sampleAnswer:
          "Point: Homework should be banned in primary schools because it creates unnecessary stress for young children. Evidence: Research from Stanford University shows that children aged 6-10 who have regular homework report 40% higher stress levels than those without. Explanation: This stress occurs because young children lack the emotional regulation skills to manage academic pressure outside school hours, leading to family conflicts and anxiety. Link: By banning homework in primary schools, we can protect children's mental health while allowing them to develop naturally through play and family time.",
      },
      {
        id: 4,
        type: "practice",
        title: "Practice: Building Your First Argument",
        content: `
          <h2>Time to Practice!</h2>
          <p>Now it's your turn to build a strong argument using what you've learned.</p>
          <div class="practice-prompt">
            <h3>Debate Motion:</h3>
            <p><em>"This house believes that students should choose their own subjects from age 14"</em></p>
          </div>
          <div class="instructions">
            <h4>Your Task:</h4>
            <p>Write an argument either supporting or opposing this motion. Use the PEEL framework and make sure to include:</p>
            <ul>
              <li>A clear point (your position)</li>
              <li>Specific evidence (facts, statistics, or examples)</li>
              <li>Detailed explanation of how your evidence supports your point</li>
              <li>A link back to the motion</li>
            </ul>
          </div>
        `,
        question:
          "Write your argument about whether students should choose their own subjects from age 14. Use the PEEL framework.",
        questionType: "essay",
        sampleAnswer:
          "Point: Students should be allowed to choose their own subjects from age 14 because this promotes engagement and academic success. Evidence: Finland's education system, which allows subject choice from age 13, consistently ranks in the top 5 globally for student satisfaction and achievement. Explanation: When students can pursue their interests and strengths, they become more motivated learners, leading to better retention and understanding of material. Link: Therefore, giving 14-year-olds subject choice would improve educational outcomes and prepare them for specialized career paths.",
      },
      {
        id: 5,
        type: "concept",
        title: "Types of Evidence",
        content: `
          <h2>Strengthening Arguments with Evidence</h2>
          <p>Not all evidence is created equal. Here are the main types and their strengths:</p>
          <div class="evidence-types">
            <div class="evidence-type">
              <h3>📊 Statistics & Data</h3>
              <p><strong>Strength:</strong> Objective and measurable</p>
              <p><strong>Example:</strong> "Crime rates decreased by 15% after the policy implementation"</p>
              <p><strong>Tip:</strong> Always cite the source and date</p>
            </div>
            <div class="evidence-type">
              <h3>👨‍🔬 Expert Opinion</h3>
              <p><strong>Strength:</strong> Credible and authoritative</p>
              <p><strong>Example:</strong> "According to Dr. Smith, a leading climate scientist..."</p>
              <p><strong>Tip:</strong> Establish the expert's credentials</p>
            </div>
            <div class="evidence-type">
              <h3>📚 Case Studies</h3>
              <p><strong>Strength:</strong> Real-world application</p>
              <p><strong>Example:</strong> "When Singapore implemented this policy..."</p>
              <p><strong>Tip:</strong> Choose relevant and recent examples</p>
            </div>
            <div class="evidence-type">
              <h3>📖 Historical Examples</h3>
              <p><strong>Strength:</strong> Shows patterns and consequences</p>
              <p><strong>Example:</strong> "Similar policies in the 1990s led to..."</p>
              <p><strong>Tip:</strong> Explain why historical context applies today</p>
            </div>
          </div>
        `,
        question:
          "Choose one type of evidence from above and explain why it would be particularly effective for arguing about environmental policies. Give a specific example.",
        questionType: "essay",
        sampleAnswer:
          "Statistics and data would be particularly effective for environmental policy arguments because environmental issues require measurable, objective evidence to demonstrate impact. For example, when arguing for carbon taxes, citing 'Countries with carbon taxes have reduced emissions by an average of 12% over five years (OECD, 2023)' provides concrete proof of policy effectiveness. This type of evidence is especially powerful because environmental skeptics often demand hard data, and statistics can cut through emotional arguments to show real-world results.",
      },
      {
        id: 6,
        type: "concept",
        title: "Addressing Counterarguments",
        content: `
          <h2>The Art of Rebuttal</h2>
          <p>Strong debaters don't just present their own arguments - they anticipate and address opposing viewpoints.</p>
          <div class="rebuttal-strategies">
            <h3>The DARE Method for Rebuttals:</h3>
            <div class="dare-method">
              <div class="dare-step">
                <h4><span class="letter">D</span>ismiss</h4>
                <p>Acknowledge the opposing argument respectfully</p>
                <em>"While it's true that..."</em>
              </div>
              <div class="dare-step">
                <h4><span class="letter">A</span>ttack</h4>
                <p>Point out flaws in their reasoning or evidence</p>
                <em>"However, this overlooks..."</em>
              </div>
              <div class="dare-step">
                <h4><span class="letter">R</span>ebuild</h4>
                <p>Strengthen your own position</p>
                <em>"In fact, the evidence shows..."</em>
              </div>
              <div class="dare-step">
                <h4><span class="letter">E</span>xplain</h4>
                <p>Clarify why your argument is stronger</p>
                <em>"This is significant because..."</em>
              </div>
            </div>
          </div>
          <div class="example-rebuttal">
            <h4>Example Rebuttal:</h4>
            <p><strong>Opposing argument:</strong> "School uniforms limit students' self-expression"</p>
            <p><strong>Your rebuttal using DARE:</strong></p>
            <p><strong>Dismiss:</strong> "While self-expression is important for student development..."</p>
            <p><strong>Attack:</strong> "...this argument assumes that clothing is the primary means of self-expression, which overlooks the many other ways students can express themselves through art, writing, sports, and clubs."</p>
            <p><strong>Rebuild:</strong> "In fact, uniforms can actually enhance self-expression by removing the pressure to conform to fashion trends and allowing students to focus on developing their personalities and talents."</p>
            <p><strong>Explain:</strong> "This is significant because true self-expression comes from character and achievements, not clothing brands."</p>
          </div>
        `,
        question:
          "Practice the DARE method. Choose any topic you feel strongly about and write a rebuttal to a common opposing argument.",
        questionType: "essay",
        sampleAnswer:
          "Topic: Banning single-use plastic bags. Opposing argument: 'Plastic bag bans hurt low-income families who can't afford reusable bags.' Dismiss: While affordability is a legitimate concern for low-income families... Attack: ...this argument overlooks the fact that most stores sell reusable bags for under $1, and many communities provide free reusable bags during transition periods. Rebuild: In fact, plastic bag bans ultimately save low-income families money because reusable bags last for years, eliminating the hidden costs of constantly buying products that come with 'free' plastic bags. Explain: This is significant because the long-term financial benefits far outweigh the minimal upfront cost, while also protecting the environment that affects all communities.",
      },
      {
        id: 7,
        type: "practice",
        title: "Advanced Practice: Full Argument Construction",
        content: `
          <h2>Putting It All Together</h2>
          <p>Now you'll construct a complete argument that includes multiple points and addresses counterarguments.</p>
          <div class="advanced-prompt">
            <h3>Complex Debate Motion:</h3>
            <p><em>"This house would make voting mandatory for all citizens over 18"</em></p>
          </div>
          <div class="advanced-instructions">
            <h4>Your Challenge:</h4>
            <p>Write a comprehensive argument that includes:</p>
            <ul>
              <li><strong>2-3 main arguments</strong> using the PEEL framework</li>
              <li><strong>Different types of evidence</strong> (statistics, expert opinion, examples)</li>
              <li><strong>At least one rebuttal</strong> using the DARE method</li>
              <li><strong>A strong conclusion</strong> that ties everything together</li>
            </ul>
            <p>Aim for 300-400 words total.</p>
          </div>
        `,
        question:
          "Write your comprehensive argument about mandatory voting. Include multiple PEEL arguments, different evidence types, and address at least one counterargument using DARE.",
        questionType: "essay",
        sampleAnswer:
          "Mandatory voting should be implemented because it strengthens democracy, reduces political inequality, and increases government legitimacy. Point: Mandatory voting ensures true democratic representation. Evidence: Australia, which has compulsory voting, consistently achieves 95%+ turnout compared to 55% in voluntary systems like the US. Explanation: High turnout means elected officials represent the will of the entire population, not just politically engaged minorities. Link: This creates governments that truly reflect society's diverse needs and priorities. Point: Mandatory voting reduces the influence of extreme political groups. Evidence: Political scientist Dr. Sarah Chen's research shows that voluntary voting systems amplify the voices of the most politically passionate, often the most extreme 10% on each side. Explanation: When everyone votes, moderate voices balance out extremes, leading to more centrist, practical policies. Link: This moderation is essential for stable, effective governance. However, critics argue that forced voting violates personal freedom. While individual liberty is important, this overlooks that voting is a civic duty like jury service or paying taxes. In fact, mandatory voting enhances freedom by ensuring everyone's voice is heard equally, preventing wealthy or extreme groups from dominating elections. This is significant because true freedom requires equal political participation, not just the option to participate. Therefore, mandatory voting strengthens democracy by ensuring representative outcomes, moderating extreme politics, and protecting equal civic participation for all citizens.",
      },
      {
        id: 8,
        type: "assessment",
        title: "Module Assessment",
        content: `
          <h2>Final Assessment: Debate Fundamentals</h2>
          <p>Congratulations on completing the Debate Fundamentals module! This final assessment will test your understanding of all the concepts you've learned.</p>
          <div class="assessment-overview">
            <h3>Assessment Components:</h3>
            <ul>
              <li>Argument structure and PEEL framework usage</li>
              <li>Evidence selection and integration</li>
              <li>Counterargument identification and rebuttal</li>
              <li>Overall persuasiveness and clarity</li>
            </ul>
          </div>
          <div class="final-prompt">
            <h3>Assessment Motion:</h3>
            <p><em>"This house believes that artificial intelligence should be banned from making decisions about human employment"</em></p>
            <h4>Instructions:</h4>
            <p>Choose a side and write a complete debate case (400-500 words) that demonstrates mastery of:</p>
            <ul>
              <li>Multiple PEEL arguments with varied evidence types</li>
              <li>Anticipation and rebuttal of opposing arguments</li>
              <li>Clear structure and persuasive language</li>
              <li>Strong opening and conclusion</li>
            </ul>
          </div>
        `,
        question:
          "Write your complete debate case on AI in employment decisions. This is your final assessment - demonstrate all the skills you've learned.",
        questionType: "essay",
        sampleAnswer:
          "AI should be banned from making employment decisions because it perpetuates discrimination, lacks human judgment, and threatens worker dignity. Point: AI systems amplify existing workplace discrimination. Evidence: Amazon scrapped its AI recruiting tool in 2018 after discovering it systematically downgraded resumes from women, and a 2023 MIT study found that 76% of AI hiring systems show racial bias. Explanation: These systems learn from historical hiring data that reflects past discrimination, meaning they perpetuate and amplify human prejudices rather than eliminating them. Link: Banning AI from employment decisions would prevent the institutionalization of discrimination in hiring processes. Point: Employment decisions require human judgment that AI cannot replicate. Evidence: Dr. Michael Rodriguez, a workplace psychology expert, argues that successful hiring depends on assessing cultural fit, emotional intelligence, and potential for growth - qualities that require human intuition. Explanation: AI can process data but cannot evaluate the subtle interpersonal skills, creativity, and adaptability that make employees successful in dynamic work environments. Link: Human oversight in employment decisions ensures that hiring considers the full spectrum of human potential. Critics argue that AI eliminates human bias and increases efficiency. While efficiency is valuable, this overlooks that AI doesn't eliminate bias - it systematizes it. In fact, human recruiters can be trained to recognize and counteract their biases, while AI systems operate as black boxes that hide their discriminatory processes. This is significant because employment decisions fundamentally affect people's livelihoods and dignity, requiring the empathy and accountability that only humans can provide. Therefore, AI should be banned from employment decisions to protect against discrimination, preserve human judgment in hiring, and maintain the dignity of work in our society.",
      },
    ],
  },
  arguments: {
    title: "Advanced Argumentation",
    description: "Master sophisticated argument techniques and logical reasoning",
    totalSteps: 6,
    estimatedTime: 35,
    steps: [
      {
        id: 1,
        type: "introduction",
        title: "Advanced Argumentation Techniques",
        content: `
          <h2>Beyond Basic Arguments</h2>
          <p>You've mastered the fundamentals - now it's time to elevate your argumentation skills to the next level.</p>
          <p>In this module, you'll learn:</p>
          <ul>
            <li><strong>Logical fallacies:</strong> How to identify and avoid common reasoning errors</li>
            <li><strong>Sophisticated evidence:</strong> Using complex data and expert analysis</li>
            <li><strong>Emotional appeals:</strong> When and how to use pathos effectively</li>
            <li><strong>Comparative analysis:</strong> Weighing competing values and priorities</li>
          </ul>
        `,
      },
      {
        id: 2,
        type: "concept",
        title: "Logical Fallacies",
        content: `
          <h2>Common Logical Fallacies to Avoid</h2>
          <p>Understanding fallacies helps you strengthen your own arguments and identify weaknesses in opponents' reasoning.</p>
          <div class="fallacies-grid">
            <div class="fallacy">
              <h3>Ad Hominem</h3>
              <p>Attacking the person instead of their argument</p>
              <em>Wrong: "You can't trust John's climate data because he's not a scientist"</em>
              <em>Right: "John's data is flawed because it doesn't account for seasonal variations"</em>
            </div>
            <div class="fallacy">
              <h3>Straw Man</h3>
              <p>Misrepresenting someone's argument to make it easier to attack</p>
              <em>Wrong: "Environmentalists want to ban all cars and force us back to the stone age"</em>
              <em>Right: "While environmental concerns are valid, this specific policy may have economic drawbacks"</em>
            </div>
            <div class="fallacy">
              <h3>False Dichotomy</h3>
              <p>Presenting only two options when more exist</p>
              <em>Wrong: "Either we allow unlimited immigration or we close all borders"</em>
              <em>Right: "We need to find a balanced approach between humanitarian concerns and practical limitations"</em>
            </div>
          </div>
        `,
        question:
          "Identify the logical fallacy in this statement and explain why it's problematic: 'We shouldn't listen to teenagers about climate change because they're too young to understand complex economic issues.'",
        questionType: "essay",
        sampleAnswer:
          "This statement contains an ad hominem fallacy. Instead of addressing the substance of teenagers' climate change arguments, it attacks their credibility based on age. This is problematic because it dismisses potentially valid points without engaging with the actual evidence or reasoning presented. Age doesn't automatically invalidate someone's ability to understand scientific data or moral arguments about environmental protection. A stronger approach would be to evaluate the specific claims and evidence rather than dismissing them based on the speaker's demographics.",
      },
      // Additional steps would continue here...
    ],
  },
}

interface LessonStep {
  id: number
  type: "introduction" | "concept" | "practice" | "assessment"
  title: string
  content: string
  question?: string
  questionType?: "multiple-choice" | "essay" | "drag-drop"
  sampleAnswer?: string
}

interface LessonModule {
  title: string
  description: string
  totalSteps: number
  estimatedTime: number
  steps: LessonStep[]
}

export function InteractiveLesson() {
  const [currentModule, setCurrentModule] = useState<keyof typeof LESSON_MODULES>("fundamentals")
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [userAnswer, setUserAnswer] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [moduleProgress, setModuleProgress] = useState(0)

  const module = LESSON_MODULES[currentModule]
  const currentStepData = useMemo(() => module.steps[currentStep], [module, currentStep])

  useEffect(() => {
    if (currentStepData?.type === "introduction") {
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
    }
  }, [currentStep, currentStepData?.type])

  useEffect(() => {
    const progress = (completedSteps.size / module.totalSteps) * 100
    setModuleProgress(progress)
  }, [completedSteps, module.totalSteps])

  const handleAnswerSubmit = () => {
    if (!userAnswer.trim()) return
    setShowFeedback(true)
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
  }

  const handleNextStep = () => {
    if (currentStep < module.totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      setUserAnswer("")
      setShowFeedback(false)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setUserAnswer("")
      setShowFeedback(false)
    }
  }

  const handleModuleChange = (moduleKey: keyof typeof LESSON_MODULES) => {
    setCurrentModule(moduleKey)
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setUserAnswer("")
    setShowFeedback(false)
  }

  const isStepCompleted = completedSteps.has(currentStep)
  const canProceed = isStepCompleted || !currentStepData.question

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <CardTitle className="text-2xl lg:text-3xl">{module.title}</CardTitle>
                <CardDescription className="text-blue-100">{module.description}</CardDescription>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Step {currentStep + 1} of {module.totalSteps}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Clock className="w-3 h-3 mr-1" />
                    {module.estimatedTime} min
                  </Badge>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(moduleProgress)}%</div>
                <div className="text-sm text-blue-100">Complete</div>
                <Progress value={moduleProgress} className="w-32 mt-2" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Module Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Learning Modules</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(LESSON_MODULES).map(([key, moduleData]) => (
                <Button
                  key={key}
                  variant={currentModule === key ? "default" : "outline"}
                  onClick={() => handleModuleChange(key as keyof typeof LESSON_MODULES)}
                  className="h-auto p-4 justify-start"
                >
                  <div className="text-left">
                    <div className="font-semibold">{moduleData.title}</div>
                    <div className="text-sm opacity-70">{moduleData.description}</div>
                    <div className="text-xs mt-1">
                      {moduleData.totalSteps} steps • {moduleData.estimatedTime} min
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Lesson Content */}
          <div className="xl:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {currentStepData.type === "introduction" && <Play className="w-5 h-5 text-blue-600" />}
                    {currentStepData.type === "concept" && <Brain className="w-5 h-5 text-purple-600" />}
                    {currentStepData.type === "practice" && <Target className="w-5 h-5 text-green-600" />}
                    {currentStepData.type === "assessment" && <Award className="w-5 h-5 text-yellow-600" />}
                    <span>{currentStepData.title}</span>
                  </CardTitle>
                  {isStepCompleted && <CheckCircle className="w-6 h-6 text-green-600" />}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: currentStepData.content }}
                />

                {currentStepData.question && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Practice Question:</h4>
                      <p className="text-blue-800">{currentStepData.question}</p>
                    </div>

                    <Textarea
                      placeholder="Type your answer here..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{userAnswer.length} characters</span>
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={!userAnswer.trim() || showFeedback}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Feedback */}
            {showFeedback && userAnswer && (
              <AIFeedback
                userAnswer={userAnswer}
                lessonType="lesson"
                questionType={currentStepData.questionType || "essay"}
                topic={currentStepData.title}
                expectedElements={[]}
              />
            )}

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2 bg-transparent"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: module.totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i === currentStep ? "bg-purple-600" : completedSteps.has(i) ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNextStep}
                    disabled={currentStep === module.totalSteps - 1 || !canProceed}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Module Progress</span>
                      <span>{Math.round(moduleProgress)}%</span>
                    </div>
                    <Progress value={moduleProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed Steps</span>
                      <span>
                        {completedSteps.size}/{module.totalSteps}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Step</span>
                      <span>{currentStep + 1}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span>Learning Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800">
                      <strong>Take your time:</strong> There's no rush. Focus on understanding each concept thoroughly.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800">
                      <strong>Practice actively:</strong> Try to apply concepts to real-world examples as you learn.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800">
                      <strong>Review feedback:</strong> AI feedback helps identify areas for improvement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Module Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {module.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-2 rounded text-xs border cursor-pointer transition-colors ${
                        index === currentStep
                          ? "bg-purple-100 border-purple-300 text-purple-800"
                          : completedSteps.has(index)
                            ? "bg-green-100 border-green-300 text-green-800"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                      onClick={() => {
                        setCurrentStep(index)
                        setUserAnswer("")
                        setShowFeedback(false)
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === currentStep
                              ? "bg-purple-500 text-white"
                              : completedSteps.has(index)
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {completedSteps.has(index) ? "✓" : index + 1}
                        </div>
                        <span className="font-medium">{step.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
