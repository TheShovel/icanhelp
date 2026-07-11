# Personal Knowledge Management (PKM)

## Overview
Personal Knowledge Management is a system for capturing, organizing, retrieving, and leveraging information to enhance learning, creativity, and productivity. It's a "second brain" that extends your cognitive capabilities.

## Core Principles

### CODE Framework (Tiago Forte)
| Stage | Purpose | Key Practices |
|-------|---------|---------------|
| **Capture** | Collect what resonates | Quick capture, trusted inboxes, minimal friction |
| **Organize** | Make findable when needed | PARA, tagging, linking, progressive summarization |
| **Distill** | Extract essence | Progressive summarization, highlighting, atomic notes |
| **Express** | Create output | Projects, deliverables, sharing, teaching |

### PARA Organization (Projects, Areas, Resources, Archives)
```
📁 Projects      → Active, deadline-driven (3-15 max)
📁 Areas         → Ongoing responsibilities (Health, Finance, Career)
📁 Resources     → Reference material, interests (topics, hobbies)
📁 Archives      → Completed/inactive (searchable, out of sight)
```

**Decision Tree for Filing**:
1. Is it actionable with a deadline? → **Projects**
2. Is it an ongoing responsibility? → **Areas**
3. Is it reference material for future use? → **Resources**
4. Is it done/inactive? → **Archives**

## Note-Taking Methodologies

### Zettelkasten (Slip Box)
- **Atomic notes**: One idea per note
- **Dense linking**: Connect every note to others
- **Unique IDs**: Timestamp or UUID for linking
- **Types**: Fleeting → Literature → Permanent
- **Emergence**: Ideas arise from connections

### Cornell Method
```
┌─────────────────────────────────────┐
│  Cue Column (2.5") │ Notes (6")     │
│  Questions, keywords                │
│  Main ideas, details                │
├─────────────────────────────────────┤
│  Summary (2")                       │
│  1-2 sentences capturing essence    │
└─────────────────────────────────────┘
```

### Outline Method
- Hierarchical structure
- Good for lectures, meetings, structured content
- Easy to reorganize in outliners (Logseq, Roam, Obsidian outliner)

### Mind Mapping
- Visual, non-linear
- Central topic → branches → sub-branches
- Good for brainstorming, planning, overview

### Bullet Journaling (BuJo)
- Rapid logging: Tasks (•), Events (○), Notes (–)
- Collections: Index, Future Log, Monthly, Daily
- Migration: Review, migrate, delete
- Analog or digital (Obsidian, Notion templates)

## Digital PKM Tools Comparison

| Tool | Paradigm | Best For | Learning Curve |
|------|----------|----------|----------------|
| **Obsidian** | Local files, links, graph | Zettelkasten, long-term PKM | Medium |
| **Logseq** | Outliner, daily journals, bi-dir links | Daily notes, outliners | Low-Medium |
| **Roam Research** | Daily notes, bi-dir links, blocks | Networked thought, research | Medium |
| **Notion** | Databases, blocks, templates | Projects, team knowledge, dashboards | Medium |
| **Tana** | Supertags, nodes, live search | Structured knowledge, PKM + tasks | Medium |
| **Heptabase** | Visual cards, whiteboard, tags | Visual thinkers, synthesis | Low |
| **RemNote** | Spaced repetition + notes | Students, spaced repetition | Medium |
| **Reflect** | Daily notes, backlinks, minimal | Minimalists, daily journaling | Low |
| **Capacities** | Object-based, types, queries | Structured personal CRM | Medium |
| **Evernote/OneNote** | Traditional notebooks | Capture, OCR, web clipper | Low |

## Capture Systems

### Quick Capture Methods
| Method | Tool | Speed |
|--------|------|-------|
| Voice memo | Phone, Watch, Otter.ai | ⚡⚡⚡ |
| Quick capture app | Drafts, Capture, QuickNote | ⚡⚡⚡ |
| Browser extension | Web clipper, Readwise, Omnivore | ⚡⚡ |
| Email forward | Forward to Notion/Obsidian email | ⚡⚡ |
| Share sheet | iOS/Android share to app | ⚡⚡ |
| Physical | Pocket notebook, index cards | ⚡⚡ |

### Capture Inboxes (Process Daily/Weekly)
- Physical inbox tray
- Email "To Process" label
- App inbox (Obsidian inbox, Notion inbox)
- Read-later queue (Readwise, Omnivore, Pocket)
- Voice memo folder

### Capture Rules
1. **Capture everything** that resonates (no filtering at capture)
2. **Low friction** - <5 seconds to capture
3. **Context** - Note source, why it matters, tags
4. **Single inbox per type** - Don't fragment

## Processing Workflow

### Daily (5-15 min)
```
1. Empty all inboxes
2. For each item:
   - Delete (no value)
   - Delegate (forward)
   - Do (<2 min)
   - Defer → Project/Calendar/Task manager
   - File → Reference/Resources
3. Clear inboxes to zero
```

### Weekly Review (30-60 min)
```
1. Review Projects: Complete? Next actions? Stuck?
2. Review Areas: Any neglected? Metrics OK?
3. Review Calendar: Past week (what happened), Next week (prep)
3. Review Notes: Process fleeting → permanent, link, summarize
4. Review Metrics: Habits, goals, health, finance
5. Plan Next Week: Top 3 priorities, time blocks
```

## Progressive Summarization

### Layered Highlighting
```
Layer 0: Original source (bookmark, PDF, article)
Layer 1: Bold key sentences (first pass)
Layer 2: Highlight key phrases from bold (second pass)
Layer 3: Executive summary in own words (third pass)
Layer 4: Atomic notes / concept cards (synthesis)
```

### Implementation in Obsidian/Logseq
```markdown
# Source: "Atomic Habits" by James Clear

## Chapter 1: The Surprising Power of Atomic Habits

**Habits are the compound interest of self-improvement.** 
> **Getting 1% better every day counts for a lot in the long run.**

==Habits are a double-edged sword.== They can work for you or against you.

> ==Small changes often appear to make no difference until you cross a critical threshold.==

### My Summary (Layer 3)
Habits compound like interest. Tiny changes → remarkable results over time. Focus on trajectory, not current results. The plateau of latent potential explains why habits seem ineffective initially.

### Atomic Concepts (Layer 4)
- [[Compound Effect]] - Small improvements compound exponentially
- [[Plateau of Latent Potential]] - Delayed visible results
- [[Identity-Based Habits]] - Focus on who you wish to become
```

## Linking Strategies

### Link Types
| Type | Syntax | Purpose |
|------|--------|---------|
| **Wiki-link** | `[[Note Title]]` | Standard bidirectional link |
| **Alias** | `[[Note Title\|Display Text]]` | Contextual link text |
| **Block reference** | `[[Note#^block-id]]` | Link to specific block |
| **Transclusion** | `![[Note]]` or `![[Note#^block]]` | Embed content |
| **Tag** | `#tag` or `#tag/subtag` | Categorization |
| **Property** | `key:: value` (YAML frontmatter) | Structured metadata |

### Linking Strategies
- **Future self**: Link to where you'll need this
- **Concept maps**: Create MOCs (Maps of Content)
- **Serendipity**: Link seemingly unrelated notes
- **Backlinks**: Review "unlinked mentions" regularly
- **Graph view**: Visualize clusters, find gaps

## Synthesis & Output

### Evergreen Notes
- **Atomic**: One concept per note
- **Dense**: Richly linked
- **Evolving**: Update as understanding deepens
- **Personal**: In your own words
- **Connected**: Bridge concepts

### MOCs (Maps of Content)
```markdown
# MOC: Machine Learning Engineering

## Overview
Central hub for ML engineering concepts, tools, and patterns.

## Core Concepts
- [[MLOps Fundamentals]]
- [[Model Deployment Patterns]]
- [[Feature Engineering]]
- [[Model Monitoring]]

## Tools & Platforms
- [[MLflow]]
- [[Kubeflow]]
- [[Vertex AI]]
- [[Weights & Biases]]

## Patterns
- [[Training Pipeline]]
- [[Feature Store]]
- [[Model Registry]]
- [[A/B Testing]]

## Learning Resources
- [[Course: ML Engineering for Production]]
- [[Book: Designing ML Systems]]
- [[Blog: Chip Huyen]]

## Related MOCs
- [[MOC: Software Engineering]]
- [[MOC: Data Engineering]]
- [[MOC: DevOps]]
```

### Project-Based Output
```
Projects/2024-Q1-ML-Platform/
├── 01-requirements.md
├── 02-architecture.md
├── 03-design-decisions.md
├── 04-implementation-notes/
├── 05-testing-strategy.md
├── 06-deployment-checklist.md
├── 07-retrospective.md
└── Resources/
    ├── papers/
    ├── benchmarks/
    └── references/
```

## Spaced Repetition Integration

### Anki/RemNote Integration
```markdown
# Flashcard: What is the Plateau of Latent Potential?
The period where habits show no visible results despite consistent effort.
#flashcard #concept #habits

# Flashcard: Anki Settings for Long-term Retention
- Again: <1 min
- Good: 10 min
- Easy: 4 days
- Interval modifier: 1.3x
#flashcard #anki #meta
```

### Review Schedule
- **Daily**: Process inboxes, review daily notes
- **Weekly**: Weekly review, Anki review
- **Monthly**: Review MOCs, project progress, goals
- **Quarterly**: Archive, restructure, big-picture review

## Knowledge Synthesis Workflows

### Literature Notes → Permanent Notes
```
1. Read with purpose (question in mind)
2. Highlight/annotate (Layer 1-2)
3. Write literature note: Summary + key quotes + questions
4. Atomize: Split into permanent concept notes
5. Link: Connect to existing knowledge
5. Apply: Use in project/output
```

### Feynman Technique for Notes
1. **Choose concept**
2. **Explain simply** (write as if teaching a 12-year-old)
3. **Identify gaps** (where explanation breaks down)
4. **Return to source** to fill gaps
5. **Simplify & analogize** (create memorable explanation)

### Synthesis Prompts
- "How does X relate to Y?"
- "What would [expert] say about this?"
- "What's the counter-argument?"
- "How would I explain this to a beginner?"
- "What's the first principle here?"
- "Where have I seen this pattern before?"

## Maintenance & Hygiene

### Daily (5 min)
- [ ] Process all inboxes to zero
- [ ] Capture today's thoughts
- [ ] Review daily note

### Weekly (30-60 min)
- [ ] Weekly review (projects, areas, calendar, notes)
- [ ] Process fleeting → permanent notes
- [ ] Review Anki/flashcards
- [ ] Backup verification

### Monthly (1-2 hours)
- [ ] Review MOCs for completeness
- [ ] Archive completed projects
- [ ] Restructure if needed
- [ ] Review tag taxonomy
- [ ] Check backlinks for orphaned notes

### Quarterly (2-4 hours)
- [ ] Major restructure if needed
- [ ] Export/backup verification
- [ ] Tool evaluation
- [ ] Goal alignment review
- [ ] Knowledge audit: What do I know? What gaps?

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| **Collector's fallacy** (hoarding) | Process regularly, delete ruthlessly |
| **Over-organizing** | PARA is enough; don't over-tag |
| **Perfectionism** | "Done is better than perfect" |
| **Tool switching** | Commit to one tool for 6+ months |
| **No output** | Create something weekly from notes |
| **Isolated notes** | Link everything, review backlinks |
| **No review** | Schedule non-negotiable review time |
| **Over-capturing** | Curate: "Will I use this in 6 months?" |

## Advanced Patterns

### Daily Note Template
```markdown
# {{date:YYYY-MM-DD}} {{day}}

## 🎯 Today's Focus
- [ ] Top priority
- [ ] Second priority
- [ ] Third priority

## 📝 Notes & Captures
- 

## 🔗 Links & References
- 

## 💭 Reflections
### What went well?
- 

### What could be better?
- 

### Tomorrow's focus
- 

## 📊 Metrics
- Sleep: hrs
- Exercise: 
- Deep work: hrs
- Mood: /10
```

### Project Note Template
```markdown
# Project: {{name}}

## 🎯 Objective
What does done look like? Success criteria?

## 📋 Tasks
- [ ] Task 1
- [ ] Task 2

## 📚 Resources & References
- [[Link to resource]]
- External: URL

## 💡 Decisions & Rationale
- Decision: Context → Choice → Reasoning

## 🚧 Blockers & Risks
- Blocker: Description → Mitigation

## 📅 Timeline
- Started: {{date}}
- Target: {{date}}
- Milestones:

## 📝 Notes & Scratchpad
- 

## ✅ Retrospective (on completion)
- What worked?
- What didn't?
- Lessons learned?
```

## Resources

### Books
- "Building a Second Brain" - Tiago Forte
- "How to Take Smart Notes" - Sönke Ahrens
- "The Zettelkasten Method" - David Kadavy
- "Obsidian: Second Brain" - various
- "Atomic Habits" - James Clear (for habits around PKM)

### Communities
- r/ObsidianMD, r/logseq, r/roamresearch, r/Zettelkasten
- Obsidian Discord, Logseq Discord
- PKM Discord servers
- r/PKM, r/SecondBrain

### Courses
- "Building a Second Brain" (Forte Labs)
- "Linking Your Thinking" (Nick Milo)
- "Zettelkasten Method" (various)
- "Notion Mastery" (Marie Poulin)

### Newsletters
- Forte Labs Newsletter
- Ness Labs (Anne-Laure Le Cunff)
- Linking Your Thinking
- The Sample (curated newsletters)