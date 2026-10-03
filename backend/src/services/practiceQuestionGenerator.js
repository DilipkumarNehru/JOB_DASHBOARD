import { generateCompletion } from '../integrations/openai/llmClient.js';

/**
 * Universal starter code templates generator for all major programming languages.
 */
export const generateLanguageTemplates = ({
  funcName = 'solution',
  params = 'nums, target',
  returnType = 'int[]',
  jsParams = 'nums, target',
  pyParams = 'nums, target',
  javaParams = 'int[] nums, int target',
  cppParams = 'vector<int>& nums, int target',
  goParams = 'nums []int, target int',
  rustParams = 'nums: Vec<i32>, target: i32',
  phpParams = '$nums, $target',
  rubyParams = 'nums, target',
  sqlQuery = 'SELECT id, name FROM users WHERE active = 1;'
}) => {
  return {
    javascript: `function ${funcName}(${jsParams}) {\n  // Step 1: Initialize your data structures\n  // Step 2: Implement core algorithm\n  // Step 3: Return result\n}`,
    python: `def ${funcName}(${pyParams}):\n    # Step 1: Initialize variables / dict\n    # Step 2: Traverse and evaluate condition\n    # Step 3: Return result\n    pass`,
    typescript: `function ${funcName}(${jsParams}): any {\n  // Type-safe implementation\n  return null;\n}`,
    java: `import java.util.*;\n\npublic class Solution {\n    public ${returnType} ${funcName}(${javaParams}) {\n        // Step 1: Initialize data structure\n        // Step 2: Implement logic\n        return null;\n    }\n    public static void main(String[] args) {\n        System.out.println("Java Solution ready for execution");\n    }\n}`,
    cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${funcName}(${cppParams}) {\n        // Implement optimal C++ solution\n        return {};\n    }\n};`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* ${funcName}(int* nums, int numsSize, int target, int* returnSize) {\n    // Allocate return buffer and implement logic\n    *returnSize = 0;\n    return NULL;\n}`,
    csharp: `using System;\nusing System.Collections.Generic;\n\npublic class Solution {\n    public int[] ${funcName}(int[] nums, int target) {\n        // C# implementation\n        return new int[0];\n    }\n}`,
    go: `package main\n\nimport "fmt"\n\nfunc ${funcName}(${goParams}) []int {\n    // Go implementation\n    return []int{}\n}`,
    rust: `impl Solution {\n    pub fn ${funcName}(${rustParams}) -> Vec<i32> {\n        // Rust idiomatic implementation\n        vec![]\n    }\n}`,
    php: `<?php\nfunction ${funcName}(${phpParams}) {\n    // PHP implementation\n    return [];\n}`,
    ruby: `def ${funcName}(${rubyParams})\n  # Ruby implementation\n  []\nend`,
    sql: `-- Write your SQL query here\n${sqlQuery}`,
  };
};

/**
 * Ensures every question has a step-by-step hint progression explaining "why" each step is chosen.
 */
export const buildProgressiveHints = (q) => {
  if (Array.isArray(q.hints) && q.hints.length >= 3) {
    return q.hints;
  }

  if (q.category === 'coding') {
    return [
      {
        stepNumber: 1,
        stepTitle: 'Step 1: Understand the Problem & Detect Edge Cases',
        content: `Examine the input constraints. What if inputs are empty, negative, or duplicated? Does the array fit entirely in memory?\n\nKey Rule: Before writing code, state the brute-force time complexity (usually O(N²)) and your target optimized complexity (usually O(N)).`,
        whyThisStep: 'Why this step: Interviewers evaluate whether you rush into coding or methodically identify edge cases and boundary conditions first.',
        codeSnippet: `// Step 1 check:\nif (!nums || nums.length < 2) return [];`,
      },
      {
        stepNumber: 2,
        stepTitle: 'Step 2: Choose Optimal Data Structure & Pattern',
        content: `Instead of repeatedly rescanning the array, pick a data structure that offers O(1) lookups (like a Hash Map / Set) or pointers that eliminate subproblems.\n\nPattern Chosen: ${q.targetSkill || 'Hash Map / Two Pointers'}.`,
        whyThisStep: 'Why this step: Choosing the correct data structure is the single highest-impact decision in coding interviews; it directly drops runtime from quadratic to linear time.',
        codeSnippet: `// In JavaScript: const map = new Map();\n# In Python: seen = {}\n// In Java: Map<Integer, Integer> map = new HashMap<>();`,
      },
      {
        stepNumber: 3,
        stepTitle: 'Step 3: Algorithmic Logic & Transition State',
        content: `Iterate through elements sequentially. At each index, compute the missing target state (e.g. \`target - current\`). If this complement has already been recorded in your storage, you have found the answer! Otherwise record the current element and continue.`,
        whyThisStep: 'Why this step: Expressing logic in clear algorithmic steps prevents off-by-one errors and ensures you do not use the same element twice.',
        codeSnippet: `const complement = target - nums[i];\nif (map.has(complement)) {\n  return [map.get(complement), i];\n}\nmap.set(nums[i], i);`,
      },
      {
        stepNumber: 4,
        stepTitle: 'Step 4: Final Solution, Complexity Analysis & Clean Return',
        content: `Wrap your solution cleanly, handle empty fallbacks, and formally state Big-O.\n\n- Time Complexity: O(N) single pass\n- Space Complexity: O(N) auxiliary space in worst case.`,
        whyThisStep: 'Why this step: Top interviewers always request formal Big-O proofs before moving on to follow-up questions.',
        codeSnippet: q.solutionCode || '',
      },
    ];
  }

  if (q.category === 'system_design') {
    return [
      {
        stepNumber: 1,
        stepTitle: 'Step 1: Functional & Non-Functional Requirements',
        content: `Clarify read vs write ratios, latency SLA (e.g. p99 < 50ms), and scale (e.g. 100M Daily Active Users, 10,000 requests/sec).`,
        whyThisStep: 'Why this step: Designing without establishing throughput numbers and consistency requirements leads to over-engineering or architectural failure.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Step 2: High-Level Architecture & Component Selection',
        content: `Draw the request flow: Client -> DNS / CDN -> API Gateway -> Load Balancer -> Stateless App Services -> Cache Layer (Redis) -> Distributed Database (Postgres / Mongo).`,
        whyThisStep: 'Why this step: Demonstrates broad architectural breadth before diving into individual bottlenecks.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Step 3: Deep-Dive into the Core Bottleneck',
        content: q.modelAnswer ? q.modelAnswer.substring(0, 300) + '…' : 'Focus on distributed synchronization, cache invalidation, and data partitioning.',
        whyThisStep: 'Why this step: Senior and staff-level engineering bar raisers look for deep-dive technical insights rather than generic textbook diagrams.',
      },
      {
        stepNumber: 4,
        stepTitle: 'Step 4: Resiliency, Failovers & Scalability Trade-offs',
        content: 'Discuss circuit breakers, fail-open vs fail-closed strategies, replication lag, and multi-region failover.',
        whyThisStep: 'Why this step: Shows that you build production-ready systems that can survive outages and hardware degradations.',
      },
    ];
  }

  // General Technical & Behavioral Questions
  return [
    {
      stepNumber: 1,
      stepTitle: 'Step 1: Core Concept Definition & High-Level Summary',
      content: 'Give a 30-second elevator pitch defining the technology or scenario concisely before diving into details.',
      whyThisStep: 'Why this step: Immediate clarity prevents rambling and shows strong executive communication skills.',
    },
    {
      stepNumber: 2,
      stepTitle: 'Step 2: Deep-Dive Mechanisms & Inner Workings',
      content: q.modelAnswer ? q.modelAnswer.substring(0, 350) + '…' : 'Explain internal operational details, memory management, and lifecycle events.',
      whyThisStep: 'Why this step: Demonstrates genuine hands-on mastery rather than surface-level tutorial knowledge.',
    },
    {
      stepNumber: 3,
      stepTitle: 'Step 3: Real-World Production Trade-offs & Pitfalls',
      content: (q.keyPoints && q.keyPoints.length > 0) ? q.keyPoints.join('\n• ') : 'Discuss performance implications, security caveats, and common bugs.',
      whyThisStep: 'Why this step: Discussing real trade-offs and edge cases proves you have solved production-grade problems.',
    },
    {
      stepNumber: 4,
      stepTitle: 'Step 4: Connecting Back to the Target Role & Full Model Answer',
      content: q.modelAnswer || '',
      whyThisStep: 'Why this step: Ties the answer directly to the hiring team\'s business needs and day-to-day stack.',
    },
  ];
};

/**
 * Intelligent algorithmic fallback questions generator based on tech stack, JD, and resume.
 */
const generateAlgorithmicQuestions = (job, resume) => {
  const jobTitle = job.jobTitle || 'Software Engineer';
  const company = job.companyName || 'Company';
  const jobSkills = [...(job.skills || []), ...(job.requiredSkills || [])];
  const resumeSkills = resume?.parsedProfile?.skills || [];
  const missingSkills = (job.missingSkills && job.missingSkills.length > 0)
    ? job.missingSkills
    : jobSkills.filter(s => !resumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));

  const questions = [];
  let counter = 1;
  const genId = () => `q_${Date.now()}_${counter++}_${Math.random().toString(36).substring(7)}`;

  // 1. CODING PROBLEM 1: Two Sum / Hash Map Lookup
  const q1 = {
    id: genId(),
    title: 'Two Sum Target Finder (Hash Map Optimization)',
    category: 'coding',
    difficulty: 'Easy',
    targetSkill: jobSkills.includes('JavaScript') || jobSkills.includes('Node.js') ? 'Data Structures / Hash Map' : 'Algorithms',
    question: `Write an efficient function \`solution(nums, target)\` that takes an array of integers \`nums\` and an integer \`target\`, and returns the indices of the two numbers such that they add up to target.\n\nAssume each input has exactly one solution, and you may not use the same element twice. Aim for O(n) time complexity.`,
    modelAnswer: `Use a Hash Map (or JavaScript Map/Object, Python dict, Java HashMap) to store numbers seen so far and their indices. For each element num at index i, calculate complement = target - num. If complement exists in map, return [map[complement], i]. Otherwise, store num: i. This achieves O(n) time and O(n) space complexity instead of the brute force O(n^2).`,
    keyPoints: [
      'Avoid brute-force nested loops (O(n^2))',
      'Use Hash Map for O(1) average lookup time',
      'Handle negative numbers and zeros properly',
      'Ensure memory complexity is O(n)'
    ],
    followUps: [
      'How would your solution change if the input array is already sorted? (Two-pointer technique in O(1) space)',
      'What if duplicate numbers can form multiple distinct valid pairs?'
    ],
    starterCode: generateLanguageTemplates({
      funcName: 'solution',
      jsParams: 'nums, target',
      pyParams: 'nums, target',
      javaParams: 'int[] nums, int target',
      cppParams: 'vector<int>& nums, int target',
      returnType: 'int[]',
    }),
    solutionCode: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0,1]', description: 'Basic test case: 2 + 7 = 9' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1,2]', description: 'Indices not at start: 2 + 4 = 6' },
      { input: '[3, 3], 6', expectedOutput: '[0,1]', description: 'Identical numbers: 3 + 3 = 6' },
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q1.hints = buildProgressiveHints(q1);
  questions.push(q1);

  // 2. CODING PROBLEM 2: Valid Palindrome (Pointers)
  const q2 = {
    id: genId(),
    title: 'Valid Palindrome After Alphanumeric Cleaning',
    category: 'coding',
    difficulty: 'Easy',
    targetSkill: 'String Manipulation & Pointers',
    question: `Write a function \`solution(s)\` that returns \`true\` if string \`s\` is a palindrome after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, and \`false\` otherwise.`,
    modelAnswer: `Normalize the string by stripping non-alphanumeric characters and converting to lowercase. Use a two-pointer approach (left pointer starting at index 0, right pointer at string length - 1) checking if characters match until the pointers cross. Runs in O(n) time and O(1) extra space.`,
    keyPoints: [
      'Two pointer technique avoids allocating unnecessary reverse copies',
      'Handle spaces, punctuation, symbols, and mixed casing cleanly',
      'Empty string or single character strings are valid palindromes'
    ],
    followUps: [
      'How would you handle Unicode or multi-byte characters?',
      'Can you check the palindrome condition without allocating any new string at all?'
    ],
    starterCode: generateLanguageTemplates({
      funcName: 'solution',
      jsParams: 's',
      pyParams: 's',
      javaParams: 'String s',
      cppParams: 'string s',
      returnType: 'boolean',
    }),
    solutionCode: `function solution(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}`,
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', description: 'Famous Panama palindrome phrase' },
      { input: '"race a car"', expectedOutput: 'false', description: 'Not a palindrome' },
      { input: '" "', expectedOutput: 'true', description: 'Empty/whitespace string is palindrome' },
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q2.hints = buildProgressiveHints(q2);
  questions.push(q2);

  // 3. CODING PROBLEM 3: Sliding Window Rate Limiter
  const q3 = {
    id: genId(),
    title: 'Sliding Window Request Counter & Rate Limiter',
    category: 'coding',
    difficulty: 'Medium',
    targetSkill: 'Sliding Window / Queue Algorithms',
    question: `Write a function \`solution(calls, windowMs, maxCalls)\` that receives an array of request timestamps in milliseconds, a sliding window duration \`windowMs\`, and a maximum allowed requests \`maxCalls\`. Return the count of requests that would be allowed under sliding-window rate limiting.`,
    modelAnswer: `Maintain a sliding window queue of accepted request timestamps. For each incoming request at time T, dequeue all timestamps older than T - windowMs. If queue length < maxCalls, accept request and enqueue T, incrementing allowed count. Otherwise reject request.`,
    keyPoints: [
      'Sliding window queue pattern',
      'O(N) amortized time complexity since each element is enqueued and dequeued at most once',
      'Foundation for API rate limiters in backend services'
    ],
    followUps: [
      'How would you scale this rate limiter across distributed server instances with Redis?',
      'Compare sliding window counter vs token bucket algorithm.'
    ],
    starterCode: generateLanguageTemplates({
      funcName: 'solution',
      jsParams: 'calls, windowMs, maxCalls',
      pyParams: 'calls, windowMs, maxCalls',
      javaParams: 'int[] calls, int windowMs, int maxCalls',
      cppParams: 'vector<int>& calls, int windowMs, int maxCalls',
      returnType: 'int',
    }),
    solutionCode: `function solution(calls, windowMs, maxCalls) {
  const queue = [];
  let count = 0;
  for (const t of calls) {
    while (queue.length > 0 && queue[0] <= t - windowMs) queue.shift();
    if (queue.length < maxCalls) {
      queue.push(t);
      count++;
    }
  }
  return count;
}`,
    testCases: [
      { input: '[100, 200, 300, 400, 1100], 1000, 3', expectedOutput: '4', description: '100,200,300 allowed; 400 rejected; 1100 allowed' },
      { input: '[100, 150, 200, 250], 500, 2', expectedOutput: '2', description: 'Only first 2 calls allowed within 500ms' },
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q3.hints = buildProgressiveHints(q3);
  questions.push(q3);

  // 4. TECHNICAL Q1: Core Backend & API Design
  const q4 = {
    id: genId(),
    title: `Scalable Backend Architecture & Concurrency for ${jobTitle}`,
    category: 'technical',
    difficulty: 'Medium',
    targetSkill: jobSkills.find(s => ['Node.js', 'Express.js', 'Java', 'Python', 'Go'].includes(s)) || 'Backend Architecture',
    question: `In a high-throughput production environment at ${company}, how would you prevent the Node.js / server event loop from blocking when handling CPU-intensive operations (e.g. PDF parsing, image processing, large dataset calculations)?`,
    modelAnswer: `1. **Offload to Worker Threads**: Use Node.js \`worker_threads\` for CPU-bound computations so the main event loop remains free to serve I/O requests.\n2. **Message Queues & Background Workers**: Push intensive jobs onto a queue (Redis BullMQ, RabbitMQ, Kafka) consumed by dedicated worker instances.\n3. **Clustering & Process Managers**: Use Node.js \`cluster\` or PM2 to fork worker processes matching the server's CPU core count.\n4. **Streaming & Chunking**: Use Node.js streams (\`Readable\`, \`Transform\`) rather than buffering massive files into memory at once.\n5. **Microservices / Serverless**: Delegate heavy jobs to dedicated containerized endpoints (AWS Lambda, Google Cloud Run).`,
    keyPoints: [
      'Event loop starvation causes latency spikes and dropped connections',
      'Distinguish between I/O bound (async non-blocking) vs CPU bound (requires threads/workers)',
      'Use streaming APIs to maintain flat memory footprints',
      'Implement health-check alerts monitoring event loop lag (e.g. event-loop-lag metric)'
    ],
    followUps: [
      'How does Node.js libuv thread pool differ from worker threads?',
      'What monitoring tools would you configure in production to track event loop latency?'
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q4.hints = buildProgressiveHints(q4);
  questions.push(q4);

  // 5. TECHNICAL Q2: Database Optimization & Indexing
  const q5 = {
    id: genId(),
    title: 'Database Query Optimization, Indexing, and Concurrency',
    category: 'technical',
    difficulty: 'Hard',
    targetSkill: jobSkills.find(s => ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'].includes(s)) || 'Databases',
    question: `Explain how you would diagnose and resolve slow database queries on high-traffic tables/collections at ${company}. How do compound indexes and execution plans (\`explain()\`) help?`,
    modelAnswer: `1. **Profiling & Slow Query Logs**: Enable MongoDB Profiler (\`profile: 2\`) or Postgres \`pg_stat_statements\` to pinpoint queries exceeding 100ms.\n2. **Explain Plan Analysis**: Run \`.explain("executionStats")\` to verify if the query uses an \`IXSCAN\` (Index Scan) vs catastrophic \`COLLSCAN\` (Full Table Scan). Inspect \`totalDocsExamined\` vs \`totalDocsReturned\`.\n3. **Index Optimization**: Create compound indexes following the **ESR Rule** (Equality, Sort, Range). Ensure fields with high cardinality come first.\n4. **Covered Queries**: Project only indexed fields so the database engine fulfills the query directly from RAM without touching disk documents.\n5. **Connection Pooling & Caching**: Implement Redis caching with TTL for frequently read query results and properly size database connection pool limits.`,
    keyPoints: [
      'Understand ESR Rule (Equality -> Sort -> Range)',
      'Avoid over-indexing which degrades write/insert performance',
      'Differentiate between clustered and non-clustered indexes',
      'Handle N+1 query problem through eager loading or aggregation pipelines'
    ],
    followUps: [
      'What are partial and sparse indexes, and when are they advantageous?',
      'How do you manage database locks and transactions under high concurrency?'
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q5.hints = buildProgressiveHints(q5);
  questions.push(q5);

  // 6. SYSTEM DESIGN: Rate Limiting & Scalability
  const q6 = {
    id: genId(),
    title: `Design a Distributed API Rate Limiter for ${company}`,
    category: 'system_design',
    difficulty: 'Hard',
    targetSkill: 'System Design & Distributed Systems',
    question: `Design an API Rate Limiter that restricts clients to a maximum of 100 requests per minute across 50 distributed microservice instances. Describe the architecture, data store, algorithm, and failure modes.`,
    modelAnswer: `**Architecture Overview:**\n- **Algorithm**: Redis sliding window log or token bucket.\n- **Data Store**: In-memory Redis cluster. Keys are organized as \`ratelimit:{clientId}:{windowTimestamp}\`.\n- **Atomicity**: Use Redis Lua scripts or \`MULTI/EXEC\` pipelines to ensure read-increment-expire operations execute atomically, avoiding race conditions across distributed servers.\n- **Fail-Open Policy**: If Redis becomes unavailable, the rate limiter falls back gracefully to allow requests rather than crashing user traffic, logging alert metrics immediately.\n- **HTTP Response Headers**: Return standard headers \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, and \`Retry-After\` on HTTP 429 Too Many Requests.`,
    keyPoints: [
      'Centralized caching store (Redis) required for distributed consistency',
      'Atomic execution via Lua scripts prevents race conditions',
      'Sliding window vs Token Bucket trade-offs (memory vs burst handling)',
      'Resiliency strategy: Fail-open vs fail-closed'
    ],
    followUps: [
      'How would you handle DDOS attacks attempting to overwhelm the rate limiter itself?',
      'How would you implement tiered rate limits for different subscription plans?'
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q6.hints = buildProgressiveHints(q6);
  questions.push(q6);

  // 7. BEHAVIORAL Q1: Complex Bug / Production Incident (STAR Format)
  const q7 = {
    id: genId(),
    title: 'Production Incident & Incident Management (STAR Format)',
    category: 'behavioral',
    difficulty: 'Medium',
    targetSkill: 'Production Troubleshooting & Communication',
    question: `Tell me about a challenging technical bug or production outage you investigated in your past projects. How did you triage, resolve, and prevent it from recurring?`,
    modelAnswer: `**Structured STAR Response:**\n- **Situation**: In my previous project, we observed a sudden 500 error spike and database connection timeouts during peak traffic hours.\n- **Task**: As the engineer on duty, I needed to identify root cause, restore service availability within SLA, and protect user data.\n- **Action**: I inspected application logs and APM metrics, identified connection pool exhaustion caused by an unindexed query holding connections open, immediately applied a temporary circuit breaker, deployed a targeted compound index patch, and configured automated health alerts.\n- **Result**: Service returned to 100% availability in under 20 minutes, query latency dropped by 85%, and I conducted a blameless post-mortem documenting actionable safeguards.`,
    keyPoints: [
      'Structure strictly using Situation, Task, Action, Result (STAR)',
      'Emphasize composure, systematic debugging, and clear team communication',
      'Highlight long-term prevention (blameless post-mortems, testing, alerts)',
      'Own the outcome and share concrete metrics'
    ],
    followUps: [
      'What would you do differently if the same issue happened today?',
      'How do you handle disagreement with another engineer during an active outage?'
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q7.hints = buildProgressiveHints(q7);
  questions.push(q7);

  // 8. BEHAVIORAL Q2: Role Alignment with Company
  const q8 = {
    id: genId(),
    title: `Why ${company} & How Your Resume Experience Fits`,
    category: 'behavioral',
    difficulty: 'Easy',
    targetSkill: 'Role Alignment & Motivation',
    question: `Why are you interested in this ${jobTitle} role at ${company}, and what from your background makes you a strong technical addition to our team?`,
    modelAnswer: `Connect 3 specific points:\n1. **Company Mission & Domain**: Express genuine enthusiasm for ${company}'s products, engineering scale, and technology stack.\n2. **Direct Match from Your Resume**: Highlight your hands-on experience in ${jobSkills.slice(0, 3).join(', ')}, demonstrating that your past projects directly mirror their day-to-day requirements.\n3. **Value & Impact**: Articulate how you can hit the ground running, deliver clean maintainable code, and contribute to upcoming architectural initiatives.`,
    keyPoints: [
      'Show that you researched the company and their engineering culture',
      'Bridge your resume achievements with their JD requirements',
      'Focus on what you will contribute, not just what you will gain'
    ],
    followUps: [
      'Where do you see your technical trajectory in the next 2-3 years?',
      'What kind of engineering team culture enables you to do your best work?'
    ],
    userStatus: 'unattempted',
    userNotes: '',
  };
  q8.hints = buildProgressiveHints(q8);
  questions.push(q8);

  // 9. SKILL GAP QUESTIONS: If missing skills exist
  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 2);
    topMissing.forEach((skill) => {
      const qGap = {
        id: genId(),
        title: `Skill Gap Focus: Key Concepts & Practical Application of ${skill}`,
        category: 'skill_gap',
        difficulty: 'Medium',
        targetSkill: skill,
        question: `The job description for ${jobTitle} at ${company} lists **${skill}** as a key requirement. While this wasn't highlighted on your primary resume, explain core concepts of ${skill} and how you would apply it to build scalable features.`,
        modelAnswer: `1. **Core Concept**: Explain what ${skill} solves and why modern teams use it over older alternatives.\n2. **Architecture Role**: Explain where ${skill} fits in the application stack (e.g. caching, messaging, orchestration, testing, or frontend rendering).\n3. **Quick Learning & Transferable Knowledge**: Connect ${skill} to related tools you already master on your resume. Demonstrate rapid adoption and best practices.\n4. **Production Pitfalls**: Mention common anti-patterns to avoid when deploying ${skill} in production.`,
        keyPoints: [
          `Demonstrate working grasp of ${skill} fundamentals`,
          'Bridge with existing technologies on your resume',
          'Acknowledge learning curve with confidence and enthusiasm',
          'Highlight hands-on projects or tutorials you explored'
        ],
        followUps: [
          `How does ${skill} compare with competing technologies in the industry?`,
          `What steps would you take in your first 30 days to reach expert proficiency in ${skill}?`
        ],
        userStatus: 'unattempted',
        userNotes: '',
      };
      qGap.hints = buildProgressiveHints(qGap);
      questions.push(qGap);
    });
  }

  return questions;
};

/**
 * Main Question Generator: Attempts OpenAI LLM generation first, falls back to algorithmic generator.
 */
export const generateQuestionsForJobAndResume = async ({ job, resume, category = 'all' }) => {
  const jobTitle = job.jobTitle || 'Software Engineer';
  const company = job.companyName || 'Company';
  const jobDescription = job.jobDescription || '';
  const skills = job.skills || [];
  const requiredSkills = job.requiredSkills || [];
  const missingSkills = job.missingSkills || [];
  const resumeProfile = resume?.parsedProfile || {};
  const resumeRaw = (resume?.rawText || '').substring(0, 2500);

  const systemPrompt = `You are a Principal Software Engineering Interviewer and Staff Bar Raiser at top tech companies.
Your job is to generate a comprehensive, highly realistic technical interview question & answer pack for a candidate applying for the role of "${jobTitle}" at "${company}".
CRITICAL REQUIREMENT: Do not just provide a full monolithic answer. For every single question, you MUST provide a "hints" array containing step-by-step guidance (Step 1 to Step 4), where each step clearly explains:
1. What the step is.
2. WHY we are using this step (the engineering or interview rationale).

Format your response as a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "title": "Short descriptive title of problem/question",
      "category": "technical" | "coding" | "system_design" | "behavioral" | "skill_gap",
      "difficulty": "Easy" | "Medium" | "Hard",
      "targetSkill": "Skill name e.g. Node.js, Redis, Dynamic Programming",
      "question": "Comprehensive, clear question or problem statement",
      "modelAnswer": "In-depth, highly structured answer demonstrating staff-level engineering insights",
      "keyPoints": ["bullet point 1", "bullet point 2"],
      "followUps": ["follow up question 1", "follow up question 2"],
      "hints": [
        {
          "stepNumber": 1,
          "stepTitle": "Step 1: Problem Intuition & Edge Cases",
          "content": "Explanation of the intuition...",
          "whyThisStep": "Why this step: Why we approach it this way in an interview and what it proves...",
          "codeSnippet": "// optional code snippet for step"
        },
        {
          "stepNumber": 2,
          "stepTitle": "Step 2: Optimal Data Structure / Pattern",
          "content": "Explanation of data structure choice...",
          "whyThisStep": "Why this step: Why this data structure was selected over alternatives...",
          "codeSnippet": "// optional code snippet"
        },
        {
          "stepNumber": 3,
          "stepTitle": "Step 3: Core Algorithm Flow",
          "content": "Step-by-step procedural logic...",
          "whyThisStep": "Why this step: Why we need this algorithmic invariant...",
          "codeSnippet": "// optional code snippet"
        },
        {
          "stepNumber": 4,
          "stepTitle": "Step 4: Implementation & Complexity Verification",
          "content": "Final implementation and Big-O verification...",
          "whyThisStep": "Why this step: Verifying Big-O proof demonstrates performance rigor...",
          "codeSnippet": "// code snippet"
        }
      ],
      "starterCode": {
        "javascript": "function solution(...) { ... }",
        "python": "def solution(...): ...",
        "typescript": "function solution(...): ... ",
        "java": "public class Solution { ... }"
      },
      "solutionCode": "function solution(...) { ... }",
      "testCases": [
        { "input": "...", "expectedOutput": "...", "description": "..." }
      ]
    }
  ]
}`;

  const userPrompt = `Target Job Title: ${jobTitle}
Company: ${company}
Job Requirements & Skills: ${skills.join(', ')}
Required Skills: ${requiredSkills.join(', ')}
Missing Skills flagged in match: ${missingSkills.join(', ')}
Full Job Description:
${jobDescription.substring(0, 2000)}

Candidate Resume Summary:
Name: ${resumeProfile.name || 'Candidate'}
Experience Years: ${resumeProfile.experienceYears || '3+'}
Resume Skills: ${(resumeProfile.skills || []).join(', ')}
Candidate Resume Excerpt:
${resumeRaw.substring(0, 1500)}

Generate the complete interview Q&A and coding problem pack with step-by-step hints and 'whyThisStep' explanations now in JSON.`;

  try {
    const aiResponse = await generateCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.35,
      responseFormat: 'json_object',
    });

    if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length > 0) {
      return aiResponse.questions.map((q, idx) => {
        const enrichedQ = {
          id: q.id || `q_${Date.now()}_${idx}`,
          title: q.title || `Interview Question ${idx + 1}`,
          category: ['technical', 'coding', 'system_design', 'behavioral', 'skill_gap'].includes(q.category) ? q.category : 'technical',
          difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
          targetSkill: q.targetSkill || 'General',
          question: q.question,
          modelAnswer: q.modelAnswer,
          keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints : [],
          followUps: Array.isArray(q.followUps) ? q.followUps : [],
          starterCode: q.starterCode && typeof q.starterCode === 'object'
            ? { ...generateLanguageTemplates({ funcName: 'solution' }), ...q.starterCode }
            : generateLanguageTemplates({ funcName: 'solution' }),
          solutionCode: q.solutionCode || '',
          testCases: Array.isArray(q.testCases) ? q.testCases : [],
          userStatus: 'unattempted',
          userNotes: '',
        };
        enrichedQ.hints = buildProgressiveHints(q);
        return enrichedQ;
      });
    }
  } catch (err) {
    console.warn('[PracticeGenerator] AI generation error, using fallback:', err.message);
  }

  // Algorithmic Fallback
  return generateAlgorithmicQuestions(job, resume);
};
