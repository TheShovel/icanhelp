---
name: doc-writer
description: Guide users through creating structured documents — technical specs, decision docs, proposals, guides, and reports. Use when the user wants to write documentation, create a spec, draft a proposal, write a guide, or produce any structured document.
---

# Document Co-Authoring Workflow

Guide the user through creating great documents. This is a structured three-stage process: Context Gathering, Refinement & Structure, and Reader Testing.

## How Document Generation Works

When the user asks for a document to be created:
1. **Research**: Search the web (`search_web`), extract webpage content (`extract_webpage`), and gather information on the topic.
2. **Describe**: Write a short description of what the document should cover. This becomes the guide for the document writer.
3. **Generate**: Call `create_docx(description, filename)`. The system will:
   - Automatically gather all your search results as research context
   - Stop the main conversation
   - Launch a dedicated document-writing session
   - Stream the document content live to the user
   - Create a downloadable `.docx` file

**Important**: Do NOT write the full document content yourself. Research the topic, then call `create_docx` with your description. The system handles the actual writing.

## When to Offer This Workflow

**Trigger conditions**: user mentions writing a doc, draft, proposal, spec, PRD, design doc, RFC, guide, or report.

**Offer**: Explain the three stages and ask if they want to use the structured workflow or work freeform.

## Stage 1: Context Gathering

Close the gap between what the user knows and what you know.

### Initial Questions
Ask about the document:
1. Type (technical spec, decision doc, proposal, guide, report, etc.)
2. Primary audience
3. Desired impact when someone reads it
4. Template or format to follow
5. Constraints or context

### Info Dump
Let the user dump all context freely. Ask clarifying questions (5-10) about gaps afterward. Accept shorthand answers.

**Exit**: Move to Stage 2 when you have enough context to draft.

## Stage 2: Refinement & Structure

Build the document section by section.

### Process per section:
1. **Clarifying questions** — ask 5-10 about what to include
2. **Brainstorm** — generate 5-20 possible points
3. **Curation** — user selects keep/remove/combine
4. **Gap check** — anything important missing?
5. **Draft** — write the section using `write_file` or suggest content
6. **Iterative refinement** — make surgical edits based on feedback

### Section ordering
Start with the section that has the most unknowns (usually the core proposal). Save summaries for last.

### Document structure suggestions by type:
- **Technical spec**: Overview, Architecture, Data Model, API, Implementation Plan, Testing, Deployment
- **Decision doc**: Context, Options Considered, Recommendation, Tradeoffs, Implementation
- **Proposal**: Problem Statement, Solution, Timeline, Resources, Success Metrics
- **Guide**: Overview, Prerequisites, Step-by-Step, Examples, Troubleshooting, FAQ

## Stage 3: Reader Testing

Verify the document works for readers.

1. **Predict questions** — generate 5-10 questions readers might ask
2. **Test** — suggest the user test with a fresh perspective (or use sub-agents if available)
3. **Fix gaps** — address any issues found
4. **Iterate** — until the document communicates clearly to someone without your shared context

## Tips
- For generating the final `.docx`, always use `create_docx(description, filename)` — never try to write the full document inline
- Research the topic thoroughly before generating
- Your description should be a concise summary that guides the document writer
- Prefer markdown for any draft content you write with `write_file`
- Keep language clear and active
- Every sentence should carry weight — cut filler
