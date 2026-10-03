import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Play, RotateCcw, Copy, Check, Share2, Settings, Terminal, Maximize2,
  Minimize2, Trash2, Database, Code2, Globe, Cpu, Download, Sparkles,
  ExternalLink, Layers, CheckCircle2, XCircle, ArrowUpRight, GitFork,
  Network, Box, Table, Keyboard, HelpCircle, X, Palette
} from 'lucide-react';
import Prism from 'prismjs';
// Import Prism language components
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-kotlin.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-php.js';
import 'prismjs/components/prism-dart.js';
import 'prismjs/components/prism-dot.js';
import { practiceService } from '../services';

// ─── Prism Language Mapping ─────────────────────────────────────────────
const getPrismLang = (type) => {
  switch (type) {
    case 'java': return 'java';
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'csharp':
    case 'dotnet': return 'csharp';
    case 'python': return 'python';
    case 'sql': return 'sql';
    case 'mongodb':
    case 'javascript': return 'javascript';
    case 'typescript': return 'typescript';
    case 'go': return 'go';
    case 'rust': return 'rust';
    case 'kotlin': return 'kotlin';
    case 'ruby': return 'ruby';
    case 'php': return 'php';
    case 'dart': return 'dart';
    case 'dot': return 'dot';
    case 'html': return 'html';
    default: return 'clike';
  }
};

/**
 * Universal Syntax Highlighter using PrismJS with guaranteed fallback.
 */
export const highlightCode = (code, type) => {
  if (!code) return '';
  const langKey = getPrismLang(type);

  try {
    if (Prism.languages[langKey]) {
      return Prism.highlight(code, Prism.languages[langKey], langKey);
    }
  } catch (_) {}

  // Fallback tokenizer with inline styles (cannot be purged)
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return code.split('\n').map((line) => {
    let l = escapeHtml(line);
    const trimmed = l.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
      return `<span style="color: #7f848e; font-style: italic;">${l}</span>`;
    }
    // String literals
    l = l.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span style="color: #98c379;">$&</span>');
    // Keywords
    const kws = ['class', 'public', 'static', 'void', 'return', 'import', 'package', 'new', 'if', 'else', 'for', 'while', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'CREATE', 'TABLE', 'use', 'db'];
    const kwRegex = new RegExp(`\\b(${kws.join('|')})\\b`, 'g');
    l = l.replace(kwRegex, '<span style="color: #c678dd; font-weight: 600;">$1</span>');
    // Types
    const types = ['String', 'System', 'Main', 'Integer', 'List', 'int', 'boolean', 'Console'];
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    l = l.replace(typeRegex, '<span style="color: #e5c07b;">$1</span>');
    // Methods
    l = l.replace(/\.([a-zA-Z_]\w*)/g, '.<span style="color: #61afef;">$1</span>');
    return l;
  }).join('\n');
};

// ─── Language & Database Configurations ─────────────────────────────────
export const COMPILER_LANGUAGES = [
  // 1. Java (Matches User Screenshot Default)
  {
    id: 'java',
    name: 'Java',
    filename: 'Main.java',
    category: 'backend',
    extension: 'java',
    type: 'java',
    color: '#ef4444',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-red-500 rounded bg-red-500/20 text-red-400">
        ☕
      </div>
    ),
    defaultCode: `// Online Java Compiler (Editor)
// Write and run Java online using this editor.

class Main {
    public static void main(String[] args) {
        System.out.println("Try clicking the Run button.");
    }
}`
  },

  // 2. SQL / Relational Database
  {
    id: 'database',
    name: 'SQL / Relational DB',
    filename: 'query.sql',
    category: 'database',
    extension: 'sql',
    type: 'sql',
    color: '#38bdf8',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    defaultCode: `-- Online SQL / Relational Database compiler (editor)
-- Write and run SQL queries online using live in-memory SQLite.

CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    salary INT NOT NULL
);

INSERT INTO employees (name, role, department, salary) VALUES
('Alex Rivera', 'Senior Frontend Engineer', 'Engineering', 125000),
('Priya Sharma', 'Backend Architect', 'Engineering', 140000),
('Carlos Mendez', 'Product Designer', 'Design', 105000),
('Aisha Patel', 'Data Scientist', 'Analytics', 130000),
('Liam Chen', 'DevOps Specialist', 'Infrastructure', 120000);

-- Query all engineering employees with salary >= $110,000
SELECT id, name, role, department, salary
FROM employees
WHERE salary >= 110000
ORDER BY salary DESC;`
  },

  // 3. MongoDB (NoSQL)
  {
    id: 'mongodb',
    name: 'MongoDB (mongosh)',
    filename: 'playground.mongodb.js',
    category: 'database',
    extension: 'js',
    type: 'mongodb',
    color: '#10b981',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-xs border border-emerald-500 rounded bg-emerald-500/20 text-emerald-400">
        🍃
      </div>
    ),
    defaultCode: `// Online MongoDB Playground (mongosh)
// Run MongoDB document queries, inserts, and aggregations online.

use('job_dashboard_playground');

// 1. Insert documents into MongoDB collection
db.candidates.insertMany([
  { name: "Dilip Kumar", role: "Fullstack Lead", skills: ["React", "Node.js", "MongoDB", ".NET"], experience: 5, salary: 125000, active: true },
  { name: "Priya Sharma", role: "Backend Architect", skills: ["Java", "Spring Boot", "SQL", "Kafka"], experience: 7, salary: 145000, active: true },
  { name: "Carlos Ray", role: "DevOps Engineer", skills: ["Docker", "Kubernetes", "AWS", "Go"], experience: 4, salary: 115000, active: false },
  { name: "Aisha Patel", role: "AI & Data Engineer", skills: ["Python", "TensorFlow", "MongoDB"], experience: 6, salary: 135000, active: true }
]);

// 2. Query active candidates with high experience
db.candidates.find({
  active: true,
  experience: { $gte: 5 }
});`
  },

  // 4. .NET / C#
  {
    id: 'dotnet',
    name: '.NET / C#',
    filename: 'Program.cs',
    category: 'backend',
    extension: 'cs',
    type: 'dotnet',
    color: '#8b5cf6',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[9px] border border-violet-500 rounded bg-violet-600 text-white">
        .NET
      </div>
    ),
    defaultCode: `// Online .NET 8 / C# compiler
// Write and run modern .NET C# applications online.

using System;
using System.Collections.Generic;
using System.Linq;

Console.WriteLine("=== .NET 8 Core Console Application ===");

var services = new List<ServiceInfo>
{
    new("AuthService", "Active", 99.98),
    new("JobMatchingEngine", "Active", 99.95),
    new("MongoDbAdapter", "Active", 100.0),
    new("CompilerSandbox", "Active", 99.99)
};

Console.WriteLine("Service Health Status:");
foreach (var svc in services.OrderByDescending(s => s.Uptime))
{
    Console.WriteLine($" • [{svc.Status}] {svc.Name} - SLA Uptime: {svc.Uptime}%");
}

record ServiceInfo(string Name, string Status, double Uptime);`
  },

  // 5. Graphviz DOT
  {
    id: 'dot',
    name: 'Graphviz (DOT)',
    filename: 'architecture.dot',
    category: 'architecture',
    extension: 'dot',
    type: 'dot',
    color: '#06b6d4',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[9px] border border-cyan-500 rounded bg-cyan-600 text-white">
        DOT
      </div>
    ),
    defaultCode: `// Online Graphviz DOT compiler (editor)
// Define nodes, edges, and architecture diagrams

digraph SystemArchitecture {
    rankdir=LR;
    node [shape=box, style="filled,rounded", fontname="Arial", fillcolor="#1e293b", fontcolor="#38bdf8", color="#3b82f6"];
    edge [color="#64748b", fontcolor="#94a3b8", fontsize=10];

    Client -> APIGateway [label="HTTPS / REST"];
    APIGateway -> AuthMicroservice [label="JWT Token"];
    APIGateway -> CoreAPI [label="gRPC"];
    CoreAPI -> MongoDB [label="NoSQL Documents"];
    CoreAPI -> RedisCache [label="TTL 300s"];
    CoreAPI -> DotNetWorker [label="Message Queue"];
}`
  },

  // 6. C (Screenshot Default)
  {
    id: 'c',
    name: 'C',
    filename: 'main.c',
    category: 'system',
    extension: 'c',
    type: 'c',
    color: '#2563eb',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-xs border border-blue-500 rounded bg-blue-600 text-white shadow-xs">
        C
      </div>
    ),
    defaultCode: `// Online C compiler (editor)
// Write and run C online using this editor.

#include <stdio.h>

int main() {
    printf("Try clicking the Run button.\\n");
    return 0;
}`
  },

  // 7. C++
  {
    id: 'cpp',
    name: 'C++',
    filename: 'main.cpp',
    category: 'system',
    extension: 'cpp',
    type: 'cpp',
    color: '#0284c7',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-cyan-500 rounded bg-cyan-600 text-white">
        C++
      </div>
    ),
    defaultCode: `// Online C++ compiler (editor)
// Write and run C++ online using this editor.

#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Online C++ Compiler ready." << endl;
    vector<string> items = {"Algorithm", "Data Structures", "Big-O"};
    for (const auto& item : items) {
        cout << "• " << item << endl;
    }
    return 0;
}`
  },

  // 8. Python 3
  {
    id: 'python',
    name: 'Python 3',
    filename: 'main.py',
    category: 'backend',
    extension: 'py',
    type: 'python',
    color: '#eab308',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-bold text-xs border border-yellow-500 rounded bg-yellow-500/20 text-yellow-400">
        Py
      </div>
    ),
    defaultCode: `# Online Python compiler (interpreter)
# Write and run Python 3 online using this editor.

def greet(name):
    return f"Hello, {name}! Welcome to the Online Compiler."

print(greet("Developer"))

# Calculate Fibonacci sequence
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("First 8 Fibonacci numbers:", fibonacci(8))`
  },

  // 9. JavaScript (Node.js)
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    filename: 'index.js',
    category: 'backend',
    extension: 'js',
    type: 'javascript',
    color: '#facc15',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-amber-400 rounded bg-amber-400 text-slate-950">
        JS
      </div>
    ),
    defaultCode: `// Online JavaScript compiler (Node.js)
// Write and run JavaScript online using this editor.

function solve() {
  const users = [
    { id: 1, name: "Alice", role: "Frontend Dev" },
    { id: 2, name: "Bob", role: "DevOps Engineer" }
  ];
  console.log("Registered Users:\\n" + JSON.stringify(users, null, 2));
}

solve();`
  },

  // 10. TypeScript
  {
    id: 'typescript',
    name: 'TypeScript',
    filename: 'index.ts',
    category: 'backend',
    extension: 'ts',
    type: 'typescript',
    color: '#3b82f6',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-blue-500 rounded bg-blue-500 text-white">
        TS
      </div>
    ),
    defaultCode: `// Online TypeScript compiler
interface Developer {
  name: string;
  skills: string[];
  experienceYears: number;
}

const dev: Developer = {
  name: "Candidate",
  skills: ["TypeScript", "Node.js", "React", "MongoDB", ".NET"],
  experienceYears: 4
};

console.log(\`Developer \${dev.name} specializing in \${dev.skills.join(", ")}\`);`
  },

  // 11. HTML5 Live Web Sandbox
  {
    id: 'html',
    name: 'HTML5 / Web',
    filename: 'index.html',
    category: 'frontend',
    extension: 'html',
    type: 'html',
    color: '#f97316',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-xs border border-orange-500 rounded bg-orange-500/20 text-orange-400">
        5
      </div>
    ),
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
    }
    .card {
      background: #1e293b;
      padding: 2.5rem;
      border-radius: 1.25rem;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
      text-align: center;
      border: 1px solid #334155;
    }
    h2 { color: #38bdf8; margin-top: 0; }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      cursor: pointer;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>🚀 HTML5 Live Sandbox</h2>
    <p>Live DOM preview and interactive script execution.</p>
    <button onclick="alert('Hello from Online Compiler!')">Click Button</button>
  </div>
</body>
</html>`
  },

  // 12. Go (Golang)
  {
    id: 'go',
    name: 'Go (Golang)',
    filename: 'main.go',
    category: 'system',
    extension: 'go',
    type: 'go',
    color: '#06b6d4',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-cyan-400 rounded bg-cyan-500 text-slate-950">
        GO
      </div>
    ),
    defaultCode: `package main

import "fmt"

func main() {
	fmt.Println("Hello, Golang! Online compiler ready.")
	tasks := []string{"Build microservice", "Deploy container", "Run tests"}
	for i, task := range tasks {
		fmt.Printf("%d. %s\\n", i+1, task)
	}
}`
  },

  // 13. Rust
  {
    id: 'rust',
    name: 'Rust',
    filename: 'main.rs',
    category: 'system',
    extension: 'rs',
    type: 'rust',
    color: '#f97316',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-orange-500 rounded bg-orange-600 text-white">
        RS
      </div>
    ),
    defaultCode: `// Online Rust compiler
fn main() {
    println!("Hello from Rust Online Compiler!");
    let features = vec!["Zero-cost abstractions", "Memory safety", "Fearless concurrency"];
    println!("Key Rust Features: {:?}", features);
}`
  },

  // 14. PHP
  {
    id: 'php',
    name: 'PHP',
    filename: 'index.php',
    category: 'backend',
    extension: 'php',
    type: 'php',
    color: '#818cf8',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-indigo-400 rounded bg-indigo-500 text-white">
        PHP
      </div>
    ),
    defaultCode: `<?php
echo "PHP online compiler running successfully.\\n";
$frameworks = ["Laravel", "Symfony", "WordPress"];
echo "Frameworks: " . implode(", ", $frameworks) . "\\n";
?>`
  },

  // 15. Ruby
  {
    id: 'ruby',
    name: 'Ruby',
    filename: 'main.rb',
    category: 'backend',
    extension: 'rb',
    type: 'ruby',
    color: '#f43f5e',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-black text-[10px] border border-rose-500 rounded bg-rose-500 text-white">
        RB
      </div>
    ),
    defaultCode: `# Online Ruby compiler
puts "Hello from Ruby Online Compiler!"
skills = ["Ruby on Rails", "PostgreSQL", "RSpec"]
puts "Skills: #{skills.join(', ')}"`
  }
];

export default function OnlineCompiler() {
  const [activeLangId, setActiveLangId] = useState('java'); // 'java' matches user screenshot!
  const [codes, setCodes] = useState(() => {
    const initial = {};
    COMPILER_LANGUAGES.forEach(l => {
      initial[l.id] = l.defaultCode;
    });
    return initial;
  });

  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [errorOutput, setErrorOutput] = useState('');
  const [dbData, setDbData] = useState(null);
  const [dotData, setDotData] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState('terminal'); // 'terminal' | 'table' | 'preview' | 'graph'
  const [activeLine, setActiveLine] = useState(6);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const activeLang = COMPILER_LANGUAGES.find(l => l.id === activeLangId) || COMPILER_LANGUAGES[0];
  const currentCode = codes[activeLangId] ?? activeLang.defaultCode;

  const editorRef = useRef(null);
  const syntaxOverlayRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Switch language handler
  const handleSelectLanguage = (langId) => {
    setActiveLangId(langId);
    setOutput('');
    setErrorOutput('');
    setDbData(null);
    setDotData(null);
    setExecutionTime(null);
    if (langId === 'database' || langId === 'mongodb') {
      setActiveOutputTab('table');
    } else if (langId === 'html') {
      setActiveOutputTab('preview');
    } else if (langId === 'dot') {
      setActiveOutputTab('graph');
    } else {
      setActiveOutputTab('terminal');
    }
  };

  // Sync scroll between textarea, syntax overlay, and line numbers
  const handleScroll = (e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (syntaxOverlayRef.current) {
      syntaxOverlayRef.current.scrollTop = scrollTop;
      syntaxOverlayRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  // Track cursor position to highlight current active line
  const updateCursorLine = (textarea) => {
    if (!textarea) return;
    const textBefore = textarea.value.substring(0, textarea.selectionStart);
    const lineNum = textBefore.split('\n').length;
    setActiveLine(lineNum);
  };

  // Get comment prefix for active language
  const getCommentPrefix = (type) => {
    switch (type) {
      case 'python':
      case 'ruby':
        return '# ';
      case 'sql':
        return '-- ';
      case 'html':
        return '<!-- ';
      default:
        return '// ';
    }
  };

  // ─── SHORTCUT KEY: Toggle Comment on Selected Line(s) ─────────────────
  const handleToggleComment = useCallback((textarea) => {
    if (!textarea) return;
    const prefix = getCommentPrefix(activeLang.type);
    const cleanPrefix = prefix.trim();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const lineStart = currentCode.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = currentCode.indexOf('\n', end);
    const lineEnd = lineEndIdx === -1 ? currentCode.length : lineEndIdx;

    const selectedBlock = currentCode.substring(lineStart, lineEnd);
    const blockLines = selectedBlock.split('\n');

    // If all selected lines start with comment prefix, uncomment; otherwise comment
    const allCommented = blockLines.every(l => l.trim().startsWith(cleanPrefix));

    let modifiedLines;
    if (allCommented) {
      modifiedLines = blockLines.map(l => {
        const idx = l.indexOf(cleanPrefix);
        if (idx !== -1) {
          const before = l.substring(0, idx);
          let after = l.substring(idx + cleanPrefix.length);
          if (after.startsWith(' ')) after = after.substring(1);
          return before + after;
        }
        return l;
      });
    } else {
      modifiedLines = blockLines.map(l => {
        const match = l.match(/^(\s*)/);
        const leadingSpace = match ? match[1] : '';
        const rest = l.substring(leadingSpace.length);
        return `${leadingSpace}${prefix}${rest}`;
      });
    }

    const newBlock = modifiedLines.join('\n');
    const newCode = currentCode.substring(0, lineStart) + newBlock + currentCode.substring(lineEnd);

    setCodes(prev => ({ ...prev, [activeLangId]: newCode }));

    setTimeout(() => {
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = lineStart + newBlock.length;
      updateCursorLine(textarea);
    }, 0);

    toast.success(allCommented ? 'Uncommented selection' : 'Commented selection (Ctrl+/)');
  }, [currentCode, activeLangId, activeLang.type]);

  // ─── SHORTCUT KEY: Duplicate Selected Line(s) ────────────────────────
  const handleDuplicateLine = useCallback((textarea) => {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const lineStart = currentCode.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = currentCode.indexOf('\n', end);
    const lineEnd = lineEndIdx === -1 ? currentCode.length : lineEndIdx;

    const targetBlock = currentCode.substring(lineStart, lineEnd);
    const newCode = currentCode.substring(0, lineEnd) + '\n' + targetBlock + currentCode.substring(lineEnd);

    setCodes(prev => ({ ...prev, [activeLangId]: newCode }));

    setTimeout(() => {
      textarea.selectionStart = lineEnd + 1;
      textarea.selectionEnd = lineEnd + 1 + targetBlock.length;
      updateCursorLine(textarea);
    }, 0);

    toast.success('Duplicated line(s) (Ctrl+D)');
  }, [currentCode, activeLangId]);

  // Run code handler
  const handleRun = useCallback(async (snippetToRun = null) => {
    setExecuting(true);
    setErrorOutput('');
    setOutput('');
    setDbData(null);
    setDotData(null);

    const codeToExecute = snippetToRun || currentCode;

    // If HTML, live preview update
    if (activeLang.id === 'html') {
      setOutput('Live HTML preview rendered successfully.');
      setActiveOutputTab('preview');
      setExecuting(false);
      return;
    }

    try {
      const res = await practiceService.executeCode({
        language: activeLang.type,
        code: codeToExecute,
        testCases: [],
      });

      setOutput(res.stdout || '');
      setErrorOutput(res.stderr || '');
      setDbData(res.dbData || null);
      setDotData(res.dotData || null);
      setExecutionTime(res.executionTimeMs);

      if (res.dbData && res.dbData.rows?.length > 0) {
        setActiveOutputTab('table');
      } else if (res.dotData && res.dotData.nodes?.length > 0) {
        setActiveOutputTab('graph');
      } else {
        setActiveOutputTab('terminal');
      }

      if (res.stderr) {
        toast.error('Execution encountered errors');
      } else {
        toast.success(`Executed ${activeLang.name} successfully!`);
      }
    } catch (err) {
      setErrorOutput(err.message || 'Execution error');
      setActiveOutputTab('terminal');
      toast.error(err.message || 'Failed to execute');
    } finally {
      setExecuting(false);
    }
  }, [currentCode, activeLang.id, activeLang.name, activeLang.type]);

  // ─── KEYBOARD SHORTCUTS LISTENER ─────────────────────────────────────
  const handleKeyDown = (e) => {
    const textarea = e.target;
    updateCursorLine(textarea);

    // 1. Ctrl + / (or Cmd + /): Toggle Comment on Selected Line(s)
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      handleToggleComment(textarea);
      return;
    }

    // 2. Ctrl + Enter (or Cmd + Enter): Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
      if (e.shiftKey && selected) {
        toast('Running selected snippet only…');
        handleRun(selected);
      } else {
        handleRun();
      }
      return;
    }

    // 3. Ctrl + D: Duplicate Line
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleDuplicateLine(textarea);
      return;
    }

    // 4. Ctrl + L: Clear Output
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      clearOutput();
      return;
    }

    // 5. Tab / Shift + Tab Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        // Outdent
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEndIdx = value.indexOf('\n', end);
        const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
        const lines = value.substring(lineStart, lineEnd).split('\n');
        const outdented = lines.map(l => l.startsWith('    ') ? l.substring(4) : l.startsWith('\t') ? l.substring(1) : l).join('\n');
        const updated = value.substring(0, lineStart) + outdented + value.substring(lineEnd);
        setCodes(prev => ({ ...prev, [activeLangId]: updated }));
      } else if (start !== end) {
        // Multi-line indent
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEndIdx = value.indexOf('\n', end);
        const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
        const lines = value.substring(lineStart, lineEnd).split('\n');
        const indented = lines.map(l => '    ' + l).join('\n');
        const updated = value.substring(0, lineStart) + indented + value.substring(lineEnd);
        setCodes(prev => ({ ...prev, [activeLangId]: updated }));
      } else {
        // Single cursor 4 spaces
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        setCodes(prev => ({ ...prev, [activeLangId]: newValue }));
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
          updateCursorLine(textarea);
        }, 0);
      }
    }
  };

  // Reset starter code
  const handleReset = () => {
    setCodes(prev => ({ ...prev, [activeLangId]: activeLang.defaultCode }));
    setOutput('');
    setErrorOutput('');
    setDbData(null);
    setDotData(null);
    toast('Reset to default template');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output || errorOutput);
    setCopiedOutput(true);
    toast.success('Output copied');
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const clearOutput = () => {
    setOutput('');
    setErrorOutput('');
    setDbData(null);
    setDotData(null);
    setExecutionTime(null);
    toast('Output cleared (Ctrl+L)');
  };

  // Split lines
  const lines = currentCode.split('\n');
  const lineCount = lines.length;

  return (
    <div className={`transition-all duration-200 ${
      fullscreen
        ? 'fixed inset-0 z-50 bg-[#16171d] text-slate-100 flex flex-col h-screen w-screen overflow-hidden'
        : 'rounded-2xl border border-slate-800 bg-[#16171d] text-slate-100 shadow-2xl overflow-hidden flex flex-col h-[84vh] min-h-[640px]'
    }`}>
      {/* ─── EMBEDDED SYNTAX COLOR STYLESHEET ─── */}
      <style>{`
        /* Dedicated Syntax Token Palette matching Screenshot */
        .prism-highlight-container {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 13.5px !important;
          line-height: 1.625rem !important;
          letter-spacing: 0px !important;
          tab-size: 4 !important;
          -moz-tab-size: 4 !important;
        }

        /* 1. Comments: Gray muted italic */
        .prism-highlight-container .token.comment,
        .prism-highlight-container .token.prolog,
        .prism-highlight-container .token.doctype,
        .prism-highlight-container .token.cdata {
          color: #717d91 !important;
          font-style: italic !important;
        }

        /* 2. Keywords: Vivid Magenta / Purple */
        .prism-highlight-container .token.keyword {
          color: #c678dd !important;
          font-weight: 600 !important;
        }

        /* 3. Class Names / Types: Bright Golden Yellow */
        .prism-highlight-container .token.class-name,
        .prism-highlight-container .token.maybe-class-name {
          color: #e5c07b !important;
          font-weight: 500 !important;
        }

        /* 4. Functions & Methods: Sky Blue / Cyan */
        .prism-highlight-container .token.function {
          color: #61afef !important;
          font-weight: 500 !important;
        }

        /* 5. Strings: Fresh Emerald Green */
        .prism-highlight-container .token.string,
        .prism-highlight-container .token.char,
        .prism-highlight-container .token.attr-value {
          color: #98c379 !important;
        }

        /* 6. Numbers & Booleans: Vibrant Orange */
        .prism-highlight-container .token.number,
        .prism-highlight-container .token.boolean {
          color: #d19a66 !important;
        }

        /* 7. Operators & Types: Teal */
        .prism-highlight-container .token.operator {
          color: #56b6c2 !important;
        }

        /* 8. Punctuation & Brackets: Silver */
        .prism-highlight-container .token.punctuation {
          color: #abb2bf !important;
        }

        /* 9. Properties & Variables: Soft Coral Red */
        .prism-highlight-container .token.property,
        .prism-highlight-container .token.variable,
        .prism-highlight-container .token.constant {
          color: #e06c75 !important;
        }

        /* Selection styling */
        .code-textarea::selection {
          background-color: rgba(59, 130, 246, 0.45) !important;
        }
      `}</style>

      {/* ─── MAIN COMPILER LAYOUT ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── 1. LEFT VERTICAL ICON TOOLBAR (MATCHES SCREENSHOT) ─── */}
        <aside className="w-14 sm:w-16 bg-[#111216] border-r border-[#262833] flex flex-col items-center py-3 select-none shrink-0 overflow-y-auto space-y-2">
          {/* Top Logo / Compiler branding icon */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md mb-2 cursor-pointer" title="Online Polyglot Compiler">
            <Code2 className="h-5 w-5" />
          </div>

          <div className="w-8 border-b border-[#262833] my-1" />

          {/* Vertical Language & Database Icons */}
          {COMPILER_LANGUAGES.map((lang) => {
            const isActive = lang.id === activeLangId;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                className={`relative group flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-[#1f212a]'
                }`}
                title={`${lang.name} (${lang.filename})`}
              >
                {lang.icon}

                {/* Tooltip on Hover */}
                <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center z-50 whitespace-nowrap rounded-md bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs font-bold text-white shadow-xl">
                  <span>{lang.name}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({lang.filename})</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ─── 2. RIGHT WORKSPACE (TOP BAR + SPLIT EDITOR & OUTPUT) ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#181a20]">
          {/* ─── TOP TOOLBAR (MATCHES SCREENSHOT) ─── */}
          <div className="h-12 bg-[#121318] border-b border-[#262833] flex items-center justify-between px-3 sm:px-4 select-none">
            {/* Left side: Active file tab + Run Button */}
            <div className="flex items-center gap-3">
              {/* File Tab (e.g. Main.java) */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1c24] border-t-2 border-blue-500 rounded-t-lg text-xs font-mono font-bold text-slate-200">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeLang.color }} />
                <span>{activeLang.filename}</span>
              </div>

              {/* Exact Run ▶ Blue Button from Screenshot */}
              <button
                onClick={() => handleRun()}
                disabled={executing}
                className="flex items-center gap-2 rounded-md bg-[#1a73e8] hover:bg-blue-600 active:bg-blue-700 px-5 py-1.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
                title="Execute code (Ctrl+Enter / Click Run)"
              >
                <Play className={`h-3.5 w-3.5 fill-white ${executing ? 'animate-spin' : ''}`} />
                <span>{executing ? 'Running…' : 'Run ▶'}</span>
              </button>
            </div>

            {/* Right side: Output title & Controls */}
            <div className="flex items-center gap-3">
              {/* Keyboard Shortcuts Trigger Button */}
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f212a] hover:bg-[#282a36] text-[11px] font-bold text-slate-300 border border-[#303342] transition-colors"
                title="View Keyboard Shortcuts (Ctrl+/ to toggle comment, Ctrl+Enter to Run)"
              >
                <Keyboard className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Shortcuts</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">Ctrl+/</span>
              </button>

              <span className="font-bold text-slate-400 text-xs uppercase tracking-wider hidden sm:inline">
                Output
              </span>

              {executionTime !== null && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  ⚡ {executionTime}ms
                </span>
              )}

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={copyCode}
                  className="p-1.5 rounded hover:bg-[#262833] hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded hover:bg-[#262833] hover:text-white transition-colors"
                  title="Reset to starter code"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={clearOutput}
                  className="p-1.5 rounded hover:bg-[#262833] hover:text-white transition-colors"
                  title="Clear terminal output (Ctrl+L)"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-1.5 rounded hover:bg-[#262833] hover:text-white transition-colors"
                  title={fullscreen ? "Exit Fullscreen" : "Fullscreen / Zen Mode"}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* ─── SPLIT VIEW: EDITOR (LEFT) & OUTPUT (RIGHT) ─── */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* ─── LEFT: CODE EDITOR WITH LINE NUMBERS & SYNTAX HIGHLIGHTING ─── */}
            <div className="flex-1 flex bg-[#181a20] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#262833]">
              {/* Line Numbers Gutter with Fold Indicators (Matching Screenshot '4 v', '5 v') */}
              <div
                ref={lineNumbersRef}
                className="w-13 sm:w-15 bg-[#14151b] border-r border-[#242630] py-4 select-none font-mono text-xs text-slate-500 overflow-hidden leading-relaxed shrink-0 text-right pr-2"
              >
                {lines.map((l, i) => {
                  const lineNum = i + 1;
                  const isCurrent = lineNum === activeLine;
                  const hasFold = l.includes('{');
                  return (
                    <div
                      key={i}
                      className={`leading-[1.625rem] flex items-center justify-end gap-1 px-1 transition-colors ${
                        isCurrent ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-500'
                      }`}
                    >
                      <span>{lineNum}</span>
                      {hasFold ? (
                        <span className="text-[10px] text-slate-400 font-sans cursor-pointer hover:text-white">v</span>
                      ) : (
                        <span className="w-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Editor Workspace Container with Color Diff Overlay */}
              <div className="relative flex-1 h-full overflow-hidden bg-[#181a20]">
                {/* Active Line Highlight Background Bar */}
                <div
                  className="absolute left-0 right-0 pointer-events-none bg-white/[0.04] border-y border-white/[0.05] transition-all duration-75"
                  style={{
                    top: `${16 + (activeLine - 1) * 26}px`,
                    height: '26px'
                  }}
                />

                {/* 1. Underlying Syntax Highlighted Pre/Code Block (Prism Color Palette) */}
                <pre
                  ref={syntaxOverlayRef}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightCode(currentCode, activeLang.type) + '\n' }}
                  className="prism-highlight-container prism-editor-pre absolute inset-0 p-4 m-0 overflow-hidden pointer-events-none whitespace-pre select-none text-slate-200 border-0 bg-transparent"
                />

                {/* 2. Top Interactive Transparent Textarea with Keyboard Shortcuts */}
                <textarea
                  ref={editorRef}
                  value={currentCode}
                  onChange={(e) => {
                    setCodes(prev => ({ ...prev, [activeLangId]: e.target.value }));
                    updateCursorLine(e.target);
                  }}
                  onSelect={(e) => updateCursorLine(e.target)}
                  onClick={(e) => updateCursorLine(e.target)}
                  onKeyUp={(e) => updateCursorLine(e.target)}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck="false"
                  className="code-textarea prism-highlight-container relative z-10 w-full h-full p-4 m-0 bg-transparent text-transparent caret-blue-400 focus:outline-none resize-none whitespace-pre border-0"
                  placeholder={`// Write your ${activeLang.name} code here...`}
                />
              </div>
            </div>

            {/* ─── CENTER RESIZE DIVIDER PILL HANDLE ─── */}
            <div className="hidden lg:flex w-1.5 bg-[#121318] items-center justify-center cursor-col-resize hover:bg-blue-600 transition-colors">
              <div className="h-8 w-1 rounded-full bg-slate-600" />
            </div>

            {/* ─── RIGHT: OUTPUT TERMINAL, DATABASE & GRAPH RESULTS ─── */}
            <div className="flex-1 flex flex-col bg-[#14151b] overflow-hidden">
              {/* Output Sub-Header (Tabs for SQL/Table, Graph, or Terminal) */}
              <div className="h-9 bg-[#111216] border-b border-[#242630] flex items-center justify-between px-3 select-none text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveOutputTab('terminal')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      activeOutputTab === 'terminal'
                        ? 'bg-[#20222c] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Terminal Output
                  </button>

                  {/* Database Table Tab if SQL or MongoDB has tabular results */}
                  {dbData && dbData.columns && (
                    <button
                      onClick={() => setActiveOutputTab('table')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        activeOutputTab === 'table'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Database className="h-3.5 w-3.5" />
                      <span>Data Table ({dbData.count} records)</span>
                    </button>
                  )}

                  {/* Graphviz DOT Visual Graph Tab */}
                  {dotData && (
                    <button
                      onClick={() => setActiveOutputTab('graph')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        activeOutputTab === 'graph'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Network className="h-3.5 w-3.5" />
                      <span>Graph Visualizer</span>
                    </button>
                  )}

                  {/* HTML Live Preview Tab */}
                  {activeLang.id === 'html' && (
                    <button
                      onClick={() => setActiveOutputTab('preview')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        activeOutputTab === 'preview'
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Live DOM Preview</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyOutput}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copiedOutput ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedOutput ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Output Content Area with Command Lines Color Diff */}
              <div className="flex-1 p-4 overflow-auto font-mono text-xs">
                {/* 1. Terminal Console Output */}
                {activeOutputTab === 'terminal' && (
                  <div className="space-y-3">
                    {/* Command Prompt Line with Color Diff */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#181a24] border border-[#2b2e3c] font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-cyan-400 font-bold">$</span>
                        <span className="text-purple-400 font-bold">{activeLang.type}</span>
                        <span className="text-amber-300 font-medium">{activeLang.filename}</span>
                      </div>

                      {executionTime !== null && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                          ⚡ {executionTime}ms · Exit 0
                        </span>
                      )}
                    </div>

                    {/* Standard Output Code Lines */}
                    {output && (
                      <div className="p-3.5 rounded-xl bg-[#181a22] border border-[#252834]">
                        <pre className="text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {output}
                        </pre>
                      </div>
                    )}

                    {/* Error Output Code Lines with Warning Style */}
                    {errorOutput && (
                      <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50">
                        <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Runtime Error Diagnostic:</span>
                        </div>
                        <pre className="text-rose-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {errorOutput}
                        </pre>
                      </div>
                    )}

                    {/* Empty placeholder */}
                    {!output && !errorOutput && (
                      <div className="text-slate-600 italic py-10 text-center space-y-2">
                        <p>Click "Run ▶" (or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 not-italic font-mono text-[10px]">Ctrl+Enter</kbd>) to compile &amp; execute your code.</p>
                        <p className="text-[11px] text-slate-700">Results, query tables, MongoDB documents, and runtime logs will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Interactive Database Table View (For SQL / MongoDB) */}
                {activeOutputTab === 'table' && dbData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-slate-400 text-xs border-b border-[#242630] pb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-white">
                          {activeLang.id === 'mongodb' ? 'MongoDB Collection Documents' : 'Database Query Result'}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        {dbData.count} record(s) returned
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#2b2e3c] bg-[#1a1c24]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#121318] border-b border-[#2b2e3c] text-slate-300 uppercase font-bold text-[10px] tracking-wider">
                            {dbData.columns.map((col) => (
                              <th key={col} className="p-3 border-r border-[#2b2e3c] last:border-r-0">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#242630]">
                          {dbData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#20232e] transition-colors font-mono">
                              {dbData.columns.map((col) => {
                                const val = row[col];
                                const isArr = Array.isArray(val);
                                const isObj = typeof val === 'object' && val !== null;
                                return (
                                  <td key={col} className="p-3 border-r border-[#242630] last:border-r-0 text-slate-200">
                                    {isArr ? (
                                      <span className="text-cyan-400">[{val.join(', ')}]</span>
                                    ) : isObj ? (
                                      <span className="text-amber-300">{JSON.stringify(val)}</span>
                                    ) : val !== null && val !== undefined ? (
                                      String(val)
                                    ) : (
                                      <span className="text-slate-500 italic">NULL</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Graphviz DOT Visual Flowchart Diagram */}
                {activeOutputTab === 'graph' && dotData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#242630] pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-cyan-400" />
                        <span className="font-bold text-white">Graphviz Topology: {dotData.graphName}</span>
                      </div>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {dotData.nodes.length} Nodes · {dotData.edges.length} Edges
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dotData.nodes.map((nodeName, nIdx) => {
                        const outgoing = dotData.edges.filter(e => e.from === nodeName);
                        const incoming = dotData.edges.filter(e => e.to === nodeName);
                        return (
                          <div key={nIdx} className="rounded-xl border border-cyan-800/40 bg-[#1a1c24] p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-cyan-300 text-sm">{nodeName}</span>
                              <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            </div>
                            <div className="text-[11px] text-slate-400 space-y-1">
                              {outgoing.length > 0 && (
                                <p className="text-emerald-400">
                                  ➜ Targets: {outgoing.map(o => `${o.to}${o.label ? ` (${o.label})` : ''}`).join(', ')}
                                </p>
                              )}
                              {incoming.length > 0 && (
                                <p className="text-slate-400">
                                  ⬅ From: {incoming.map(i => i.from).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-[#262833] bg-[#121318] p-4 font-mono text-xs space-y-1 text-slate-300">
                      <p className="font-bold text-slate-400 uppercase text-[10px] mb-2">Graph Invariants &amp; Edge Connections:</p>
                      {dotData.edges.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-cyan-400">{e.from}</span>
                          <span className="text-slate-500">──{e.label ? `[${e.label}]` : ''}──▶</span>
                          <span className="text-emerald-400">{e.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Live HTML5 Sandbox Preview */}
                {activeOutputTab === 'preview' && activeLang.id === 'html' && (
                  <div className="h-full w-full rounded-xl overflow-hidden border border-[#2b2e3c] bg-white">
                    <iframe
                      title="HTML5 Live Preview"
                      srcDoc={currentCode}
                      className="w-full h-full min-h-[350px] border-0"
                      sandbox="allow-scripts allow-modals"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KEYBOARD SHORTCUTS MODAL ─── */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#161720] p-5 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Keyboard Shortcuts &amp; Command Keys</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'Ctrl + /', desc: 'Comment / Uncomment selected line(s) with // or # or --' },
                { key: 'Ctrl + Enter', desc: 'Run code in the interactive compiler' },
                { key: 'Ctrl + Shift + Enter', desc: 'Run selected code snippet only' },
                { key: 'Ctrl + D', desc: 'Duplicate current or selected line(s)' },
                { key: 'Tab', desc: 'Indent selection (4 spaces)' },
                { key: 'Shift + Tab', desc: 'Outdent selection' },
                { key: 'Ctrl + L', desc: 'Clear terminal output' },
                { key: 'Esc', desc: 'Close dialog / Exit Fullscreen' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-[#111218] p-2.5 border border-slate-800/80">
                  <span className="text-slate-300 font-medium">{item.desc}</span>
                  <kbd className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-mono font-bold text-cyan-300 shadow-2xs">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
