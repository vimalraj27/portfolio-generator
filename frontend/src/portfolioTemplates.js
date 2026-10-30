const themes = {
  "software-developer": {
    className: "developer",
    color: "#a78bfa",
    softColor: "#2b2250",
    heroLabel: "Independent engineer",
    headline: "I turn complex ideas into useful software.",
    introLabel: "BUILDING FOR THE WEB",
    projectsLabel: "Selected builds",
  },
  "ui-ux-designer": {
    className: "designer",
    color: "#fb7185",
    softColor: "#fff0f2",
    heroLabel: "Independent designer",
    headline: "Making digital feel a little more human.",
    introLabel: "DESIGNING WITH INTENTION",
    projectsLabel: "Selected case studies",
  },
  "data-analyst": {
    className: "analyst",
    color: "#22d3ee",
    softColor: "#102e3a",
    heroLabel: "Insight translator",
    headline: "Better questions. Clearer answers.",
    introLabel: "SIGNAL OVER NOISE",
    projectsLabel: "Analytics case files",
  },
  "marketing-manager": {
    className: "marketer",
    color: "#f59e0b",
    softColor: "#fff0d6",
    heroLabel: "Growth builder",
    headline: "Big ideas, built to move people.",
    introLabel: "CREATIVE THAT CONNECTS",
    projectsLabel: "Campaign highlights",
  },
  "product-manager": {
    className: "product",
    color: "#34d399",
    softColor: "#e8fbf2",
    heroLabel: "Customer advocate",
    headline: "Good products start with better questions.",
    introLabel: "FROM CUSTOMER NEED TO SHIPPED PRODUCT",
    projectsLabel: "Product roadmap",
  },
}

export const portfolioStyles = [
  { id: "glassmorphism", label: "Glassmorphism", description: "Frosted glass, soft blur, and layered translucent cards.", swatch: ["#d9ceff", "#fff", "#a78bfa"] },
  { id: "kinetic-ui", label: "Kinetic UI", description: "Bold color blocks, oversized type, and high-energy motion.", swatch: ["#ff7959", "#f7e844", "#2923a8"] },
  { id: "neumorphism", label: "Neumorphism", description: "Soft raised surfaces, gentle shadows, and tactile controls.", swatch: ["#dce4ef", "#f2f5fa", "#abb9cf"] },
  { id: "bento-grid", label: "Bento grid", description: "A modular grid of crisp, editorial content cards.", swatch: ["#d4f7bd", "#f5f4ed", "#b8d7a4"] },
  { id: "dark-grid", label: "Dark mode + grid", description: "A precise dark canvas with a subtle technical grid.", swatch: ["#111827", "#1f2937", "#7c9cff"] },
  { id: "claymorphism", label: "Claymorphism", description: "Friendly, rounded surfaces with playful depth.", swatch: ["#ffcfdd", "#f5e1ff", "#d4a2ff"] },
]

const styleIds = new Set(portfolioStyles.map((style) => style.id))

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character])
}

function safeLink(value) {
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url.href : ""
  } catch {
    return ""
  }
}

function phoneLink(value) {
  const phone = String(value || "").trim()
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 15
    ? `tel:${phone.startsWith("+") ? "+" : ""}${digits}`
    : ""
}

function renderProjects(portfolio, theme) {
  if (theme.className === "developer") {
    return portfolio.projects.map((project, index) => `
      <article class="project-card code-card">
        <div class="code-window"><span></span><span></span><span></span><b>project-${String(index + 1).padStart(2, "0")}</b></div>
        <p class="project-kind">BUILD / ${String(index + 1).padStart(2, "0")}</p>
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
        ${safeLink(project.link) ? `<a class="text-link" href="${safeLink(project.link)}" target="_blank" rel="noopener noreferrer">Explore the build <span>↗</span></a>` : ""}
      </article>`).join("")
  }

  if (theme.className === "designer") {
    return portfolio.projects.map((project, index) => `
      <article class="project-card design-card">
        <div class="design-art art-${index % 4}" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span><i></i><b></b></div>
        <div class="design-caption"><div><p class="project-kind">CASE STUDY / ${String(index + 1).padStart(2, "0")}</p><h3>${escapeHtml(project.title)}</h3></div>${safeLink(project.link) ? `<a class="round-link" aria-label="View ${escapeHtml(project.title)}" href="${safeLink(project.link)}" target="_blank" rel="noopener noreferrer">↗</a>` : ""}</div>
        <p>${escapeHtml(project.description)}</p>
      </article>`).join("")
  }

  if (theme.className === "analyst") {
    return portfolio.projects.map((project, index) => `
      <article class="project-card analysis-card">
        <div class="analysis-top"><span class="analysis-index">0${index + 1}</span><span class="status-dot">CASE FILE</span></div>
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
        <div class="analysis-sparkline" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        ${safeLink(project.link) ? `<a class="text-link" href="${safeLink(project.link)}" target="_blank" rel="noopener noreferrer">Open analysis ↗</a>` : ""}
      </article>`).join("")
  }

  if (theme.className === "marketer") {
    return portfolio.projects.map((project, index) => `
      <article class="project-card campaign-card campaign-${index % 3}">
        <div class="campaign-label"><span>CAMPAIGN 0${index + 1}</span><span>✳</span></div>
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
        <div class="campaign-bottom"><span>STRATEGY · CREATIVE · GROWTH</span>${safeLink(project.link) ? `<a aria-label="View ${escapeHtml(project.title)}" href="${safeLink(project.link)}" target="_blank" rel="noopener noreferrer">↗</a>` : ""}</div>
      </article>`).join("")
  }

  return portfolio.projects.map((project, index) => `
    <article class="roadmap-item">
      <div class="roadmap-marker"><span>0${index + 1}</span></div>
      <div class="project-card roadmap-card"><p class="project-kind">PRODUCT MILESTONE / ${String(index + 1).padStart(2, "0")}</p><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
      ${safeLink(project.link) ? `<a class="text-link" href="${safeLink(project.link)}" target="_blank" rel="noopener noreferrer">Explore the product ↗</a>` : ""}</div>
    </article>`).join("")
}

function renderRoleVisual(portfolio, theme) {
  if (theme.className === "developer") {
    return `<aside class="hero-visual code-visual" aria-label="Code-themed illustration"><div class="visual-bar"><i></i><i></i><i></i><span>about-me.js</span></div><pre><span>01</span> const <b>builder</b> = {<br><span>02</span>   curiosity: <em>true</em>,<br><span>03</span>   ideas: <em>"made real"</em>,<br><span>04</span>   projects: <em>${portfolio.projects.length}</em><br><span>05</span> };</pre><div class="code-status"><i></i> available for good problems</div></aside>`
  }
  if (theme.className === "designer") {
    return `<aside class="hero-visual collage-visual" aria-label="Abstract design collage"><span class="collage-orbit"></span><span class="collage-sun"></span><span class="collage-card">make<br>room<br>for <i>better.</i></span><span class="collage-note">IDEAS → INTERFACES</span></aside>`
  }
  if (theme.className === "analyst") {
    return `<aside class="hero-visual dashboard-visual" aria-label="Illustrative analytics dashboard"><div class="dash-heading"><span>INSIGHT SNAPSHOT</span><b>•••</b></div><div class="dash-number"><strong>${String(portfolio.projects.length).padStart(2, "0")}</strong><span>case studies</span></div><div class="dash-chart">${[38, 58, 45, 72, 54, 84, 64, 96, 70, 88, 62, 100].map((height) => `<i style="--bar:${height}%"></i>`).join("")}</div><div class="dash-legend"><i></i> from question to measurable impact</div></aside>`
  }
  if (theme.className === "marketer") {
    return `<aside class="hero-visual campaign-visual" aria-label="Campaign-inspired typography"><span class="campaign-sticker">GOOD<br>IDEAS<br>GROW</span><div class="campaign-orbit">✳</div><span class="campaign-small">REACH<br>THE RIGHT<br>PEOPLE.</span><span class="campaign-foot">STRATEGY THAT STICKS.</span></aside>`
  }
  return `<aside class="hero-visual product-visual" aria-label="Product roadmap illustration"><div class="product-window"><div class="product-window-head"><span>THE PRODUCT LOOP</span><i>● ● ●</i></div><div class="loop-row"><b>01</b><span><strong>Listen</strong><small>Find the real problem</small></span><i>✓</i></div><div class="loop-row"><b>02</b><span><strong>Shape</strong><small>Make a focused plan</small></span><i>✓</i></div><div class="loop-row active"><b>03</b><span><strong>Ship</strong><small>Learn from real people</small></span><i>↗</i></div><div class="loop-footer"><span>${portfolio.projects.length} milestones</span><span>OUTCOMES OVER OUTPUTS</span></div></div></aside>`
}

function renderPortfolio(portfolio) {
  const theme = themes[portfolio.role] || themes["software-developer"]
  const styleId = styleIds.has(portfolio.style) ? portfolio.style : "dark-grid"
  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : []
  const skills = Array.isArray(portfolio.skills) ? portfolio.skills : []
  const highlights = portfolio.template?.highlights || []
  const fullName = escapeHtml(portfolio.name)
  const firstName = fullName.trim().split(/\s+/)[0] || "Portfolio"
  const roleName = escapeHtml(portfolio.roleLabel || portfolio.role)
  const email = escapeHtml(portfolio.email)
  const phone = escapeHtml(portfolio.phone || "")
  const phoneHref = phoneLink(portfolio.phone)
  const about = escapeHtml(portfolio.about)
  const skillTags = skills.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join("")
  const skillMarkup = skillTags || '<span class="skill-tag">Curiosity</span>'
  const projectMarkup = renderProjects({ ...portfolio, projects }, theme)
  const highlightMarkup = highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
  const roleVisual = renderRoleVisual({ ...portfolio, projects }, theme)
  const projectContainer = theme.className === "product" ? "roadmap" : `${theme.className}-projects`
  const isDeveloper = theme.className === "developer"
  const initials = String(portfolio.name || "Developer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
  const navigationLinks = isDeveloper
    ? '<a href="#introduction">Introduction</a><a href="#profile">Profile</a><a href="#about">About</a><a href="#skills">Skills</a><a href="#work">Projects</a><a href="#contact">Contact</a>'
    : `<a href="#about">About</a><a href="#work">${escapeHtml(portfolio.template?.focus || "Work")}</a><a href="#contact">Contact</a>`
  const roleSections = isDeveloper
    ? `<header class="hero developer-hero" id="introduction">
      <div class="hero-copy"><p class="eyebrow">01 / INTRODUCTION</p><p class="role-label">${roleName} <span>·</span> ${escapeHtml(theme.heroLabel)}</p><h1>${fullName}<br><span>${escapeHtml(theme.headline)}</span></h1><p class="intro">I design, build, and ship thoughtful digital experiences, from the first idea to production.</p><a class="contact-button" href="#work">Explore my projects <span>↓</span></a></div>
      <div class="hero-index"><span>SOFTWARE DEVELOPER / ${new Date().getFullYear()}</span><span>SCROLL TO EXPLORE ↓</span></div>
    </header>
    <section class="developer-profile-section" id="profile"><div class="section-kicker"><span>02</span><h2>Profile</h2></div><div class="developer-profile-card">
      <div class="profile-identity"><div class="profile-avatar">${escapeHtml(initials)}</div><p class="profile-status"><i></i> OPEN TO OPPORTUNITIES</p><h3>${fullName}</h3><p>${roleName}</p><a href="mailto:${email}">${email}</a>${phoneHref ? `<a href="${phoneHref}">${phone}</a>` : ""}</div>
      <div class="profile-details"><div><span>FOCUS</span><strong>Thoughtful software</strong></div><div><span>PROJECTS</span><strong>${String(projects.length).padStart(2, "0")} selected builds</strong></div><div><span>TOOLKIT</span><strong>${String(skills.length).padStart(2, "0")} skills &amp; technologies</strong></div><div><span>APPROACH</span><strong>Build · learn · improve</strong></div></div>
      ${roleVisual}
    </div></section>
    <section class="developer-about-section" id="about"><div class="section-kicker"><span>03</span><h2>About</h2></div><div class="developer-about-copy"><p class="eyebrow">A LITTLE MORE ABOUT ME</p><p>${about}</p></div></section>
    <section class="skills-section" id="skills"><div class="section-kicker"><span>04</span><h2>Tools I build with</h2></div><div class="skill-list">${skillMarkup}</div></section>
    <section class="work-section" id="work"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(theme.projectsLabel)}</p><h2>${escapeHtml(portfolio.template?.focus || "Selected work")}</h2></div><span class="work-count">${String(projects.length).padStart(2, "0")} ${projects.length === 1 ? "PROJECT" : "PROJECTS"}</span></div><div class="${projectContainer}">${projectMarkup || '<p class="empty-projects">New projects are on the way.</p>'}</div></section>`
    : `<header class="hero" id="introduction">
      <div class="hero-copy"><p class="eyebrow">${escapeHtml(theme.introLabel)}</p><p class="role-label">${roleName} <span>·</span> ${escapeHtml(theme.heroLabel)}</p><h1>${fullName}<br><span>${escapeHtml(theme.headline)}</span></h1><p class="intro" id="about">${about}</p><a class="contact-button" href="mailto:${email}">Say hello <span>↗</span></a></div>
      ${roleVisual}
      <div class="hero-index"><span>PORTFOLIO / ${new Date().getFullYear()}</span><span>SCROLL TO EXPLORE ↓</span></div>
    </header>
    <section class="skills-section" id="skills"><div class="section-kicker"><span>01</span><h2>${theme.className === "analyst" ? "Tools in the stack" : theme.className === "product" ? "My working toolkit" : theme.className === "marketer" ? "The toolkit" : "Things I work with"}</h2></div><div class="skill-list">${skillMarkup}</div></section>
    <section class="work-section" id="work"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(theme.projectsLabel)}</p><h2>${escapeHtml(portfolio.template?.focus || "Selected work")}</h2></div><span class="work-count">${String(projects.length).padStart(2, "0")} ${projects.length === 1 ? "PROJECT" : "PROJECTS"}</span></div><div class="${projectContainer}">${projectMarkup || '<p class="empty-projects">New projects are on the way.</p>'}</div></section>
    <section class="approach-section"><div><p class="eyebrow">${escapeHtml(portfolio.template?.highlightsTitle || "How I work")}</p><h2>${theme.className === "designer" ? "Good design is a feeling—and a function." : theme.className === "analyst" ? "Every chart starts with a better question." : theme.className === "marketer" ? "Make the message matter." : "Make the right thing, the right way."}</h2></div><ul>${highlightMarkup}</ul></section>`

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${about}">
  <title>${fullName} — ${roleName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="${theme.className} style-${styleId}" style="--accent:${theme.color};--accent-soft:${theme.softColor}">
  <nav class="site-nav"><a class="brand" href="#top">${firstName}<span>.</span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">Menu</button><div class="nav-links" id="nav-links">${navigationLinks}</div></nav>
  <main id="top">
    ${roleSections}
    <footer id="contact"><p class="eyebrow">HAVE A GOOD ONE IN MIND?</p><h2>Let’s make it happen.</h2><a class="footer-email" href="mailto:${email}">${email}<span>↗</span></a>${phoneHref ? `<a class="footer-email" href="${phoneHref}">${phone}<span>↗</span></a>` : ""}<div class="footer-bottom"><span>${fullName} · ${roleName}</span><span>© <span data-year>${new Date().getFullYear()}</span> Built with intention.</span></div></footer>
  </main>
  <script src="script.js"></script>
</body>
</html>`
  return { html, css: buildStyles(theme, styleId), js: buildScript() }
}

function buildStyles(theme, styleId) {
  return `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{font-family:'DM Sans',sans-serif;color:#f5f3f0;background:#11110f;font-synthesis:none;text-rendering:optimizeLegibility;scroll-behavior:smooth}*{box-sizing:border-box}body{--page:#11110f;--surface:#191917;--line:#ffffff20;--muted:#a19f99;--text:#f5f3f0;margin:0;background:var(--page);color:var(--text)}body.designer{--page:#fff9f6;--surface:#fff;--line:#38251a20;--muted:#786b67;--text:#2c2524}body.analyst{--page:#07131a;--surface:#0d2029;--line:#a6e6f11f;--muted:#9bb2bb;--text:#eff9fb}body.marketer{--page:#fff5e7;--surface:#fffaf2;--line:#33200d26;--muted:#70604c;--text:#261b10}body.product{--page:#f4f8f5;--surface:#fff;--line:#143b2b20;--muted:#617269;--text:#17251e}a{color:inherit;text-decoration:none}.site-nav{height:74px;padding:0 7vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font:800 22px Manrope,sans-serif;letter-spacing:-.08em}.brand span{color:var(--accent)}.nav-links{display:flex;gap:32px;font-size:13px;color:var(--muted)}.nav-links a:hover{color:var(--accent)}.nav-toggle{display:none}.hero{max-width:1280px;min-height:570px;margin:auto;padding:92px 7vw 70px;display:grid;grid-template-columns:1.04fr .96fr;align-items:center;gap:44px;position:relative}.eyebrow,.role-label,.project-kind,.hero-index,.work-count,.campaign-label,.analysis-index,.status-dot,.dash-heading,.dash-legend,.visual-bar,.code-status,.campaign-small,.campaign-foot,.campaign-bottom,.product-window-head,.loop-footer,.nav-toggle{font:500 10px 'DM Mono',monospace;letter-spacing:.11em}.eyebrow{color:var(--accent)}.role-label{margin:22px 0 0;color:var(--muted);letter-spacing:.04em}.role-label span{color:var(--accent)}h1,h2,h3,p{margin-top:0}h1{font:800 clamp(45px,7vw,86px)/.99 Manrope,sans-serif;letter-spacing:-.075em;margin:19px 0 20px;max-width:720px}h1 span{color:var(--accent)}.intro{max-width:530px;font-size:15px;line-height:1.85;color:var(--muted)}.contact-button{display:inline-flex;gap:30px;align-items:center;padding:13px 17px;margin-top:18px;background:var(--accent);color:#111;border-radius:4px;font-size:12px;font-weight:700}.contact-button span{font-size:17px}.hero-visual{min-height:310px;position:relative;overflow:hidden}.hero-index{position:absolute;bottom:25px;left:7vw;right:7vw;display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.skills-section,.work-section,.approach-section,footer{padding:76px max(7vw,24px);border-top:1px solid var(--line)}.skills-section{display:grid;grid-template-columns:240px 1fr;gap:25px;align-items:start}.section-kicker{display:flex;align-items:center;gap:15px}.section-kicker>span{font:11px 'DM Mono',monospace;color:var(--accent)}.section-kicker h2,.section-heading h2{font:700 23px Manrope,sans-serif;letter-spacing:-.045em;margin:0}.skill-list{display:flex;flex-wrap:wrap;gap:10px}.skill-tag{padding:9px 13px;border:1px solid var(--line);border-radius:3px;font-size:12px;color:var(--muted)}.section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:32px}.section-heading .eyebrow{margin-bottom:10px}.work-count{color:var(--muted)}.project-card{background:var(--surface);border:1px solid var(--line);padding:24px}.project-card h3{font:700 20px Manrope,sans-serif;letter-spacing:-.04em;margin:10px 0}.project-card>p:not(.project-kind){font-size:13px;line-height:1.75;color:var(--muted)}.project-kind{font-size:9px;color:var(--accent)}.text-link{display:inline-block;margin-top:12px;color:var(--accent);font-size:12px;font-weight:700}.approach-section{display:grid;grid-template-columns:1fr .8fr;gap:60px;align-items:center;background:var(--surface)}.approach-section h2{font:700 clamp(26px,4vw,46px)/1.12 Manrope,sans-serif;letter-spacing:-.06em;max-width:650px;margin:12px 0 0}.approach-section ul{list-style:none;padding:0;margin:0;display:grid;gap:13px}.approach-section li{padding:0 0 13px;border-bottom:1px solid var(--line);font-size:13px;color:var(--muted)}.approach-section li:before{content:'↗';color:var(--accent);margin-right:12px}footer{padding-top:76px;padding-bottom:24px}footer h2{font:800 clamp(38px,7vw,76px)/1 Manrope,sans-serif;letter-spacing:-.07em;margin:13px 0 20px}.footer-email{display:inline-flex;gap:20px;align-items:center;color:var(--accent);font-size:15px}.footer-bottom{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:68px;padding-top:19px;color:var(--muted);font-size:10px}.empty-projects{color:var(--muted);font-size:14px}
/* Software: terminal panels and a compact engineering project grid. */
.developer .hero-visual{border:1px solid #a78bfa45;background:radial-gradient(ellipse at 70% 20%,#443269 0,transparent 58%),#17151f}.code-visual{padding:0 24px}.visual-bar{height:48px;display:flex;align-items:center;gap:7px;border-bottom:1px solid #ffffff20;color:#a6a2af}.visual-bar i,.code-window span{width:7px;height:7px;border-radius:50%;background:#fb7185}.visual-bar i:nth-child(2),.code-window span:nth-child(2){background:#fbbf24}.visual-bar i:nth-child(3),.code-window span:nth-child(3){background:#34d399}.visual-bar span{margin-left:12px}.code-visual pre{font:13px/2 'DM Mono',monospace;color:#e4ddf6}.code-visual pre>span{color:#777187;margin-right:16px}.code-visual pre b{color:#c4b5fd}.code-visual pre em{color:#86efac;font-style:normal}.code-status{color:#aaa4b5;font-size:9px}.code-status i,.dash-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:8px}.developer-profile-section,.developer-about-section{padding:76px max(7vw,24px);border-top:1px solid var(--line)}.developer-profile-card{display:grid;grid-template-columns:minmax(170px,.72fr) 1fr minmax(240px,1fr);gap:30px;align-items:center;margin-top:30px;padding:30px;background:var(--surface);border:1px solid #a78bfa3d;border-radius:7px;box-shadow:0 24px 70px #08071040}.profile-identity{min-width:0}.profile-avatar{width:78px;height:78px;display:grid;place-items:center;margin-bottom:22px;border-radius:21px;background:linear-gradient(145deg,#a78bfa,#7050ca);color:#17131f;font:800 26px Manrope,sans-serif;letter-spacing:-.06em;box-shadow:0 12px 30px #a78bfa35}.profile-status{display:flex;align-items:center;gap:7px;color:#86efac;font:500 8px 'DM Mono',monospace;letter-spacing:.08em}.profile-status i{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 12px #4ade8080}.profile-identity h3{margin:12px 0 3px;font:700 19px Manrope,sans-serif;letter-spacing:-.04em}.profile-identity>p:not(.profile-status){margin:0 0 13px;color:var(--muted);font-size:12px}.profile-identity>a{color:var(--accent);font-size:11px;overflow-wrap:anywhere}.profile-details{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:5px}.profile-details>div{min-height:91px;padding:17px;border-bottom:1px solid var(--line)}.profile-details>div:nth-child(odd){border-right:1px solid var(--line)}.profile-details>div:nth-last-child(-n+2){border-bottom:0}.profile-details span{display:block;margin-bottom:9px;color:var(--accent);font:500 8px 'DM Mono',monospace;letter-spacing:.12em}.profile-details strong{font:600 11px/1.5 'DM Sans',sans-serif}.developer-profile-card .hero-visual{min-height:245px;border-radius:4px}.developer-about-section{display:grid;grid-template-columns:.7fr 1fr;gap:40px;align-items:start;background:#15141a}.developer-about-copy{max-width:760px}.developer-about-copy>p:not(.eyebrow){font:500 clamp(20px,3vw,31px)/1.55 Manrope,sans-serif;letter-spacing:-.035em;color:#e2ddef}.developer-about-copy .eyebrow{margin-bottom:20px}.developer-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.code-card{padding:0 20px 20px}.code-window{height:39px;margin:0 -20px 20px;padding:0 14px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line)}.code-window span{width:6px;height:6px}.code-window b{margin-left:8px;color:var(--muted);font:10px 'DM Mono',monospace}
/* Designer: light editorial canvas, abstract collage and image-like project tiles. */
.designer .hero-visual{background:#f8dce2;border-radius:48% 48% 3px 3px;min-height:330px}.collage-orbit{position:absolute;width:230px;height:230px;border:1px solid #d3526b;border-radius:50%;left:17%;top:14%}.collage-orbit:after{content:'';position:absolute;inset:23px;border:1px dashed #d3526b;border-radius:50%}.collage-sun{position:absolute;width:115px;height:115px;background:#f5a37d;border-radius:50%;right:19%;top:13%}.collage-card{position:absolute;left:25%;top:29%;background:#fef9f4;padding:20px 28px;box-shadow:8px 10px 0 #d35a7060;font:800 28px/.98 Manrope,sans-serif;letter-spacing:-.06em;transform:rotate(-7deg);color:#392631}.collage-card i{color:#db5571}.collage-note{position:absolute;bottom:23px;right:20px;font:9px 'DM Mono',monospace;letter-spacing:.1em;color:#704d59}.designer-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.design-card{padding:0;border:0;background:transparent}.design-art{height:220px;position:relative;overflow:hidden;border-radius:3px;background:#f4d8dc}.art-1{background:#dce9e5}.art-2{background:#e8e0f3}.art-3{background:#f2e4c8}.design-art span{position:absolute;top:15px;left:17px;font:12px 'DM Mono',monospace;color:#594b4e}.design-art i{position:absolute;width:125px;height:125px;left:35%;top:22%;border-radius:48% 52% 56% 44%;background:#e98591;transform:rotate(-25deg)}.art-1 i{background:#789e91;border-radius:50% 50% 8px 8px}.art-2 i{background:#a891c3;transform:rotate(45deg);border-radius:12px}.art-3 i{background:#d4a84d;border-radius:50%}.design-art b{position:absolute;width:75px;height:75px;left:53%;top:39%;border:1px solid #fff;border-radius:50%}.design-caption{display:flex;justify-content:space-between;align-items:center;margin-top:18px}.design-caption h3{margin-bottom:8px}.round-link{width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;color:var(--accent)}.design-card>p{font-size:13px;line-height:1.75;color:var(--muted)}
/* Analyst: dark data dashboard, chart-led hero and case-file cards. */
.analyst .hero-visual{padding:25px;background:#0d2029;border:1px solid #8addeb24;border-radius:6px}.dash-heading{display:flex;justify-content:space-between;color:#91acb5}.dash-number{display:flex;align-items:baseline;gap:10px;margin-top:32px}.dash-number strong{font:700 56px Manrope,sans-serif;color:#ecfeff}.dash-number span{font-size:12px;color:#91acb5}.dash-chart{height:115px;display:flex;align-items:end;gap:8px;margin-top:8px;border-bottom:1px solid #a1e2ee32;background:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,#a1e2ee12 28px)}.dash-chart i{flex:1;height:var(--bar);background:linear-gradient(to top,#087e91,#5eead4);border-radius:3px 3px 0 0}.dash-legend{margin-top:13px;color:#91acb5;font-size:9px}.dash-legend i{background:#5eead4}.analyst-projects{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.analysis-card{border-radius:4px}.analysis-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.analysis-index{font-size:20px;color:var(--accent)}.status-dot{color:#8fe8dc;font-size:8px}.status-dot:before{content:'';display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%;margin-right:7px}.analysis-sparkline{height:35px;display:flex;align-items:end;gap:4px;border-bottom:1px solid var(--line);margin:18px 0 8px}.analysis-sparkline i{width:8%;height:var(--h,50%);background:var(--accent);opacity:.68;border-radius:2px 2px 0 0}.analysis-sparkline i:nth-child(3n){height:75%}.analysis-sparkline i:nth-child(3n + 1){height:35%}
/* Marketing: sunlit editorial campaign cards and loud campaign typography. */
.marketer .hero{grid-template-columns:1.15fr .85fr}.marketer .hero-visual{background:#f9b743;min-height:365px;border-radius:50% 50% 4px 4px}.campaign-sticker{position:absolute;left:15%;top:18%;font:800 clamp(38px,5vw,63px)/.82 Manrope,sans-serif;letter-spacing:-.08em;color:#b74523;transform:rotate(-9deg)}.campaign-orbit{position:absolute;right:12%;top:13%;font-size:95px;color:#fff4d8}.campaign-small{position:absolute;right:13%;bottom:22%;line-height:1.8;color:#482718}.campaign-foot{position:absolute;bottom:18px;left:20px;color:#482718}.marketer .contact-button{border-radius:99px}.marketer-projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.campaign-card{min-height:235px;display:flex;flex-direction:column;justify-content:space-between;border:0;border-radius:4px;background:#f7d26c;color:#382817}.campaign-1{background:#e99a7c}.campaign-2{background:#c9d6a5}.campaign-label,.campaign-bottom{display:flex;justify-content:space-between;font-size:9px;color:#4b3823}.campaign-label span:last-child{font-size:22px}.campaign-card h3{font-size:clamp(23px,3vw,34px);max-width:400px}.campaign-card>p{color:#59472e}.campaign-bottom{padding-top:15px;border-top:1px solid #38281735}.campaign-bottom a{font-size:20px}
/* Product: a roadmap-style hero and sequential milestone cards. */
.product .hero-visual{display:grid;place-items:center;background:radial-gradient(circle at center,#d7f4e4,transparent 68%)}.product-window{width:min(100%,360px);padding:16px;background:#fff;border:1px solid #174b3421;border-radius:8px;box-shadow:0 20px 45px #173a2912}.product-window-head,.loop-footer{display:flex;justify-content:space-between;color:var(--muted);font-size:8px}.product-window-head i{font-style:normal;color:var(--accent)}.loop-row{display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--line);padding:18px 5px}.loop-row>b,.roadmap-marker{font:11px 'DM Mono',monospace;color:var(--accent)}.loop-row>span{display:grid;gap:4px;flex:1}.loop-row strong{font-size:13px}.loop-row small{color:var(--muted);font-size:10px}.loop-row>i{font-style:normal;color:var(--accent)}.loop-row.active{background:#e8fbf2;padding-left:9px;padding-right:9px;border-radius:4px}.loop-footer{padding-top:15px}.roadmap{max-width:780px;margin-left:12px;border-left:1px solid var(--line)}.roadmap-item{position:relative;padding:0 0 20px 34px}.roadmap-marker{position:absolute;left:-13px;top:21px;width:25px;height:25px;border:1px solid var(--accent);border-radius:50%;display:grid;place-items:center;background:var(--page);font-size:8px}.roadmap-card{border-radius:5px}.roadmap-card h3{font-size:21px}
@media(max-width:900px){.developer-profile-card{grid-template-columns:1fr 1.3fr}.developer-profile-card .hero-visual{grid-column:1/-1}.developer-hero{grid-template-columns:1fr}.developer-hero .hero-visual{display:none}}
@media(max-width:760px){.hero{grid-template-columns:1fr;gap:32px;padding-top:62px;padding-bottom:92px}.hero-visual{min-height:270px}.hero-index{bottom:24px}.skills-section{grid-template-columns:1fr;gap:22px}.approach-section{grid-template-columns:1fr;gap:30px}.analyst-projects{grid-template-columns:repeat(2,minmax(0,1fr))}.developer-profile-section,.developer-about-section{padding:54px 23px}.developer-profile-card{grid-template-columns:1fr}.developer-profile-card .hero-visual{grid-column:auto}.developer-about-section{grid-template-columns:1fr;gap:20px}}
@media(max-width:540px){.site-nav{height:64px;padding:0 22px;position:relative}.nav-toggle{display:block;border:1px solid var(--line);background:transparent;color:var(--text);padding:9px 12px;border-radius:3px}.nav-links{display:none;position:absolute;z-index:3;left:0;right:0;top:63px;padding:18px 22px;background:var(--page);border-bottom:1px solid var(--line)}.nav-links.is-open{display:grid;gap:18px}.hero{padding:53px 23px 85px}h1{font-size:clamp(43px,13vw,66px)}.hero-index{left:23px;right:23px;font-size:8px}.skills-section,.work-section,.approach-section,footer{padding:54px 23px}.developer-profile-section,.developer-about-section{padding:48px 23px}.developer-projects,.designer-projects,.analyst-projects,.marketer-projects{grid-template-columns:1fr}.design-art{height:210px}.section-heading{align-items:start;gap:12px;flex-direction:column}.footer-bottom{gap:16px;flex-direction:column;margin-top:48px}.marketer .hero{grid-template-columns:1fr}}
${buildStyleVariant(styleId)}
`
}

function buildStyleVariant(styleId) {
  const variants = {
    glassmorphism: `body{--page:#151321;--surface:#ffffff0d;--line:#ffffff2a;--muted:#c0bbd0;--text:#fbfaff;background:radial-gradient(ellipse at 18% 0%,#674a9b 0,transparent 36%),radial-gradient(ellipse at 90% 30%,#245775 0,transparent 34%),#151321;background-attachment:fixed}.site-nav,.project-card,.developer-profile-card,.product-window,.hero-visual{backdrop-filter:blur(18px);background-color:#ffffff0d;border-color:#ffffff30}.skill-tag,.profile-details{background:#ffffff0a;border-color:#ffffff30}.contact-button{box-shadow:0 10px 30px color-mix(in srgb,var(--accent) 35%,transparent);border-radius:999px}.project-card,.developer-profile-card{border-radius:18px;box-shadow:0 20px 60px #08071032}.designer{--page:#fff4f5;--text:#33282c;--muted:#76666c}.analyst{--page:#07131a;--text:#eff9fb}.marketer{--page:#fff4df;--text:#352713}.product{--page:#eef8f1;--text:#1b3325}`,
    "kinetic-ui": `body{--page:#f5efdf;--surface:#f9f1dc;--line:#242014;--muted:#4e493e;--text:#19170f;background-color:var(--page);background-image:linear-gradient(#1a17100d 1px,transparent 1px),linear-gradient(90deg,#1a17100d 1px,transparent 1px);background-size:28px 28px}.site-nav{border-bottom:3px solid var(--text)}.hero{min-height:610px}.hero-copy h1{font-size:clamp(55px,9vw,112px);text-transform:uppercase;line-height:.86;transform:rotate(-2deg);transform-origin:left center}.hero-copy h1 span{color:var(--accent);-webkit-text-stroke:1px var(--text)}.hero-visual,.project-card,.developer-profile-card{border:3px solid var(--text);box-shadow:8px 8px 0 var(--text)}.contact-button{border:2px solid var(--text);box-shadow:4px 4px 0 var(--text);font-weight:800;text-transform:uppercase}.project-card{transition:transform .18s ease,box-shadow .18s ease}.project-card:hover{transform:translate(-3px,-3px) rotate(-1deg);box-shadow:12px 12px 0 var(--text)}.skill-tag{border:2px solid var(--text);background:var(--accent-soft);color:var(--text);font-weight:700}.approach-section{border:3px solid var(--text);margin:0 5vw 0;box-shadow:8px 8px 0 var(--text)}`,
    neumorphism: `body{--page:#e8edf4;--surface:#e8edf4;--line:#d5deea;--muted:#68788e;--text:#344257;background:#e8edf4}.site-nav{border:0;box-shadow:0 5px 16px #aab6c833}.project-card,.developer-profile-card,.hero-visual,.product-window{border:0;border-radius:22px;background:#e8edf4;box-shadow:10px 10px 22px #b8c2d0,-10px -10px 22px #ffffff}.profile-details,.profile-avatar{border:0;border-radius:18px;box-shadow:inset 4px 4px 9px #c2ccd9,inset -4px -4px 9px #fff}.contact-button{border:0;border-radius:999px;color:#25344a;box-shadow:6px 6px 13px #bdc7d4,-6px -6px 13px #fff}.skill-tag{border:0;border-radius:999px;background:#e8edf4;box-shadow:4px 4px 9px #c0cad8,-4px -4px 9px #fff;color:#53647a}.approach-section{border:0;border-radius:25px;margin:0 5vw;box-shadow:inset 6px 6px 15px #c2ccd9,inset -6px -6px 15px #fff}`,
    "bento-grid": `body{--page:#f0f0eb;--surface:#fff;--line:#20201c18;--muted:#74746c;--text:#20201c;background:#f0f0eb}.site-nav{background:#f0f0eb}.hero{grid-template-columns:1fr 1fr}.hero-copy{padding:35px;border:1px solid var(--line);border-radius:20px;background:var(--surface)}.hero-visual{border-radius:20px}.skills-section{margin:0 5vw;padding:35px;border:1px solid var(--line);border-radius:20px;background:#dff0d6}.work-section{border:0}.project-card,.developer-profile-card{border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 24px #22220b0a}.developer-projects,.designer-projects,.analyst-projects,.marketer-projects{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.developer-projects .project-card:first-child,.marketer-projects .project-card:first-child{grid-row:span 2}.skill-tag{border:0;border-radius:999px;background:#f0f0eb;color:#3c4738}.approach-section{margin:0 5vw;border:1px solid var(--line);border-radius:20px}.developer-profile-section,.developer-about-section{margin:0 5vw;padding-left:0;padding-right:0}`,
    "dark-grid": `body{--page:#0d1117;--surface:#111923;--line:#8aa0b51f;--muted:#9aa8b7;--text:#e6edf3;background-color:#0d1117;background-image:linear-gradient(#8aa0b50d 1px,transparent 1px),linear-gradient(90deg,#8aa0b50d 1px,transparent 1px);background-size:32px 32px}.site-nav{background:#0d1117e8}.project-card,.developer-profile-card,.hero-visual,.product-window{border:1px solid #8aa0b533;border-radius:8px;box-shadow:0 12px 32px #0005}.contact-button{border-radius:5px;box-shadow:0 0 25px color-mix(in srgb,var(--accent) 22%,transparent)}.skill-tag{background:#111923cc}.approach-section{background:#111923e8}`,
    claymorphism: `body{--page:#fff4f7;--surface:#fff;--line:#ffffff;--muted:#786779;--text:#362a3b;background:radial-gradient(ellipse at 0% 5%,#ffe0e8 0,transparent 34%),radial-gradient(ellipse at 100% 30%,#eee0ff 0,transparent 35%),#fff4f7}.site-nav{border:0}.project-card,.developer-profile-card,.hero-visual,.product-window{border:3px solid #fff;border-radius:27px;box-shadow:0 14px 0 #e7d5e7,0 20px 35px #60456a1c}.profile-avatar{border:4px solid #fff;border-radius:25px;box-shadow:0 8px 0 #a78bfa70,0 12px 24px #5d398a25}.contact-button{border:3px solid #fff;border-radius:999px;box-shadow:0 7px 0 color-mix(in srgb,var(--accent) 45%,#fff)}.skill-tag{border:2px solid #fff;border-radius:999px;background:#fff;box-shadow:0 5px 0 #dfd4e4;color:#574960}.approach-section{border:3px solid #fff;border-radius:28px;margin:0 4vw;box-shadow:0 10px 0 #e7d5e7}`
  }
  return variants[styleId] || variants["dark-grid"]
}

function buildScript() {
  return `const menuButton = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.textContent = isOpen ? "Menu" : "Close";
    navLinks.classList.toggle("is-open", !isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.textContent = "Menu";
      navLinks.classList.remove("is-open");
    }
  });
}

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});
`
}

export function buildPortfolioFiles(portfolio) {
  return renderPortfolio(portfolio)
}

export function buildPreviewDocument(portfolio) {
  const { html, css, js } = renderPortfolio(portfolio)
  return html
    .replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`)
    .replace('<script src="script.js"></script>', `<script>${js}</script>`)
}

export function createPortfolioFileName(name) {
  const safeName = String(name || "portfolio")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${safeName || "portfolio"}-portfolio`
}
