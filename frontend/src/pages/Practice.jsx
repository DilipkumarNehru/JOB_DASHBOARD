import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Code2, Play, Terminal, CheckCircle2, XCircle, Sparkles, BookOpen,
  Briefcase, FileText, Brain, Award, Volume2, VolumeX, Copy, RotateCcw,
  HelpCircle, Lightbulb, Layers, Search, Filter, ArrowRight, ChevronDown,
  ChevronUp, Check, ExternalLink, RefreshCw, Eye, EyeOff, AlertTriangle,
  Building2, MapPin, Zap, Bookmark, Star, ArrowUpRight, Cpu, ChevronLeft,
  ChevronRight, Lock, Unlock, ListChecks, ArrowDown
} from 'lucide-react';
import { practiceService } from '../services';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Supported Languages Configuration ──────────────────────────────────
export const LANGUAGE_OPTIONS = [
  { id: 'javascript', label: 'JavaScript (Node.js)', ext: 'js', badge: 'Node.js v22', icon: '⚡' },
  { id: 'python', label: 'Python 3', ext: 'py', badge: 'Python 3.12', icon: '🐍' },
  { id: 'java', label: 'Java', ext: 'java', badge: 'JDK 25', icon: '☕' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', badge: 'TS 5.x', icon: '📘' },
  { id: 'cpp', label: 'C++', ext: 'cpp', badge: 'C++17/20', icon: '⚙️' },
  { id: 'c', label: 'C', ext: 'c', badge: 'C99/C11', icon: '🔧' },
  { id: 'csharp', label: 'C#', ext: 'cs', badge: '.NET C#', icon: '🔷' },
  { id: 'go', label: 'Go (Golang)', ext: 'go', badge: 'Go 1.22', icon: '🐹' },
  { id: 'rust', label: 'Rust', ext: 'rs', badge: 'Rust 2021', icon: '🦀' },
  { id: 'php', label: 'PHP', ext: 'php', badge: 'PHP 8.x', icon: '🐘' },
  { id: 'ruby', label: 'Ruby', ext: 'rb', badge: 'Ruby 3.x', icon: '💎' },
  { id: 'sql', label: 'SQL (PostgreSQL/MySQL)', ext: 'sql', badge: 'ANSI SQL', icon: '🗄️' },
];

/**
 * Generates an idiomatic starter template for any selected language.
 */
export const getStarterCodeForLanguage = (problem, lang) => {
  if (problem?.starterCode?.[lang]) {
    return problem.starterCode[lang];
  }

  switch (lang) {
    case 'python':
      return `def solution():\n    # Step 1: Initialize your variables/data structures\n    # Step 2: Implement core algorithm\n    # Step 3: Return result\n    pass`;
    case 'java':
      return `import java.util.*;\n\npublic class Solution {\n    public Object solution() {\n        // Step 1: Initialize data structures\n        // Step 2: Implement core algorithm\n        // Step 3: Return result\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println("Java Solution ready for execution");\n    }\n}`;
    case 'typescript':
      return `function solution(): any {\n  // Step 1: Type-safe initialization\n  // Step 2: Implement logic\n  return null;\n}`;
    case 'cpp':
      return `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solution() {\n        // Step 1: Initialize C++ containers\n        // Step 2: Implement optimal algorithm\n    }\n};\n\nint main() {\n    cout << "C++ Solution ready" << endl;\n    return 0;\n}`;
    case 'c':
      return `#include <stdio.h>\n#include <stdlib.h>\n\nvoid solution() {\n    // Step 1: Allocate memory and pointers\n    // Step 2: Implement C logic\n}\n\nint main() {\n    printf("C program compiled\\n");\n    return 0;\n}`;
    case 'csharp':
      return `using System;\nusing System.Collections.Generic;\n\npublic class Solution {\n    public void SolutionMethod() {\n        // Step 1: Initialize C# collections\n        // Step 2: Implement algorithm\n    }\n}`;
    case 'go':
      return `package main\n\nimport "fmt"\n\nfunc solution() {\n    // Step 1: Initialize Go slice / map\n    // Step 2: Implement algorithm\n}\n\nfunc main() {\n    fmt.Println("Go program ready")\n}`;
    case 'rust':
      return `impl Solution {\n    pub fn solution() {\n        // Step 1: Initialize variables\n        // Step 2: Implement memory-safe logic\n    }\n}`;
    case 'php':
      return `<?php\nfunction solution() {\n    // Step 1: Initialize PHP arrays\n    // Step 2: Implement algorithm\n    return null;\n}`;
    case 'ruby':
      return `def solution\n  # Step 1: Initialize Ruby data structures\n  # Step 2: Implement algorithm\nend`;
    case 'sql':
      return `-- Step 1: Select required columns\n-- Step 2: Apply filters and sorting\nSELECT id, name FROM users WHERE active = 1;`;
    default:
      return `function solution() {\n  // Step 1: Initialize your data structures\n  // Step 2: Implement core algorithm\n  // Step 3: Return result\n}`;
  }
};

/**
 * Ensures a question has a 4-step progressive hint progression, each with an explicit "Why we are using this step" rationale.
 */
export const ensureProgressiveHints = (q) => {
  if (Array.isArray(q.hints) && q.hints.length >= 3) {
    return q.hints;
  }

  if (q.category === 'coding') {
    return [
      {
        stepNumber: 1,
        stepTitle: 'Step 1: Understand the Problem & Detect Edge Cases',
        content: `Examine the input constraints carefully. What happens with empty inputs, negative numbers, or duplicates? Does the dataset fit in memory?\n\nFormulate your target time & space complexity before writing any code.`,
        whyThisStep: 'Why we are using this step: Top interviewers evaluate whether you rush into coding or methodically identify edge cases, boundary conditions, and scale constraints first.',
        codeSnippet: `// Step 1 edge case validation\nif (!nums || nums.length < 2) return [];`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Step 2: Choose Optimal Data Structure & Pattern',
        content: `Identify the algorithm pattern (e.g. Hash Map, Two Pointers, Sliding Window). Avoid nested O(N²) loops by using a structure with O(1) average lookup time.\n\nTarget skill: ${q.targetSkill || 'Hash Map / Two Pointers'}.`,
        whyThisStep: 'Why we are using this step: Selecting the right data structure is the single highest-impact decision; it immediately drops runtime from quadratic to linear time.',
        codeSnippet: `// Step 2 data structure initialization\nconst map = new Map(); // O(1) lookups`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Step 3: Core Algorithmic Logic & Transition State',
        content: `Iterate through elements sequentially. At each step, compute the missing target state (e.g. complement = target - current). If previously recorded, you found the match! Otherwise store current element.`,
        whyThisStep: 'Why we are using this step: Formulating clear algorithmic invariants prevents off-by-one bugs and guarantees each element is used correctly without duplicate indexing.',
        codeSnippet: `const complement = target - nums[i];\nif (map.has(complement)) {\n  return [map.get(complement), i];\n}\nmap.set(nums[i], i);`,
      },
      {
        stepNumber: 4,
        stepTitle: 'Step 4: Complexity Analysis & Final Implementation',
        content: `Wrap the implementation, ensure clean fallbacks, and state Big-O.\n\n• Time Complexity: O(N) single-pass\n• Space Complexity: O(N) auxiliary storage`,
        whyThisStep: 'Why we are using this step: Interviewers always demand rigorous Big-O time and space proofs before closing the interview or asking follow-ups.',
        codeSnippet: q.solutionCode || '',
      },
    ];
  }

  if (q.category === 'system_design') {
    return [
      {
        stepNumber: 1,
        stepTitle: 'Step 1: Clarify Scope, Scale & SLA Requirements',
        content: 'Identify read vs write ratio, DAU scale (e.g., 100M users), throughput (10k QPS), and latency targets (p99 < 50ms).',
        whyThisStep: 'Why we are using this step: Jumping into architecture without sizing numbers results in under-engineered or massively over-engineered systems.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Step 2: High-Level Architecture & Request Flow',
        content: 'Establish the end-to-end request pipeline: Client -> CDN / DNS -> API Gateway -> Load Balancer -> Stateless Services -> Cache (Redis) -> Distributed Database.',
        whyThisStep: 'Why we are using this step: Establishes broad architectural breadth before zeroing in on individual component bottlenecks.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Step 3: Core Bottleneck & Data Model Deep-Dive',
        content: q.modelAnswer ? q.modelAnswer.substring(0, 300) + '…' : 'Focus on database partitioning, distributed locking, and cache invalidation strategies.',
        whyThisStep: 'Why we are using this step: Senior and staff-level bar raisers look for deep-dive technical mechanisms rather than high-level textbook diagrams.',
      },
      {
        stepNumber: 4,
        stepTitle: 'Step 4: Fault Tolerance, Failovers & Scalability Trade-offs',
        content: 'Discuss circuit breakers, replication lag, multi-region active-active deployments, and disaster recovery strategies.',
        whyThisStep: 'Why we are using this step: Demonstrates that you build production-ready systems that gracefully withstand outages and hardware degradation.',
      },
    ];
  }

  // General Technical & Behavioral Questions
  return [
    {
      stepNumber: 1,
      stepTitle: 'Step 1: High-Level Definition & Context (Elevator Pitch)',
      content: 'Provide a crisp 30-second definition summarizing the core concept or situation before jumping into complex details.',
      whyThisStep: 'Why we are using this step: Immediate clarity prevents wandering answers and signals executive engineering communication skills.',
    },
    {
      stepNumber: 2,
      stepTitle: 'Step 2: Inner Mechanisms & Architectural Details',
      content: q.modelAnswer ? q.modelAnswer.substring(0, 350) + '…' : 'Explain internal operational details, memory management, and execution lifecycle.',
      whyThisStep: 'Why we are using this step: Proves deep, first-principles understanding rather than surface-level documentation memorization.',
    },
    {
      stepNumber: 3,
      stepTitle: 'Step 3: Production Trade-offs & Real-World Pitfalls',
      content: (q.keyPoints && q.keyPoints.length > 0) ? q.keyPoints.join('\n• ') : 'Discuss performance implications, security caveats, and common operational bugs.',
      whyThisStep: 'Why we are using this step: Discussing real trade-offs and edge cases demonstrates genuine battle-tested production experience.',
    },
    {
      stepNumber: 4,
      stepTitle: 'Step 4: Full Answer & Role Application',
      content: q.modelAnswer || '',
      whyThisStep: 'Why we are using this step: Directly ties your expertise to the hiring team\'s business goals and day-to-day tech stack.',
    },
  ];
};

/**
 * ─── ProgressiveHintViewer Component ─────────────────────────────────────
 * Renders hints step-by-step with dedicated "Why we are using this step" callouts.
 * Full answer is never revealed upfront; only advances step-by-step or on explicit unlock.
 */
function ProgressiveHintViewer({ question, isCompilerView = false }) {
  const hints = ensureProgressiveHints(question);
  const totalSteps = hints.length;

  // Active step index (1-indexed: 1 = Step 1, 2 = Step 2, etc.)
  const [activeStep, setActiveStep] = useState(1);
  // Max step reached by user
  const [unlockedStep, setUnlockedStep] = useState(1);
  // Full answer disclosure state
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const currentHint = hints[activeStep - 1] || hints[0];

  const handleNextStep = () => {
    if (activeStep < totalSteps) {
      const next = activeStep + 1;
      setActiveStep(next);
      if (next > unlockedStep) {
        setUnlockedStep(next);
      }
    } else {
      setShowFullAnswer(true);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const copySnippet = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    toast.success('Snippet copied');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/60 p-4 sm:p-5 space-y-4 shadow-sm text-xs transition-all">
      {/* Stepper Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-xs">
                Step-by-Step Guided Hint
              </span>
              <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.2 text-[10px] font-bold text-indigo-800">
                Step {activeStep} of {totalSteps}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Answers are revealed step-by-step with architectural rationale so you learn without spoilers.
            </p>
          </div>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-1.5">
          {hints.map((h, idx) => {
            const stepNum = idx + 1;
            const isCurrent = stepNum === activeStep;
            const isUnlocked = stepNum <= unlockedStep;

            return (
              <button
                key={stepNum}
                onClick={() => isUnlocked && setActiveStep(stepNum)}
                disabled={!isUnlocked}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isUnlocked
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={isUnlocked ? `Go to Step ${stepNum}` : `Unlock Step ${stepNum} by clicking Next Hint`}
              >
                {!isUnlocked && <Lock className="h-2.5 w-2.5" />}
                <span>Step {stepNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Body Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
        {/* Step Title */}
        <div className="flex items-center justify-between">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
              {activeStep}
            </span>
            <span>{currentHint.stepTitle}</span>
          </h4>
        </div>

        {/* Step Content */}
        <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line text-xs">
          {currentHint.content}
        </p>

        {/* ─── DEDICATED WHY WE ARE USING THIS STEP CALLOUT ─────────────── */}
        {currentHint.whyThisStep && (
          <div className="rounded-xl border border-amber-300/80 bg-amber-50/80 p-3.5 space-y-1.5 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Why We Are Using This Step:</span>
            </div>
            <p className="text-amber-950 font-semibold leading-relaxed pl-5 border-l-2 border-amber-400">
              {currentHint.whyThisStep.replace(/^Why this step:\s*/i, '')}
            </p>
          </div>
        )}

        {/* Step Code Snippet if present */}
        {currentHint.codeSnippet && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-3 w-3 text-emerald-400" />
                Step Implementation Snippet
              </span>
              <button
                onClick={() => copySnippet(currentHint.codeSnippet)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {currentHint.codeSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Stepper Navigation Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevStep}
            disabled={activeStep === 1}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous Step</span>
          </button>

          {activeStep < totalSteps ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <span>Next Hint (Step {activeStep + 1})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setShowFullAnswer(!showFullAnswer)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{showFullAnswer ? 'Hide Full Answer' : 'Show Complete Solution'}</span>
            </button>
          )}
        </div>

        {/* Secondary: Unlock Full Solution at any time */}
        <div className="flex items-center gap-2">
          {!showFullAnswer ? (
            <button
              onClick={() => {
                setShowFullAnswer(true);
                setUnlockedStep(totalSteps);
                setActiveStep(totalSteps);
                toast('Full model answer revealed');
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <Unlock className="h-3 w-3" />
              <span>Reveal Full Answer Directly</span>
            </button>
          ) : (
            <button
              onClick={() => setShowFullAnswer(false)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Lock className="h-3 w-3" />
              <span>Conceal Full Answer</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Answer Disclosure (Only shown once user unlocks it) */}
      {showFullAnswer && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 mt-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Complete Model Answer &amp; Architecture Rationale
              </h5>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Verified Optimal
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 leading-relaxed whitespace-pre-line shadow-2xs font-medium">
            {question.modelAnswer || 'Complete solution logic provided in step guidance.'}
          </div>

          {/* Reference Solution Code if Coding Question */}
          {question.solutionCode && (
            <div className="space-y-1.5">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Reference Implementation:</p>
              <pre className="rounded-xl bg-slate-950 text-emerald-400 p-3.5 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                {question.solutionCode}
              </pre>
            </div>
          )}

          {/* Key Points */}
          {question.keyPoints && question.keyPoints.length > 0 && (
            <div className="space-y-1.5">
              <h6 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">What Interviewers Look For:</h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.keyPoints.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-slate-700 shadow-2xs">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {question.followUps && question.followUps.length > 0 && (
            <div className="space-y-1.5">
              <h6 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Likely Follow-up Inquiries:</h6>
              <ul className="space-y-1 pl-4 list-disc text-slate-600">
                {question.followUps.map((fu, fIdx) => (
                  <li key={fIdx}>{fu}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ─── Main Practice Page ──────────────────────────────────────────────────
 */
export default function Practice() {
  const { user } = useAuth();

  // State: Matched jobs & selections
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(true);

  // State: Questions
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);
  const [activeTab, setActiveTab] = useState('qa'); // 'qa' | 'compiler' | 'skillgaps'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Progressive Hint disclosure tracking: questionId -> boolean (whether hint drawer is open)
  const [openedHints, setOpenedHints] = useState({});
  const [editingNotes, setEditingNotes] = useState({});

  // State: Text to speech
  const [speakingId, setSpeakingId] = useState(null);

  // State: Online Compiler / Sandbox
  const [activeProblem, setActiveProblem] = useState(null);
  const [compilerLanguage, setCompilerLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [compilerOutputTab, setCompilerOutputTab] = useState('tests'); // 'tests' | 'console'
  const [showCompilerHints, setShowCompilerHints] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Stats state
  const [practiceStats, setPracticeStats] = useState(null);

  /* ─── 1. Fetch Matched Jobs ─────────────────────────────────────── */
  const fetchMatchedJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await practiceService.getMatchedJobs();
      const jobs = res.matchedJobs || [];
      setMatchedJobs(jobs);
      setResumes(res.resumes || []);

      if (jobs.length > 0) {
        const topJob = jobs[0];
        setSelectedJob(topJob);
        setSelectedResumeId(topJob.resumeId || res.primaryResume?._id || '');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load matched jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchedJobs();
    fetchStats();
  }, [fetchMatchedJobs]);

  const fetchStats = async () => {
    try {
      const res = await practiceService.getStats();
      setPracticeStats(res.stats);
    } catch (_) {}
  };

  /* ─── 2. Fetch or Generate Questions for Selected Job ───────────── */
  const loadQuestions = useCallback(async (job, resumeId, forceRefresh = false) => {
    if (!job?._id) return;
    setLoadingQuestions(true);
    try {
      const res = await practiceService.generateQuestions({
        jobId: job._id,
        resumeId: resumeId || job.resumeId,
        refresh: forceRefresh,
      });
      const qList = res.questions || [];
      setQuestions(qList);
      setReadinessScore(res.readinessScore || 0);

      // Auto-load first coding question into the compiler
      const firstCoding = qList.find(q => q.category === 'coding');
      if (firstCoding) {
        setupCompilerProblem(firstCoding, compilerLanguage);
      }

      if (forceRefresh) {
        toast.success(`Generated ${qList.length} interview questions tailored to ${job.companyName}!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate interview questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [compilerLanguage]);

  useEffect(() => {
    if (selectedJob) {
      loadQuestions(selectedJob, selectedResumeId, false);
    }
  }, [selectedJob, selectedResumeId, loadQuestions]);

  /* ─── 3. Question Card Helpers ───────────────────────────────────── */
  const toggleHintDrawer = (id) => {
    setOpenedHints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateStatus = async (qId, status) => {
    try {
      const res = await practiceService.updateQuestion(qId, {
        jobId: selectedJob._id,
        resumeId: selectedResumeId,
        userStatus: status,
      });
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, userStatus: status } : q));
      if (res.readinessScore !== undefined) setReadinessScore(res.readinessScore);
      toast.success(status === 'mastered' ? 'Marked as Mastered! 🏆' : 'Status updated');
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleSaveNotes = async (qId, notes) => {
    try {
      await practiceService.updateQuestion(qId, {
        jobId: selectedJob._id,
        resumeId: selectedResumeId,
        userNotes: notes,
      });
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, userNotes: notes } : q));
      setEditingNotes(prev => ({ ...prev, [qId]: false }));
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    }
  };

  /* ─── 4. Audio Text-to-Speech (Interviewer Simulation) ───────────── */
  const speakQuestion = (q) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech not supported in this browser');
      return;
    }

    if (speakingId === q.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${q.title}. ${q.question}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(q.id);
    window.speechSynthesis.speak(utterance);
  };

  /* ─── 5. Online Compiler Setup & Polyglot Language Switching ─────── */
  const setupCompilerProblem = (problem, language = compilerLanguage) => {
    setActiveProblem(problem);
    setExecutionResult(null);
    setShowCompilerHints(false);

    const starter = getStarterCodeForLanguage(problem, language);
    setCode(starter);
  };

  const handleLanguageChange = (lang) => {
    setCompilerLanguage(lang);
    if (activeProblem) {
      const starter = getStarterCodeForLanguage(activeProblem, lang);
      setCode(starter);
    }
    const opt = LANGUAGE_OPTIONS.find(l => l.id === lang);
    toast.success(`Language changed to ${opt?.label || lang.toUpperCase()}`);
  };

  const openInCompiler = (problem) => {
    setupCompilerProblem(problem, compilerLanguage);
    setActiveTab('compiler');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const res = await practiceService.executeCode({
        language: compilerLanguage,
        code,
        testCases: activeProblem?.testCases || [],
      });
      setExecutionResult(res);
      setCompilerOutputTab(res.testResults?.length ? 'tests' : 'console');

      if (res.allPassed) {
        toast.success('All test cases passed! Great job! 🎉');
        if (activeProblem?.id) {
          handleUpdateStatus(activeProblem.id, 'mastered');
        }
      } else if (res.stderr) {
        toast.error('Execution encountered errors');
      } else {
        toast('Code ran successfully. Check outputs below.');
      }
    } catch (err) {
      toast.error(err.message || 'Execution error');
      setExecutionResult({
        success: false,
        stdout: '',
        stderr: err.message,
        executionTimeMs: 0,
        testResults: [],
      });
      setCompilerOutputTab('console');
    } finally {
      setExecuting(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetStarterCode = () => {
    if (activeProblem) {
      const starter = getStarterCodeForLanguage(activeProblem, compilerLanguage);
      setCode(starter);
      setExecutionResult(null);
      toast('Reset to starter code');
    }
  };

  /* ─── 6. Filtering ───────────────────────────────────────────────── */
  const filteredQuestions = questions.filter(q => {
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = q.title?.toLowerCase().includes(query);
      const matchQ = q.question?.toLowerCase().includes(query);
      const matchSkill = q.targetSkill?.toLowerCase().includes(query);
      if (!matchTitle && !matchQ && !matchSkill) return false;
    }
    return true;
  });

  const codingQuestions = questions.filter(q => q.category === 'coding');
  const skillGapQuestions = questions.filter(q => q.category === 'skill_gap');

  const currentLangOption = LANGUAGE_OPTIONS.find(l => l.id === compilerLanguage) || LANGUAGE_OPTIONS[0];

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Hero Header & Readiness Banner ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-400/30">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>AI Interview Simulator &amp; Polyglot Code Compiler</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Targeted Interview &amp; Coding Practice
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every interview question and coding challenge is generated in real-time by analyzing your{' '}
              <strong className="text-indigo-200">uploaded resume</strong> against the specific requirements and tech stack of your{' '}
              <strong className="text-indigo-200">matched job descriptions</strong>.
            </p>
          </div>

          {/* Readiness Score Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 backdrop-blur-md shadow-inner">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 font-black text-xl text-white shadow-lg">
              <span>{readinessScore}%</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Readiness</p>
              <p className="text-sm font-black text-white">
                {readinessScore >= 80 ? 'Interview Ready! 🚀' : readinessScore >= 40 ? 'Good Progress 👍' : 'Needs Practice 📚'}
              </p>
              <p className="text-[11px] text-slate-400">
                {questions.filter(q => q.userStatus === 'mastered').length} of {questions.length} questions mastered
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top Job & Resume Selector ───────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Select Matched Job to Practice</h2>
              <p className="text-xs text-slate-500">Pick any of your {matchedJobs.length} matched jobs to load customized questions &amp; coding challenges</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedJob && (
              <button
                onClick={() => loadQuestions(selectedJob, selectedResumeId, true)}
                disabled={loadingQuestions}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingQuestions ? 'animate-spin' : ''}`} />
                <span>{loadingQuestions ? 'Generating…' : 'Regenerate Questions'}</span>
              </button>
            )}
          </div>
        </div>

        {loadingJobs ? (
          <div className="flex items-center justify-center p-8 gap-3 text-slate-500 text-xs">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
            <span>Loading matched jobs from your workspace…</span>
          </div>
        ) : matchedJobs.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p>No matched jobs found yet. Upload a resume and match jobs in the Jobs tab to unlock personalized practice questions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Job Select Dropdown */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Role &amp; Company</label>
              <select
                value={selectedJob?._id || ''}
                onChange={(e) => {
                  const job = matchedJobs.find(j => j._id === e.target.value);
                  if (job) setSelectedJob(job);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {matchedJobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.matchScore}% Match · {j.jobTitle} at {j.companyName} ({j.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Resume Select Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Evaluated Resume</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.resumeName || r.originalFileName} {r.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Selected Job Card Overview */}
        {selectedJob && (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-900 text-sm">{selectedJob.jobTitle}</span>
                <span className="font-semibold text-slate-600">at {selectedJob.companyName}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {selectedJob.matchScore}% ATS Match
                </span>
                <span className="text-slate-400">· {selectedJob.location}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Key Tech Stack:</span>
                {(selectedJob.skills || []).slice(0, 7).map((s, idx) => (
                  <span key={idx} className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                    {s}
                  </span>
                ))}
                {selectedJob.missingSkills?.length > 0 && (
                  <span className="rounded-md bg-amber-100 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    {selectedJob.missingSkills.length} skill gaps identified
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('compiler')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                <span>Compiler Sandbox</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Tabs Navigation ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              activeTab === 'qa'
                ? 'bg-indigo-600 text-white shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Interview Questions &amp; Answers</span>
            <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === 'qa' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {questions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('compiler')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              activeTab === 'compiler'
                ? 'bg-slate-900 text-white shadow-slate-300'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Code2 className="h-4 w-4 text-emerald-400" />
            <span>Online Code Compiler &amp; Sandbox</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
              {codingQuestions.length} Problems
            </span>
          </button>

          {skillGapQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('skillgaps')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                activeTab === 'skillgaps'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Skill Gap Training</span>
              <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                {skillGapQuestions.length}
              </span>
            </button>
          )}
        </div>

        {/* Global question search */}
        {activeTab === 'qa' && (
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, skill, title…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ─── TAB 1: INTERVIEW QUESTIONS & ANSWERS ─────────────────────── */}
      {activeTab === 'qa' && (
        <div className="space-y-4">
          {/* Sub-filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'technical', label: 'Core Technical' },
                { id: 'coding', label: 'Coding Challenges' },
                { id: 'system_design', label: 'System Design' },
                { id: 'behavioral', label: 'Behavioral (STAR)' },
                { id: 'skill_gap', label: 'Skill Gaps' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Questions List */}
          {loadingQuestions ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 gap-3">
              <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="font-bold text-slate-800 text-sm">Analyzing Job Description &amp; Candidate Resume…</p>
              <p className="text-xs text-slate-400 max-w-sm text-center">Synthesizing tailored technical questions, architectural deep-dives, and coding problems.</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs space-y-2">
              <p className="font-semibold text-slate-600 text-sm">No questions match your current filter.</p>
              <p>Try switching categories or clearing your search term.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const isHintOpen = openedHints[q.id];
                const isEditingThisNote = editingNotes[q.id];

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-sm ${
                      q.userStatus === 'mastered'
                        ? 'border-emerald-200 ring-1 ring-emerald-100'
                        : q.userStatus === 'practicing'
                        ? 'border-indigo-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Question Card Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>

                          {/* Category Badge */}
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            q.category === 'coding' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            q.category === 'system_design' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                            q.category === 'behavioral' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            q.category === 'skill_gap' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}>
                            {q.category.replace('_', ' ')}
                          </span>

                          {/* Difficulty Badge */}
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                            q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {q.difficulty}
                          </span>

                          {/* Target Skill */}
                          <span className="text-slate-500 font-medium text-xs">
                            🎯 {q.targetSkill}
                          </span>
                        </div>

                        {/* Status & Quick Actions */}
                        <div className="flex items-center gap-1.5">
                          {/* Audio read button */}
                          <button
                            onClick={() => speakQuestion(q)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              speakingId === q.id
                                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                            title={speakingId === q.id ? "Stop voice audio" : "Listen to question voice simulated"}
                          >
                            {speakingId === q.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>

                          {/* Open in code compiler if coding question */}
                          {q.category === 'coding' && (
                            <button
                              onClick={() => openInCompiler(q)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white transition-colors shadow-xs"
                              title="Load this problem into the Interactive Code Sandbox"
                            >
                              <Code2 className="h-3 w-3" />
                              <span>Code in Compiler</span>
                            </button>
                          )}

                          {/* Status toggle */}
                          <select
                            value={q.userStatus || 'unattempted'}
                            onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-bold focus:outline-none ${
                              q.userStatus === 'mastered' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                              q.userStatus === 'practicing' ? 'bg-indigo-50 border-indigo-300 text-indigo-800' :
                              'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="unattempted">Unattempted</option>
                            <option value="practicing">Practicing 👍</option>
                            <option value="mastered">Mastered 🏆</option>
                          </select>
                        </div>
                      </div>

                      {/* Question Title & Prompt */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                        <p className="mt-1.5 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                          {q.question}
                        </p>
                      </div>

                      {/* ─── STEP-BY-STEP HINT ACTION BUTTON (NO DIRECT ANSWER SPOILER) ─── */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                        <button
                          onClick={() => toggleHintDrawer(q.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-xl border ${
                            isHintOpen
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                              : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <Lightbulb className={`h-4 w-4 ${isHintOpen ? 'text-amber-500 fill-amber-500' : 'text-indigo-600'}`} />
                          <span>{isHintOpen ? 'Hide Step-by-Step Hint' : '💡 Get Hint (Step-by-Step Guidance)'}</span>
                          {isHintOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => setEditingNotes(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                          {q.userNotes ? '📝 Edit Notes' : '+ Add Notes'}
                        </button>
                      </div>
                    </div>

                    {/* Personal Notes Box */}
                    {isEditingThisNote && (
                      <div className="bg-amber-50/50 border-t border-amber-200 p-4 space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Your Practice Notes &amp; Talking Points</label>
                        <textarea
                          defaultValue={q.userNotes || ''}
                          id={`notes_${q.id}`}
                          rows={3}
                          placeholder="Draft your own response or bullet points for this question…"
                          className="w-full rounded-xl border border-amber-300 bg-white p-3 text-xs focus:border-amber-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNotes(prev => ({ ...prev, [q.id]: false }))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const val = document.getElementById(`notes_${q.id}`)?.value;
                              handleSaveNotes(q.id, val);
                            }}
                            className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-1 text-xs font-bold text-white"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show saved note badge if note exists and not editing */}
                    {!isEditingThisNote && q.userNotes && (
                      <div className="bg-amber-50/60 border-t border-amber-100 px-5 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                        <span className="font-bold shrink-0">📝 Note:</span>
                        <p className="italic text-amber-800">{q.userNotes}</p>
                      </div>
                    )}

                    {/* ─── STEP-BY-STEP PROGRESSIVE HINT DISCLOSURE ─────────── */}
                    {isHintOpen && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50/70">
                        <ProgressiveHintViewer question={q} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: ONLINE COMPILER & CODING SANDBOX ─────────────────── */}
      {activeTab === 'compiler' && (
        <div className="space-y-5">
          {/* Compiler Problem Selector & Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Interactive Polyglot Code Compiler &amp; Sandbox</p>
                <p className="text-slate-500">Live multi-language compiler running against automated test suites</p>
              </div>
            </div>

            {/* Problem selector dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Problem:</span>
                <select
                  value={activeProblem?.id || ''}
                  onChange={(e) => {
                    const prob = codingQuestions.find(q => q.id === e.target.value);
                    if (prob) setupCompilerProblem(prob, compilerLanguage);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {codingQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── USER CAN CHANGE TO ANY PROGRAMMING LANGUAGE ────────────── */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Language:</span>
                <select
                  value={compilerLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-black text-indigo-900 focus:outline-none cursor-pointer hover:bg-indigo-100 transition-colors shadow-2xs"
                >
                  {LANGUAGE_OPTIONS.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.icon} {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Language Switcher Bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] px-2">Popular Languages:</span>
            {LANGUAGE_OPTIONS.map(l => (
              <button
                key={l.id}
                onClick={() => handleLanguageChange(l.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  compilerLanguage === l.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{l.icon}</span>
                <span>{l.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Compiler Main Workspace (Split View) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Problem Details & Code Editor (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Problem Description Card */}
              {activeProblem && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        activeProblem.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800' :
                        activeProblem.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {activeProblem.difficulty}
                      </span>
                      <span className="font-bold text-slate-700">{activeProblem.targetSkill}</span>
                    </div>

                    {/* Step-by-Step Hint Toggle Button (No Answer Dump) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCompilerHints(!showCompilerHints)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-colors border ${
                          showCompilerHints
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                        <span>{showCompilerHints ? 'Hide Hints' : '💡 Step-by-Step Hint'}</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-black text-slate-900 text-base">{activeProblem.title}</h3>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                    {activeProblem.question}
                  </p>

                  {/* ─── STEP-BY-STEP HINT SECTION IN COMPILER VIEW ─────── */}
                  {showCompilerHints && (
                    <div className="pt-2">
                      <ProgressiveHintViewer question={activeProblem} isCompilerView={true} />
                    </div>
                  )}
                </div>
              )}

              {/* Code Editor Container */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl text-xs">
                {/* Editor Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="font-mono text-xs font-bold text-slate-400 ml-2">
                      solution.{currentLangOption.ext}
                    </span>
                    <span className="rounded-md bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[10px] font-semibold text-slate-400">
                      {currentLangOption.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetStarterCode}
                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Reset to original starter code"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={copyCodeToClipboard}
                      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy code"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Editor Input Textarea */}
                <div className="relative">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={16}
                    spellCheck="false"
                    className="w-full bg-slate-950 text-emerald-300 font-mono text-xs p-4 leading-relaxed focus:outline-none resize-y selection:bg-indigo-900 selection:text-white"
                    placeholder={`// Write your ${currentLangOption.label} solution here...`}
                  />
                </div>

                {/* Editor Action Footer */}
                <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Target: <strong>solution()</strong></span>
                    <span>·</span>
                    <span>Language: <strong className="text-indigo-400">{currentLangOption.label}</strong></span>
                  </div>

                  <button
                    onClick={handleRunCode}
                    disabled={executing}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-5 py-2 font-black text-white text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className={`h-4 w-4 fill-white ${executing ? 'animate-spin' : ''}`} />
                    <span>{executing ? 'Executing Code…' : 'Run Code & Tests'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Test Results & Terminal Output (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col min-h-[480px]">
                {/* Output Tabs Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCompilerOutputTab('tests')}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                        compilerOutputTab === 'tests'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Test Cases ({executionResult?.testResults?.length || activeProblem?.testCases?.length || 0})
                    </button>
                    <button
                      onClick={() => setCompilerOutputTab('console')}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                        compilerOutputTab === 'console'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Terminal Output
                    </button>
                  </div>

                  {executionResult?.executionTimeMs !== undefined && (
                    <span className="font-mono text-[10px] text-slate-500">
                      ⚡ {executionResult.executionTimeMs}ms
                    </span>
                  )}
                </div>

                {/* Output Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {/* Test Cases View */}
                  {compilerOutputTab === 'tests' && (
                    <div className="space-y-3">
                      {/* Overall Pass/Fail status banner */}
                      {executionResult && (
                        <div className={`rounded-xl p-3.5 flex items-center justify-between border ${
                          executionResult.allPassed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <div className="flex items-center gap-2">
                            {executionResult.allPassed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-rose-600" />
                            )}
                            <div>
                              <p className="font-black text-xs">
                                {executionResult.allPassed
                                  ? 'All Test Cases Passed! 🎉'
                                  : 'Tests Failed — Review Outputs Below'}
                              </p>
                              <p className="text-[10px] opacity-80">
                                {executionResult.testResults?.filter(t => t.passed).length} of {executionResult.testResults?.length} tests passed
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Individual Test Cards */}
                      {((executionResult?.testResults?.length ? executionResult.testResults : activeProblem?.testCases) || []).map((tc, idx) => {
                        const hasRun = tc.passed !== undefined;
                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border p-3.5 space-y-2 font-mono text-[11px] transition-colors ${
                              hasRun
                                ? tc.passed
                                  ? 'border-emerald-200 bg-emerald-50/40'
                                  : 'border-rose-200 bg-rose-50/40'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-700">Test Case #{idx + 1} {tc.description ? `(${tc.description})` : ''}</span>
                              {hasRun && (
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full font-bold ${
                                  tc.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {tc.passed ? 'PASSED' : 'FAILED'}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-slate-600">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 w-16 shrink-0">Input:</span>
                                <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 break-all">{tc.input || 'None'}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 w-16 shrink-0">Expected:</span>
                                <span className="text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 break-all">{tc.expectedOutput || tc.expected}</span>
                              </div>
                              {hasRun && (
                                <div className="flex items-start gap-2">
                                  <span className="text-slate-400 w-16 shrink-0">Output:</span>
                                  <span className={`px-2 py-0.5 rounded border break-all font-bold ${
                                    tc.passed ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-rose-700 border-rose-200'
                                  }`}>
                                    {tc.actual}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Terminal Console View */}
                  {compilerOutputTab === 'console' && (
                    <div className="rounded-xl bg-slate-950 text-slate-300 p-4 font-mono text-xs min-h-[300px] overflow-x-auto shadow-inner space-y-2">
                      <div className="text-slate-500 border-b border-slate-800 pb-1 text-[10px]">
                        $ run {compilerLanguage} solution.{currentLangOption.ext}
                      </div>

                      {executionResult?.stdout && (
                        <div className="text-emerald-400 whitespace-pre-wrap">
                          {executionResult.stdout}
                        </div>
                      )}

                      {executionResult?.result && (
                        <div className="text-indigo-300">
                          <span className="text-slate-500">Return value: </span>{executionResult.result}
                        </div>
                      )}

                      {executionResult?.stderr && (
                        <div className="text-rose-400 whitespace-pre-wrap">
                          {executionResult.stderr}
                        </div>
                      )}

                      {!executionResult && (
                        <p className="text-slate-600 italic">Click "Run Code &amp; Tests" to view execution logs, stdout, and error traces.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SKILL GAP TRAINING ────────────────────────────────── */}
      {activeTab === 'skillgaps' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Targeted Skill Gap Trainer</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              These questions specifically target the technologies requested in the <strong>{selectedJob?.jobTitle}</strong> job description that were not prominently found on your resume. Master these talking points to confidently answer interviewers when asked about unfamiliar tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillGapQuestions.map((q, idx) => (
              <div key={q.id} className="rounded-2xl border border-amber-200 bg-white p-5 space-y-3 shadow-sm text-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                    Missing Skill: {q.targetSkill}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{q.question}</p>

                {/* Step-by-Step Hint Disclosure for Skill Gaps */}
                <ProgressiveHintViewer question={q} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
