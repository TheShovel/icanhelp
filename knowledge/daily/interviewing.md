# Interviewing Skills

Techniques and preparation for job interviews across behavioral, technical, and case formats.

## STAR Method for Behavioral Questions
- **Situation**: Set the context — "Our team was tasked with migrating a monolith to microservices on a 3-month deadline"
- **Task**: What needed to be done — "I needed to design the API contracts and lead the migration of the payments service"
- **Action**: What YOU specifically did — "I created an adapter pattern to route traffic to both old and new services, set up canary deployments in Kubernetes, and wrote integration tests"
- **Result**: Outcome with metrics — "Migration completed 2 weeks early, zero downtime, payments latency reduced 40%"
- Common STAR questions: "Tell me about a time you handled conflict", "Describe a failure", "Talk about a challenging project"

## Preparation
- **Research company**: Products, mission, recent news, funding, competitors, culture (Glassdoor, Blind)
- **Research interviewers** (if known): LinkedIn to find common ground or their expertise
- **Prepare 3-5 stories**: Each demonstrates different skills (leadership, technical, conflict, failure, innovation)
- **Practice answers**: Record yourself, time responses (keep to 60-90 seconds for most answers)
- **Questions to ask**: "What does success look like in this role?", "What's the biggest challenge the team faces?", "How is performance evaluated?"

## Technical Interviews
- **Phone screen**: 30-45 min — high-level experience check, one easy-medium coding problem
- **Coding (whiteboard)**: Live coding — think aloud ("Let me reason through this..."), communicate approach before writing, test with examples
- **System design**: 45-60 min — design a large-scale system (Twitter, URL shortener, Uber) — focus on tradeoffs, scalability, data flow
- **Take-home project**: Given 2-4 hours (or 7 days) — clean code, tests, README, deploy if relevant — don't over-engineer
- **Pair programming**: Work with an engineer on real or simulated task — communication and collaboration evaluated

## Coding Interview Tips
- **Clarify requirements**: Ask about inputs, outputs, edge cases, constraints (time, memory) before coding
- **Think out loud**: Say "I'm considering a hash map for O(1) lookup but space complexity would be O(n)"
- **Start with brute force** then optimize — shows you can iterate
- **Test manually**: Walk through example input, then edge cases (empty, null, duplicates, large values)
- **Clean code**: Good variable names, helper functions, no dead code, handle errors
- If stuck: "Let me think... I could try a different approach" — interviewer may hint

## System Design Framework
- **Step 1: Requirements** — Functional (features) + Non-functional (scale, latency, availability, durability)
- **Step 2: Estimations** — Daily active users, data volume, request rate (QPS), storage needs
- **Step 3: Data model** — Schema, data stores (SQL vs NoSQL, blob, cache)
- **Step 4: High-level design** — Components, APIs, data flow diagram
- **Step 5: Deep dive** — Specific bottlenecks: database sharding, caching strategy, load balancing, CDN
- **Step 6: Tradeoffs** — Consistency vs availability (CAP theorem), SQL vs NoSQL, sync vs async
- Common systems: URL shortener, chat system, Netflix, WhatsApp, Uber, Dropbox

## Types of Interviews
- **Behavioral**: "Tell me about yourself", conflict resolution, leadership, failure, teamwork
- **Technical phone screen**: Live coding or paired coding via CoderPad/Google Docs
- **On-site loop**: 4-6 back-to-back — coding, system design, behavioral, lunch, sometimes cross-functional
- **Whiteboarding**: Pen+paper or whiteboard — no IDE, focus on logic and problem-solving approach
- **Presentation**: Explain a past project — technical depth, impact, tradeoffs, what you'd do differently
- **Panel**: Multiple interviewers — often cross-functional (product, design, engineering)
- **Hiring manager**: Focused on experience, leadership, team fit, career goals

## Negotiation
- **Don't give a number first**: "I'd like to learn more about the role first" — let them name the salary range
- **Research market**: Levels.fyi, Glassdoor, Blind, LinkedIn Salary — know 25th, 50th, 75th percentiles
- **Total compensation**: Base salary + bonus + equity (RSUs or options) + signing bonus + 401k match + benefits
- **Leverage offers**: "I have another offer at $X" — competition increases your bargaining power
- **Non-salary negotiation**: Remote days, title, start date, vacation time, education budget, equipment
- **Always negotiate**: First offer is rarely best — hiring managers expect pushback
