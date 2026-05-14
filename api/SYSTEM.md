# Zettelkasten Knowledge System - Architecture & Workflow

**Version:** Universal Vault Schema v3  
**Last Updated:** 2026-04-28  
**Platform:** Obsidian + Templater

---

## 1. Overview

### What This System Does
This is a **multi-domain knowledge management system** designed for:
- **Lifelong learning** across technical domains (cybersecurity, networking, programming, etc.)
- **Academic excellence** (university courses, test preparation)
- **Professional development** (software architecture, best practices)
- **Knowledge synthesis** (connecting ideas across domains)

### Refactor Mindset Shift
**Before:** Ad-hoc folders, inconsistent structure, manual organization
**After:** Schema-driven, metadata-rich, automation-ready

The refactor transformed the vault from a **digital filing cabinet** into an **intelligent knowledge graph** that supports automation, analytics, and future integrations.

---

## 2. Core Philosophy

### Zettelkasten Principles Applied
- **Atomic notes** - One idea per note, focused and reusable
- **Dense linking** - Every note connects to related concepts
- **Emergent structure** - Organization arises from connections, not folders
- **Non-hierarchical thinking** - Ideas link across domains freely
- **Progressive summarization** - Knowledge becomes more refined over time

### Learning & Thinking Model
1. **Capture** raw information quickly (Daily Capture, inbox)
2. **Process** into structured atomic notes (templates)
3. **Connect** through links and relationships (metadata)
4. **Apply** through practice and reflection (tests, projects)
5. **Refine** based on feedback and new insights

The system is designed for **thinking, not storage** - every structure element serves cognitive processes.

---

## 3. System Architecture (Knowledge Model)

### Note Types & Roles

| Type | Purpose | Template | Key Fields |
|------|---------|----------|------------|
| **Concept** | Core ideas, definitions | Concept Note | definition, why, how, example |
| **Reference** | Technical documentation | Reference Note | syntax, parameters, examples |
| **Framework** | Mental models, methodologies | Framework Note | steps, when to use, example |
| **Rule** | Policies, standards, principles | Rule Note | rule text, examples, edge cases |
| **Procedure** | How-to instructions | Concept Note (modified) | step-by-step, examples |
| **Reflection** | Learning insights, test reviews | Reflection Note | mistakes, lessons, action plan |
| **Source** | Books, papers, research | Source Note | author, key takeaways, quotes |
| **Project** | Active work, goals | Project Note | objectives, progress, next steps |
| **Dashboard** | Overviews, summaries | Daily Capture | priorities, progress, review |

### Relationship Model
```
Source Notes → Concept Notes → Framework Notes → Application Notes
     ↓              ↓              ↓              ↓
   Quotes      Definitions    Methodologies   Practice
     ↓              ↓              ↓              ↓
   Context      Examples       Steps          Reflection
```

---

## 4. Folder / Vault Structure

### Current Layout
```
00 System/           ← System documentation, rules, workflows
01 Knowledge/        ← Core knowledge organized by domain
   ├── cybersecurity/
   ├── networking/
   ├── programming/
   ├── software_engineering/
   ├── university/
   ├── study_systems/
   └── books/
02 Sources/          ← Raw materials, references, research
03 Templates/        ← Note creation templates (Templater)
04 Generated/        ← AI-generated content, automated outputs
05 Dashboards/       ← Analytics, overviews, MOCs
99 Archive/          ← Old notes, deprecated content
```

### Why This Structure
- **Metadata-first organization** - Folders are lightweight, metadata does the heavy lifting
- **Domain scalability** - Easy to add new domains (tcg/, game_design/, etc.)
- **Automation support** - Separate folders for generated content and dashboards
- **System documentation** - 00 System/ keeps meta-knowledge accessible
- **Clean separation** - Raw sources vs processed knowledge vs active work

---

## 5. Linking System

### Connection Types

| Method | Use Case | Example |
|--------|----------|---------|
| **Wikilinks** | Direct concept connections | `[[DNS Cache]]` |
| **Tags** | Multi-dimensional classification | `#networking #security` |
| **Metadata fields** | Structured relationships | `related: [Domain Name System]` |
| **Prerequisites** | Knowledge dependencies | `prerequisites: [IP Addressing]` |
| **MOCs** | Topic organization | `[[DNS MOC]]` |

### Linking Rules
1. **Every note links somewhere** - No orphan notes
2. **Bidirectional linking** - If A links to B, B should reference A
3. **Specific over generic** - Link to exact concepts, not broad topics
4. **Avoid link spam** - Only meaningful connections
5. **Use aliases** for alternative terminology

### Knowledge Graph Emergence
The system creates a **semantic web** where:
- **Nodes** = atomic concepts
- **Edges** = meaningful relationships
- **Clusters** = domain knowledge
- **Bridges** = cross-domain connections
- **Paths** = learning journeys

---

## 6. Workflow: Knowledge Creation Pipeline

### Capture → Process → Distill → Link → Apply

#### **Step 1: Capture**
- Use **Daily Capture** template for quick input
- Capture raw ideas, quotes, questions
- Don't organize yet, just collect

#### **Step 2: Process**
- Choose appropriate template (Concept, Reference, etc.)
- Fill in structured fields using Templater prompts
- Extract core idea from raw material

#### **Step 3: Distill**
- Write in your own words
- Focus on one clear concept per note
- Add examples and context

#### **Step 4: Link**
- Connect to prerequisites (what should they know first?)
- Link to related concepts (what else is relevant?)
- Add tags for domain classification

#### **Step 5: Apply**
- Create practice tests or reflections
- Use concepts in projects
- Update confidence/mastery scores

### Example Workflow
```
Reading: "DNS is like a phonebook for websites"
↓
Capture: Daily Capture - "DNS phonebook analogy"
↓
Process: Concept Note template - "Domain Name System"
↓
Distill: Write definition, why it matters, how it works
↓
Link: prerequisite: IP Addressing, related: DNS Cache
↓
Apply: Practice test question, update confidence
```

---

## 7. Indexing / MOCs (Maps of Content)

### MOC Purpose
MOCs in this system are **curated learning paths**, not just indexes:
- **Domain MOCs** - Overview of entire knowledge domains
- **Topic MOCs** - Deep dives into specific subjects
- **Project MOCs** - Knowledge needed for specific goals

### MOC Structure
```markdown
# DNS MOC (Map of Content)

## Core Concepts
- [[Domain Name System]] - Fundamental definition
- [[DNS Resolution]] - How it works
- [[DNS Cache]] - Performance optimization

## Security Aspects
- [[DNS Spoofing]] - Attack vectors
- [[DNSSEC]] - Security extensions

## Related Domains
- [[Networking MOC]] - Broader context
- [[Web Architecture MOC]] - Application layer
```

### MOC Maintenance
- **Update quarterly** or when adding significant new notes
- **Focus on learning paths**, not exhaustive lists
- **Include progress indicators** (confidence levels)
- **Link to practical applications**

---

## 8. Retrieval Strategy

### Finding Information

#### **Primary Methods**
1. **Metadata search** - Filter by domain, type, confidence
2. **Tag navigation** - Follow conceptual connections
3. **Link traversal** - Jump between related ideas
4. **MOC browsing** - Explore curated knowledge maps

#### **Advanced Retrieval**
- **Weakness targeting** - Find low confidence, high importance notes
- **Prerequisite chains** - Map learning dependencies
- **Cross-domain discovery** - Find unexpected connections
- **Temporal searches** - Track knowledge evolution

### Recall-Enhanced Design
The system supports memory through:
- **Spaced repetition metadata** (confidence, mastery)
- **Multiple retrieval paths** (links, tags, metadata)
- **Contextual connections** (real-world examples)
- **Active recall prompts** (reflection templates)

---

## 9. Refactor Changes Summary

### What Was Improved
- **Schema consistency** - Universal YAML frontmatter across all notes
- **Template automation** - Interactive Templater prompts for consistent creation
- **Domain organization** - Logical grouping instead of ad-hoc folders
- **Metadata richness** - 15+ structured fields per note
- **Future-readiness** - API-compatible structure for integrations

### What Was Removed/Simplified
- **Complex folder hierarchies** - Replaced with metadata organization
- **Inconsistent naming** - Standardized to Title Case
- **Manual link management** - Enhanced with structured relationships
- **Template duplication** - Unified into 7 core templates

### Why New Structure Is Better
- **Scalable** - Easy to add new domains and note types
- **Searchable** - Multi-dimensional filtering and discovery
- **Automatable** - Ready for AI tools and analytics
- **Maintainable** - Clear rules and consistent structure
- **Portable** - Schema can migrate to other platforms

---

## 10. Rules of the System

### Non-Negotiable Rules

1. **No orphan notes** - Every note must link to at least one other note
2. **One concept per note** - Atomic focus, no multi-concept notes
3. **Complete frontmatter** - All required fields filled for every note
4. **Bidirectional linking** - Maintain link reciprocity
5. **Title Case naming** - Consistent, readable file names
6. **Domain classification** - Every note has a specified domain
7. **Confidence tracking** - Update self-assessment regularly

### Strong Guidelines

1. **Write in your own words** - No copy-paste definitions
2. **Include examples** - Every concept needs practical illustration
3. **Link before creating** - Check if concept already exists
4. **Review and refine** - Update notes as understanding deepens
5. **Use templates** - Maintain structural consistency

### Quality Gates

Before considering a note "complete":
- ✅ All frontmatter fields filled
- ✅ At least one outbound link
- ✅ At least one inbound link (or planned)
- ✅ Practical example included
- ✅ Confidence level set
- ✅ Tags applied appropriately

---

## System Evolution

This documentation evolves with the system. Check `updated` field in frontmatter for currency. Major changes are documented in `migration_report.md`.

**Current Status:** ✅ **Production Ready** - Schema v3 implemented, templates active, workflow validated.
