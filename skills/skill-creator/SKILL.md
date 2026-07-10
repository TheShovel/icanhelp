---
name: skill-creator
description: Create new skills, modify existing ones, and manage the skill system. Use when the user wants to make a new skill, edit a skill, optimize skill descriptions, or understand how skills work. This is the meta-skill for the skill system.
---

# Skill Creator

A skill for creating new skills and iteratively improving them for this app.

## Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── scripts/ (optional)  - helper scripts for the skill
```

Skills live in the `skills/` directory (for user skills) or `.agents/skills/` (for built-in agent skills).

## Frontmatter Format

```yaml
---
name: my-skill-name
description: A clear, pushy description of what this skill does and when to use it. Include trigger contexts. Make it slightly "pushy" to avoid under-triggering.
---
```

The `description` field is the primary mechanism that determines when the agent loads a skill. Make descriptions specific and include trigger phrases.

## Creating a Skill

### 1. Capture Intent
Understand what the skill should do, when it should trigger, and what output it should produce.

### 2. Write the SKILL.md
Fill in:
- **name**: lowercase, hyphens for spaces
- **description**: what it does + when to trigger. Make it pushy enough that the agent doesn't skip it.
- **body**: clear instructions using imperative form. Explain WHY things matter, not just what to do. Keep under 500 lines. Include examples.

### 3. Test the Skill
Create test prompts and verify the agent uses the skill correctly. Iterate based on results.

### 4. Optimize the Description
The description determines triggering. Make it specific enough that the agent knows when to use it, but not so narrow it misses relevant cases.

## Skill System Details

Skills are loaded from two directories:
- `skills/` — user skills (this is where new skills go)
- `.agents/skills/` — built-in agent skills (clean-code, knowledge-engine)

The agent sees all skill names and descriptions in context. When it calls `start_skill`, the full SKILL.md body is loaded. Skills can include:
- Instructions on when to use tools
- Workflow templates
- Output format specifications
- Domain-specific knowledge
- Links to scripts in a `scripts/` subdirectory

## Writing Effective Skills

- **Use imperative form**: "Do X", "Check Y", "Never Z"
- **Explain the why**: LLMs work better with reasoning, not just rules
- **Include examples**: real input/output pairs help
- **Be specific about triggers**: list exact phrases that should activate the skill
- **Reference tools by name**: tell the agent which tools to use
- **Keep it lean**: remove anything not pulling its weight
- **Progressive disclosure**: keep SKILL.md under 500 lines; use scripts/ for complex logic
