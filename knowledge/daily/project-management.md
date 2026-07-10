# Project Management & Agile

## Methodologies

### Waterfall
- Sequential phases: Requirements → Design → Implementation → Testing → Deployment → Maintenance. Each phase completed before next starts. Good for: clear requirements, regulatory (construction, aerospace), fixed scope + budget. Bad for: changing requirements, software (customers don't know what they want until they see it)
  - "We need to build the right thing, all at once, with 100% accuracy." Waterfall phase gates: design reviews → plan freeze → estimate control

### Agile (Manifesto 2001)
- **Four values**: individuals + interactions > processes + tools. Working software > comprehensive documentation. Customer collaboration > contract negotiation. Responding to change > following a plan
- **12 principles**: deliver frequently (2 weeks-2 months). Welcome changing requirements. Business + dev work together daily. Face-to-face conversation. Measure progress by working software. Sustainable pace. Simplicity. Self-organizing teams. Regular reflection + adjustment. Continuous attention to technical excellence

### Scrum
- **Roles**: Product Owner (defines features, prioritizes backlog, communicates with stakeholders). Scrum Master (facilitates process, removes blockers, coaches team). Dev team (cross-functional, 5-9 people, self-organizing, includes all skills needed to deliver product)
- **Events**: Sprint (time box, 1-4 weeks, typically 2). Sprint Planning (select backlog items, define Sprint Goal — what + how, 4 hours for 2-week sprint). Daily Scrum (15 min, what did I do, what will I do, blockers — not a status report to PO; inspect progress + adjust plan). Sprint Review (demo to stakeholders, what was done, what not, adapt backlog). Sprint Retrospective (team improvement: what went well, what to improve, what to try next)
- **Artifacts**: Product Backlog (ordered list of everything needed). Sprint Backlog (selected items + plan to deliver). Increment (done, usable result each sprint). Definition of Done: shared understanding of "done" (coded, tested, documented, deployed to staging, acceptance criteria met)
- **Estimation**: story points (relative effort, not hours — size compared to baseline story). Planning poker (team estimates together, discuss, converge). Velocity: average points per sprint. Use for forecasting

### Kanban
- **Principles**: visualize work (board), limit WIP (work in progress — essential), manage flow, make policies explicit, improve collaboratively
- **Board structure**: columns (To Do, In Progress, Review, Done). WIP limits (max items in each column — prevents bottlenecks, reduces multitasking). Pull based (move when capacity available, not pushed)
  - Lead time (request to delivery) vs Cycle time (work started to delivery). Cumulative flow diagram: visualize trends in lead time, WIP, throughput. Bottleneck: column with items piling up. Use metrics to improve flow
- **Good for**: maintenance/support teams, operations, ongoing work with unpredictable inflow. Often combined with Scrum (Scrumban)

## Hybrid (Waterfall+Agile)
- Waterfall at project level (planning, budget, milestones), Agile at execution level. Common in large organizations. Phase gates for funding approvals, but iterative within phases

## Project Planning

### Work Breakdown Structure (WBS)
- Hierarchical breakdown of work packages. Each level: increasingly detailed. 100% rule: everything is covered by WBS (no gaps or overlaps). Work package: assignable, time-bound, cost-estimatable. Used for: scope definition, estimation, tracking, risk identification
- Example: WBS for app launch: 1.0 Project Mgmt (1.1 Planning, 1.2 Kickoff, 1.3 Status meetings). 2.0 Design (2.1 UX, 2.2 UI). 3.0 Dev (3.1 Frontend, 3.2 Backend, 3.3 API, 3.4 Database). 4.0 Testing. 5.0 Launch (5.1 Deployment, 5.2 Load testing, 5.3 Marketing, 5.4 Launch day). Terminal element: lowest level leaf node

### Critical Path Method (CPM)
- Longest sequence of dependent tasks determines minimum project duration. Float/slack: how much a task can be delayed without affecting project end date. Critical path: zero float — any delay delays project
- Forward pass: calculate earliest start/finish. Backward pass: latest start/finish. Float = LS-ES or LF-EF. Identify critical activities that need most attention

### Risk Management
- Identify: brainstorm, checklists, expert interviews, lessons learned. Assess: probability + impact matrix (high/medium/low). Respond: avoid (change plan), mitigate (reduce probability/impact), transfer (insurance, contract), accept (passive = no action, active = contingency plan, reserve)
  - Risk register: list of risks, probability, impact, owner, response plan, budget reserve. Update throughout project
- Contingency reserve: time + money for known risks. Management reserve: for unknown unknowns (typically 5-10% of total budget). 15% on moderately high risk

## Leadership in Projects
- **RACI matrix**: Responsible (does work), Accountable (approves, ultimate owner — only ONE per task), Consulted (input before decision), Informed (told after decision)
- **Stakeholder analysis**: power/interest grid (manage closely: high power, high interest. Keep satisfied: high power, low interest. Keep informed: low power, high interest. Monitor: low power, low interest). For each stakeholder: agree on communication frequency + channel, address concerns
- **Meetings**: standups (15 min, daily — not status to PO, for team sync). Sprint reviews (demo to stakeholders). Retrospectives (team improvement). 1:1s with team members (coaching, career, feedback). Steering committee (monthly, governance)
  - Meeting metrics: do we need this meeting? Is there an agenda? Are the right people here? Start/end on time. Goal/clear outcome: decision, information, brainstorm

## Estimation Techniques
- **Analogous**: compare to similar past projects (fast, rough). Parametric: use metrics (hours/sq ft, lines/day, story points). Three-point: optimistic, pessimistic, most likely → weighted average (PERT formula: E = (O + 4M + P)/6). Bottom-up: breakdown tasks, estimate each, roll up (most accurate, most time)
- **Wideband Delphi**: experts estimate independently, discuss differences, re-estimate until convergence. Planning poker: Agile version, team estimates in story points (consensus via negotiation)
- **Accuracy**: estimate = range (like $100k-150k — +- 25% at conceptual stage, +-10% at detailed). At initiation: -25%/+75% (Cone of Uncertainty). As project progresses, range narrows. Communicate uncertainty to stakeholders

## Earned Value Management (EVM)
- **Planned Value (PV)**: budgeted cost of planned work. Earned Value (EV): budgeted cost of completed work. Actual Cost (AC): actual cost of completed work
- **Variance**: schedule variance = EV - PV (negative = behind). Cost variance = EV - AC (negative = over budget). Performance indices: SPI = EV/PV (<1 = behind), CPI = EV/AC (<1 = over budget)
- **EAC** (Estimate at Completion): EAC = BAC/CPI (current trend continues). ETC (Estimate to Complete): EAC - AC
- **EVM requires**: detailed WBS, estimated hours/cost, and tracking progress of each work package (measured objectively: 100% complete vs 50% rule? Better: measure milestones, not % complete subjective. 0/100: 0% until task done. 50/50: 50% when started, remaining when finished. 20/80? Custom)

## Tools
- **Jira**: most popular for Agile. Issues, epics, sprints, boards, backlogs. Add-ons, complex admin. Portfolio/Roadmaps in Jira Align. Best for software teams. Can customize workflows, fields, screens. JQL (Jira Query Language) for complex filtering
- **Asana**: simpler, for general project management. Works for non-engineering teams. Timeline (Gantt view), dependencies, milestones, project dashboards
- **Linear**: modern, fast, for product/engineering teams. Clean UX, shortcuts, AI features
- **Microsoft Project**: traditional project management (Gantt charts, resource management, critical path). For construction/manufacturing. Heavier, desktop app
- **Smartsheet**: spreadsheet-like PM tool. Grid + Gantt + automations. Good for non-tech teams
- **Monday.com**: visual PM, flexible boards for all types of workflows. Colorful, customizable, good for cross-department
- **Notion**: docs + project management. Wikis + databases + boards. Flexible, can do agile + documentation + knowledge base. Good for small teams
- **Basecamp**: simple, flat fee ($99/month), to-do lists, message boards, file storage, schedule. Popular for small agencies + client work
