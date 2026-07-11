const path = require("path");
const fs = require("fs");
const { addKnowledge, addKnowledgeBatch } = require("./rag");

var SKILL_DIRS = null;

function getSkillDirs() {
  if (SKILL_DIRS) return SKILL_DIRS;
  var appDir = path.dirname(path.dirname(__dirname));
  SKILL_DIRS = [
    path.join(appDir, "skills"),
    path.join(appDir, ".agents", "skills"),
  ];
  return SKILL_DIRS;
}

function parseFrontmatter(text) {
  var match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return null;
  var yaml = match[1];
  var frontmatter = {};
  yaml.split("\n").forEach(function (line) {
    var sep = line.indexOf(":");
    if (sep === -1) return;
    var key = line.slice(0, sep).trim();
    var val = line.slice(sep + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith("|") || val.startsWith(">")) {
      val = val.slice(1).trim();
    }
    frontmatter[key] = val;
  });
  return { frontmatter: frontmatter, bodyStart: match[0].length };
}

function loadSkill(skillPath) {
  var skillMdPath = path.join(skillPath, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) return null;
  var text = fs.readFileSync(skillMdPath, "utf-8");
  var parsed = parseFrontmatter(text);
  if (!parsed) return null;
  var body = text.slice(parsed.bodyStart).trim();
  var name = parsed.frontmatter.name || path.basename(skillPath);
  var description = parsed.frontmatter.description || "";
  var dirName = path.basename(skillPath);
  return {
    name: name,
    description: description,
    dirName: dirName,
    body: body,
    path: skillPath,
    frontmatter: parsed.frontmatter,
  };
}

function loadAllSkills() {
  var skills = [];
  var dirs = getSkillDirs();
  dirs.forEach(function (baseDir) {
    if (!fs.existsSync(baseDir)) return;
    var entries;
    try {
      entries = fs.readdirSync(baseDir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    entries.forEach(function (entry) {
      if (!entry.isDirectory()) return;
      var skill = loadSkill(path.join(baseDir, entry.name));
      if (skill) skills.push(skill);
    });
  });
  return skills;
}

var cachedSkills = null;

function getAllSkills() {
  if (cachedSkills) return cachedSkills;
  cachedSkills = loadAllSkills();
  return cachedSkills;
}

function findSkills(query) {
  var q = query.toLowerCase();
  var all = getAllSkills();
  var scored = [];
  all.forEach(function (skill) {
    var score = 0;
    if (skill.name.toLowerCase().includes(q)) score += 10;
    if (skill.description.toLowerCase().includes(q)) score += 5;
    if (skill.body && skill.body.toLowerCase().includes(q)) score += 2;
    if (score > 0) scored.push({ skill: skill, score: score });
  });
  scored.sort(function (a, b) {
    return b.score - a.score;
  });
  return scored.map(function (s) {
    return s.skill;
  });
}

function getSkillContext() {
  var all = getAllSkills();
  if (all.length === 0) return "";
  var lines = [
    "## Available Skills",
    "The following skills are available. Load one when the user's request matches its description:",
    "",
  ];
  all.forEach(function (skill) {
    lines.push("- **" + skill.name + "**: " + skill.description);
  });
  return lines.join("\n");
}

function getSkillInstructions(skillNames) {
  var all = getAllSkills();
  var skillMap = {};
  all.forEach(function (s) {
    skillMap[s.name] = s;
    skillMap[s.dirName] = s;
  });
  var resolved = [];
  skillNames.forEach(function (name) {
    var skill = skillMap[name];
    if (skill) resolved.push(skill);
  });
  if (resolved.length === 0) return "";
  var parts = resolved.map(function (s) {
    return (
      "### Skill: " +
      s.name +
      "\n\n" +
      s.description +
      "\n\n" +
      (s.body || "") +
      "\n"
    );
  });
  return parts.join("\n---\n");
}

function refreshCache() {
  cachedSkills = null;
  SKILL_DIRS = null;
}

async function ingestSkillsIntoKnowledge() {
  const all = getAllSkills();
  if (all.length === 0) return JSON.stringify({ ingested: 0 });
  
  const items = all.map(function(skill) {
    return {
      text: "Skill: " + skill.name + "\n\n" + skill.description + "\n\n" + (skill.body || ""),
      metadata: { source: "skills", skill: skill.name, path: skill.dirName },
    };
  });
  
  return await addKnowledgeBatch(items);
}

module.exports = {
  loadAllSkills,
  getAllSkills,
  findSkills,
  getSkillContext,
  getSkillInstructions,
  refreshCache,
  ingestSkillsIntoKnowledge,
};
