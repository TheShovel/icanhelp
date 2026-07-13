if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

const bgFx = document.querySelector(".bg-fx");
if (bgFx) {
  const buddyImgs = [
    "assets/buddyArt/idle.png",
    "assets/buddyArt/talking.png",
    "assets/buddyArt/thinking.png",
    "assets/buddyArt/bash.png",
    "assets/buddyArt/search.png",
  ];
  const icons = [];

  const spawnIcon = () => {
    const img = document.createElement("img");
    img.src = buddyImgs[icons.length % buddyImgs.length];
    img.className = "bg-icon";
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const rot = Math.random() * 360;
    const scale = 1.1 + Math.random() * 0.9;
    img.style.left = `${x}%`;
    img.style.top = `${y}%`;
    bgFx.appendChild(img);
    icons.push({
      el: img,
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      rot: rot,
      vrot: (Math.random() - 0.5) * 40,
      scale,
      r: 28 * scale,
      phase: Math.random() * Math.PI * 2,
      wander: 0.3 + Math.random() * 0.4,
    });
  };

  const iconCountForWindow = () => {
    const area = window.innerWidth * window.innerHeight;
    return Math.max(10, Math.min(260, Math.round(area / 12000)));
  };

  const syncIconCount = () => {
    const want = iconCountForWindow();
    while (icons.length < want) spawnIcon();
    while (icons.length > want) {
      const ic = icons.pop();
      ic.el.remove();
    }
  };

  syncIconCount();

  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncIconCount, 200);
  });

  let gx = window.innerWidth / 2;
  let gy = window.innerHeight / 3;
  const start = performance.now();
  let last = start;

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - start) / 1000;
    gx += (mouse.x - gx) * 0.1;
    gy += (mouse.y - gy) * 0.1;
    bgFx.style.setProperty("--mx", `${gx}px`);
    bgFx.style.setProperty("--my", `${gy}px`);
    bgFx.style.setProperty("--mx2", `${gx + 180}px`);
    bgFx.style.setProperty("--my2", `${gy + 120}px`);

    const W = window.innerWidth;
    const H = window.innerHeight;

    for (const ic of icons) {
      const px = (ic.x / 100) * W;
      const py = (ic.y / 100) * H;
      const dx = px - mouse.x;
      const dy = py - mouse.y;
      const d = Math.hypot(dx, dy) || 0.01;
      if (d < 160) {
        const f = (1 - d / 160) * 1400;
        ic.vx += (dx / d) * f * dt;
        ic.vy += (dy / d) * f * dt;
        ic.vrot += (Math.random() - 0.5) * 60 * dt;
      }
      ic.vx += Math.sin(t * ic.wander + ic.phase) * 60 * dt;
      ic.vy += Math.cos(t * ic.wander * 0.8 + ic.phase) * 60 * dt;
      ic.vrot += Math.sin(t * ic.wander * 1.3 + ic.phase) * 40 * dt;
      ic.vx *= 0.96;
      ic.vy *= 0.96;
      ic.vrot *= 0.95;
      ic.x += (ic.vx * dt / W) * 100;
      ic.y += (ic.vy * dt / H) * 100;
      ic.rot += ic.vrot * dt;
      if (ic.x < 2) { ic.x = 2; ic.vx = Math.abs(ic.vx); }
      if (ic.x > 98) { ic.x = 98; ic.vx = -Math.abs(ic.vx); }
      if (ic.y < 2) { ic.y = 2; ic.vy = Math.abs(ic.vy); }
      if (ic.y > 98) { ic.y = 98; ic.vy = -Math.abs(ic.vy); }
    }

    const cell = 120;
    const cols = Math.ceil(W / cell) + 1;
    const grid = new Map();
    const key = (cx, cy) => cx + cy * cols;
    for (let i = 0; i < icons.length; i++) {
      const ic = icons[i];
      const cx = Math.floor(((ic.x / 100) * W) / cell);
      const cy = Math.floor(((ic.y / 100) * H) / cell);
      const k = key(cx, cy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }
    const checked = new Set();
    for (let i = 0; i < icons.length; i++) {
      const a = icons[i];
      const ax = (a.x / 100) * W;
      const ay = (a.y / 100) * H;
      const cx = Math.floor(ax / cell);
      const cy = Math.floor(ay / cell);
      for (let gx2 = cx - 1; gx2 <= cx + 1; gx2++) {
        for (let gy2 = cy - 1; gy2 <= cy + 1; gy2++) {
          const bucket = grid.get(key(gx2, gy2));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const pairKey = i * 1000 + j;
            if (checked.has(pairKey)) continue;
            checked.add(pairKey);
            const b = icons[j];
            const bx = (b.x / 100) * W;
            const by = (b.y / 100) * H;
            const dx = bx - ax;
            const dy = by - ay;
            const dist = Math.hypot(dx, dy) || 0.01;
            const min = a.r + b.r;
            if (dist < min) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = min - dist;
              a.x -= (nx * overlap) / 2 / W * 100;
              a.y -= (ny * overlap) / 2 / H * 100;
              b.x += (nx * overlap) / 2 / W * 100;
              b.y += (ny * overlap) / 2 / H * 100;
              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const rel = rvx * nx + rvy * ny;
              if (rel < 0) {
                const imp = -(1.4) * rel / 2;
                a.vx -= imp * nx;
                a.vy -= imp * ny;
                b.vx += imp * nx;
                b.vy += imp * ny;
                const spin = (Math.random() - 0.5) * Math.abs(imp) * 4;
                a.vrot -= spin;
                b.vrot += spin;
              }
            }
          }
        }
      }
    }

    for (const ic of icons) {
      const px = (ic.x / 100) * W;
      const py = (ic.y / 100) * H;
      ic.el.style.left = `${ic.x}%`;
      ic.el.style.top = `${ic.y}%`;
      ic.el.style.transform = `translate(-50%, -50%) rotate(${ic.rot}deg) scale(${ic.scale})`;
      const dist = Math.hypot(gx - px, gy - py);
      const op = 0.05 + Math.max(0, 1 - dist / 320) * 0.8;
      ic.el.style.opacity = op.toFixed(3);
    }
    requestAnimationFrame(tick);
  };
  tick(start);
}

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy.replace(/&#10;/g, "\n");
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 1500);
    } catch {
      btn.textContent = "Failed";
    }
  });
});

const terminalTabs = document.querySelector(".terminal-tabs");
if (terminalTabs) {
  terminalTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".terminal-tab");
    if (!tab) return;
    const name = tab.dataset.tab;
    document.querySelectorAll(".terminal-tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
    });
    document.querySelectorAll(".terminal-pane").forEach((p) => {
      p.classList.toggle("active", p.dataset.pane === name);
    });
  });
}

const demo = document.querySelector(".demo-window");
if (demo) {
  const messages = demo.querySelector("#demo-messages");
  const typing = demo.querySelector("#demo-typing");
  const avatar = document.querySelector("#demo-avatar");
  const avatarImg = avatar.querySelector("#demo-avatar-inner");
  const setState = (state) => {
    avatar.className = state ? `avatar-${state}` : "";
    const map = {
      talking: "assets/buddyArt/talking.png",
      thinking: "assets/buddyArt/thinking.png",
      bash: "assets/buddyArt/bash.png",
      search: "assets/buddyArt/search.png",
    };
    avatarImg.src = map[state] || "assets/buddyArt/idle.png";
  };
  const toolIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
  const steps = [
    { who: "user", text: "How do I free space on /var?" },
    {
      who: "assistant",
      text: "I'll check what's using the most space there.",
      tool: { cmd: "du -sh /var/*", out: "1.2G  /var/log\n3.1G  /var/log/journal\n812M  /var/cache" },
    },
    {
      who: "assistant",
      text: "journalctl logs are the biggest item. Want me to purge old entries?",
    },
    { who: "user", text: "Yes, keep the last 2 weeks." },
    {
      who: "assistant",
      text: "Done. Reclaimed 3.1 GB from /var/log/journal.",
      tool: { cmd: "journalctl --vacuum-time=2weeks", out: "Deleted 412 archived journals.\nVacuumed 3.1G." },
    },
  ];

  let i = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function addMessage(step) {
    const row = document.createElement("div");
    row.className = `demo-message ${step.who}`;
    const bubble = document.createElement("div");
    bubble.className = "demo-bubble";
    bubble.textContent = step.text;
    row.appendChild(bubble);
    if (step.tool) {
      const block = document.createElement("div");
      block.className = "demo-tool";
      const header = document.createElement("div");
      header.className = "demo-tool-header";
      header.innerHTML = toolIcon + `<span>${step.tool.cmd}</span>`;
      header.addEventListener("click", () => block.classList.toggle("collapsed"));
      const content = document.createElement("div");
      content.className = "demo-tool-content";
      const cmd = document.createElement("pre");
      cmd.className = "demo-tool-text";
      cmd.textContent = step.tool.cmd;
      const out = document.createElement("div");
      out.className = "demo-tool-output";
      out.textContent = step.tool.out;
      content.appendChild(cmd);
      content.appendChild(out);
      block.appendChild(header);
      block.appendChild(content);
      row.insertBefore(block, bubble);
    }
    messages.insertBefore(row, typing);
    messages.scrollTop = messages.scrollHeight;
  }

  async function run() {
    while (true) {
      const step = steps[i % steps.length];
      if (step.who === "assistant") {
        setState("thinking");
        typing.classList.remove("hidden");
        messages.scrollTop = messages.scrollHeight;
        await wait(950);
        typing.classList.add("hidden");
        setState("talking");
      } else {
        setState("idle");
        await wait(550);
      }
      addMessage(step);
      if (step.tool) {
        setState("bash");
        await wait(700);
      }
      i++;
      await wait(step.who === "user" ? 750 : 1500);
      if (step.who === "assistant") setState("idle");
      if (i % steps.length === 0) {
        await wait(2400);
        messages.querySelectorAll(".demo-message").forEach((n) => n.remove());
        setState("idle");
      }
    }
  }

  run();
}

const kbData = [
  { name: "creative", count: 35, topics: "Music, photography, cooking, baking, sewing, drawing, writing, film, crafts", snippets: [
    "> How do I get a crisp crust on sourdough?\nBake with steam for the first 20 min (a tray of boiling water or a Dutch oven lid), then vent to dry the crust.",
    "> What's the rule of thirds in photography?\nPlace key subjects along the gridlines or at their intersections to create balanced, dynamic compositions.",
    "> How do I keep herbs fresh?\nStore soft herbs like cilantro upright in a jar with water, loosely covered, in the fridge." ] },
  { name: "daily", count: 60, topics: "Life skills, travel, parenting, relationships, career, fitness, car maintenance", snippets: [
    "> How often should I rotate tires?\nEvery 5,000-8,000 mi (or per manual). Rotating spreads wear evenly and extends tire life.",
    "> How do I pack a carry-on efficiently?\nRoll clothes, use packing cubes, and keep essentials in the personal item for a week away.",
    "> What's a good weekly workout split?\nPush/pull/legs or upper/lower, 3-5 sessions, with one rest day and progressive overload." ] },
  { name: "finance", count: 12, topics: "Budgeting, investing, taxes, retirement, credit, small business", snippets: [
    "> What's the 50/30/20 rule?\nAllocate 50% of income to needs, 30% to wants, 20% to savings and debt payoff.",
    "> What's dollar-cost averaging?\nInvest a fixed amount on a schedule regardless of price, smoothing out volatility over time.",
    "> How much emergency fund should I have?\nAim for 3-6 months of essential expenses in a liquid, accessible account." ] },
  { name: "general", count: 27, topics: "History, philosophy, economics, politics, world religions, ethics", snippets: [
    "> What is opportunity cost?\nThe value of the next-best alternative you give up when making a choice.",
    "> What is Occam's razor?\nPrefer the simplest explanation that fits the evidence when alternatives are equal.",
    "> What causes inflation?\nRising prices from too much money chasing too few goods, or supply shocks raising costs." ] },
  { name: "health", count: 50, topics: "Mental health, nutrition, exercise, first aid, sleep, child development", snippets: [
    "> How much sleep does an adult need?\nMost adults do best with 7-9 hours per night for cognition and recovery.",
    "> How do I treat a minor burn?\nCool under running water for 10-20 min, cover loosely, and avoid ice or butter.",
    "> What's a quick grounding technique?\nBox breathing: inhale 4s, hold 4s, exhale 4s, hold 4s, repeat to calm the nervous system." ] },
  { name: "home", count: 37, topics: "Gardening, plumbing, woodworking, electrical, home security, cleaning", snippets: [
    "> How do I stop a small pipe leak temporarily?\nShut the valve, dry the joint, and wrap with self-fusing silicone tape until a permanent fix.",
    "> When should I prune roses?\nLate winter while dormant, cutting above an outward bud at a 45-degree angle.",
    "> How do I reset a tripped breaker?\nFlip it fully off, then back on; if it trips again, there's an overload or fault to find." ] },
  { name: "linux", count: 16, topics: "Bash, systemd, kernel, networking, package management, troubleshooting", snippets: [
    "> How do I see what's listening on a port?\nss -ltnp or sudo lsof -i :PORT shows the process bound to that port.",
    "> How do I find a file by name?\nUse find /path -name 'file*' or locate file for a fast indexed search.",
    "> How do I check disk usage?\ndf -h for filesystems and du -sh * to size up directories." ] },
  { name: "programming", count: 70, topics: "Python, JS/TS, Rust, Go, databases, Docker, Kubernetes, ML, web dev", snippets: [
    "> When should I use a set vs a list in Python?\nUse a set for O(1) membership tests and deduplication; a list when order or repeats matter.",
    "> What's idempotency in APIs?\nRepeating the same request has the same effect as doing it once (safe to retry).",
    "> How do I debug a hanging container?\ndocker logs, then exec in to inspect, and check resource limits and healthchecks." ] },
  { name: "science", count: 32, topics: "Physics, chemistry, biology, neuroscience, climate science, astronomy", snippets: [
    "> Why is the sky blue?\nRayleigh scattering disperses shorter (blue) wavelengths more than red across the atmosphere.",
    "> What is the greenhouse effect?\nAtmospheric gases trap outgoing heat, warming the surface above what sunlight alone would.",
    "> Why do objects fall at the same rate?\nIn a vacuum, gravity accelerates all masses equally; air resistance is what slows feathers." ] },
];

const flowNodes = document.querySelectorAll(".kb-node");
if (flowNodes.length) {
  let fi = 0;
  setInterval(() => {
    flowNodes.forEach((n) => n.classList.remove("active"));
    flowNodes[fi % flowNodes.length].classList.add("active");
    fi++;
  }, 1600);
}

const chips = document.querySelector("#kb-chips");
const detailName = document.querySelector("#kb-detail-name");
const detailCount = document.querySelector("#kb-detail-count");
const detailTopics = document.querySelector("#kb-detail-topics");
const retrieval = document.querySelector("#kb-retrieval");
const snippet = document.querySelector("#kb-snippet");

if (chips) {
  kbData.forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.className = "kb-chip";
    btn.type = "button";
    btn.innerHTML = `<span>${cat.name}</span><span class="kb-chip-count">${cat.count}</span>`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".kb-chip").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      detailName.textContent = cat.name;
      detailCount.textContent = `${cat.count} files`;
      detailTopics.textContent = cat.topics;
      retrieval.hidden = false;
      retrieval.classList.remove("done");
      const label = retrieval.querySelector(".kb-retrieval-label");
      label.textContent = "Retrieving match…";
      snippet.textContent = "";
      retrieval.classList.remove("run");
      void retrieval.offsetWidth;
      retrieval.classList.add("run");
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        const pick = cat.snippets[Math.floor(Math.random() * cat.snippets.length)];
        snippet.textContent = pick;
        label.textContent = "Found a match";
        retrieval.classList.add("done");
      }, 900);
    });
    chips.appendChild(btn);
    if (idx === 0) btn.click();
  });
}

const cards = document.querySelectorAll(".card");
cards.forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform =
      `translateY(-8px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});
