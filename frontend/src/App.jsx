import { useEffect, useState } from "react"
import JSZip from "jszip"
import { Check, Download, ExternalLink, Plus, Sparkles, Trash2 } from "lucide-react"
import { buildPortfolioFiles, buildPreviewDocument, createPortfolioFileName, portfolioStyles } from "./portfolioTemplates.js"

const API_URL = "/api"
const initialForm = {
  name: "",
  role: "software-developer",
  style: "glassmorphism",
  email: "",
  phone: "",
  about: "",
  skills: "",
  projects: [{ title: "", description: "", link: "" }],
}

const accentStyles = {
  violet: { soft: "bg-violet-100 text-violet-700", solid: "bg-violet-600", text: "text-violet-700", ring: "focus:border-violet-400 focus:ring-violet-100" },
  rose: { soft: "bg-rose-100 text-rose-700", solid: "bg-rose-600", text: "text-rose-700", ring: "focus:border-rose-400 focus:ring-rose-100" },
  cyan: { soft: "bg-cyan-100 text-cyan-800", solid: "bg-cyan-600", text: "text-cyan-700", ring: "focus:border-cyan-400 focus:ring-cyan-100" },
  amber: { soft: "bg-amber-100 text-amber-800", solid: "bg-amber-500", text: "text-amber-700", ring: "focus:border-amber-400 focus:ring-amber-100" },
  emerald: { soft: "bg-emerald-100 text-emerald-800", solid: "bg-emerald-600", text: "text-emerald-700", ring: "focus:border-emerald-400 focus:ring-emerald-100" },
}

function Field({ label, hint, as: control = "input", className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</span>
      {control === "textarea" ? (
        <textarea {...props} className={`form-control min-h-28 resize-y ${props.className || ""}`} />
      ) : (
        <input {...props} className={`form-control ${props.className || ""}`} />
      )}
      {hint && <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

function App() {
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authMode, setAuthMode] = useState("signin")
  const [authForm, setAuthForm] = useState({ firstName: "", lastName: "", email: "", password: "" })
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "" })
  const [profileSaving, setProfileSaving] = useState(false)
  const [currentView, setCurrentView] = useState("builder")
  const [library, setLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [portfolioCountLoading, setPortfolioCountLoading] = useState(true)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [deletingPortfolioId, setDeletingPortfolioId] = useState(null)
  const [deletingAllPortfolios, setDeletingAllPortfolios] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingToLibrary, setSavingToLibrary] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [generationId, setGenerationId] = useState(null)
  const [generatedPortfolio, setGeneratedPortfolio] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${API_URL}/roles`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load portfolio templates.")
        return response.json()
      })
      .then(setRoles)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingRoles(false))

    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (response.status === 401) return null
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Could not check your account.")
        return result.user
      })
      .then(setUser)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setPortfolioCountLoading(false)
      return
    }

    let active = true
    setPortfolioCountLoading(true)
    Promise.all([
      requestApi("/portfolios"),
      requestApi("/portfolios/usage"),
    ])
      .then(([portfolios, usage]) => {
        if (active) {
          setLibrary(portfolios)
          setGeneratedCount(usage.used)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setPortfolioCountLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const selectedRole = roles.find((item) => item.id === form.role)
  const selectedStyle = portfolioStyles.find((item) => item.id === form.style) || portfolioStyles[0]
  const accent = accentStyles[selectedRole?.accent] || accentStyles.violet
  const validProjects = form.projects.filter((project) => project.title.trim() && project.description.trim())
  const skills = form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
  const portfolioLimit = 5
  const portfolioLimitReached = generatedCount >= portfolioLimit
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Member"
  const profileInitial = user?.firstName?.charAt(0).toUpperCase() || "U"

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setGeneratedPortfolio(null)
    setSavedId(null)
    setGenerationId(null)
  }

  function updateProject(index, field, value) {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) => projectIndex === index
        ? { ...project, [field]: value }
        : project),
    }))
    setGeneratedPortfolio(null)
    setSavedId(null)
    setGenerationId(null)
  }

  function addProject() {
    if (form.projects.length < 10) {
      updateForm("projects", [...form.projects, { title: "", description: "", link: "" }])
    }
  }

  function removeProject(index) {
    updateForm("projects", form.projects.filter((_, projectIndex) => projectIndex !== index))
  }

  async function requestApi(path, options = {}) {
    const headers = new Headers(options.headers || {})
    if (options.method && options.method !== "GET") {
      const csrfResponse = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" })
      const csrfResult = await csrfResponse.json()
      if (!csrfResponse.ok) throw new Error(csrfResult.error || "Could not verify your session.")
      headers.set("X-CSRF-Token", csrfResult.csrfToken)
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "The request could not be completed.")
    return result
  }

  async function submitAuth(event) {
    event.preventDefault()
    setError("")
    setAuthSubmitting(true)
    try {
      const result = await requestApi(`/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      })
      setUser(result.user)
      setAuthForm({ firstName: "", lastName: "", email: "", password: "" })
      setCurrentView("builder")
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAuthSubmitting(false)
    }
  }

  function openProfileEditor() {
    setProfileForm({ firstName: user.firstName || "", lastName: user.lastName || "" })
    setProfileOpen(true)
    setError("")
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError("")
    setProfileSaving(true)
    try {
      const result = await requestApi("/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })
      setUser(result.user)
      setProfileOpen(false)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function signOut() {
    setError("")
    try {
      await requestApi("/auth/signout", { method: "POST" })
      setUser(null)
      setLibrary([])
      setGeneratedPortfolio(null)
      setSavedId(null)
      setGenerationId(null)
      setGeneratedCount(0)
      setCurrentView("builder")
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function openLibrary() {
    setCurrentView("library")
    setLibraryLoading(true)
    setError("")
    try {
      const result = await requestApi("/portfolios")
      setLibrary(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLibraryLoading(false)
    }
  }

  async function deletePortfolio(item) {
    if (!window.confirm(`Delete "${item.name}" from your library? This cannot be undone.`)) return

    setError("")
    setDeletingPortfolioId(item.id)
    try {
      await requestApi(`/portfolios/${item.id}`, { method: "DELETE" })
      setLibrary((current) => current.filter((portfolio) => portfolio.id !== item.id))
      if (savedId === item.id) {
        setGeneratedPortfolio(null)
        setSavedId(null)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingPortfolioId(null)
    }
  }

  async function deleteAllPortfolios() {
    if (!window.confirm("Delete all portfolios from your library? This cannot be undone.")) return

    setError("")
    setDeletingAllPortfolios(true)
    try {
      await requestApi("/portfolios", { method: "DELETE" })
      setLibrary([])
      if (savedId !== null) {
        setGeneratedPortfolio(null)
        setSavedId(null)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingAllPortfolios(false)
    }
  }

  function previewSavedPortfolio(portfolio, id) {
    setGeneratedPortfolio(portfolio)
    setSavedId(id)
    setGenerationId(null)
    setCurrentView("builder")
    window.setTimeout(() => document.getElementById("generated-preview")?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  function previewPortfolio(event) {
    if (!event.currentTarget.form.reportValidity() || !selectedRole) return

    setError("")
    setSavedId(null)
    setGenerationId(null)
    setGeneratedPortfolio({
      name: form.name.trim(),
      role: form.role,
      roleLabel: selectedRole.label,
      style: form.style,
      email: form.email.trim(),
      phone: form.phone.trim(),
      about: form.about.trim(),
      skills,
      projects: validProjects,
      template: selectedRole,
    })
    window.setTimeout(() => document.getElementById("generated-preview")?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  async function generatePortfolio(event) {
    event.preventDefault()
    setError("")
    setSaving(true)

    try {
      const result = await requestApi("/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills, projects: validProjects }),
      })
      if (!result.portfolio || !result.generationId) throw new Error("The server returned an incomplete portfolio.")

      setGeneratedCount(result.used)
      setSavedId(null)
      setGenerationId(result.generationId)
      setGeneratedPortfolio(result.portfolio)
      window.setTimeout(() => document.getElementById("generated-preview")?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (requestError) {
      setError(requestError.message || "Could not connect to the portfolio server.")
    } finally {
      setSaving(false)
    }
  }

  async function movePortfolioToLibrary() {
    if (!generationId || savingToLibrary) return

    setError("")
    setSavingToLibrary(true)
    try {
      const result = await requestApi("/portfolios/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId }),
      })
      if (!result.portfolio || !result.id) throw new Error("The server returned an incomplete saved portfolio.")

      setSavedId(result.id)
      setGenerationId(null)
      setGeneratedPortfolio(result.portfolio)
      setLibrary((current) => [{
        id: result.id,
        name: result.portfolio.name,
        role: result.portfolio.role,
        createdAt: new Date().toISOString(),
        portfolio: result.portfolio,
      }, ...current.filter((item) => item.id !== result.id)])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingToLibrary(false)
    }
  }

  async function downloadPortfolio() {
    if (!generatedPortfolio) return

    setError("")
    setDownloading(true)
    try {
      const files = buildPortfolioFiles(generatedPortfolio)
      const archive = new JSZip()
      archive.file("index.html", files.html)
      archive.file("style.css", files.css)
      archive.file("script.js", files.js)

      const blob = await archive.generateAsync({ type: "blob" })
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = objectUrl
      anchor.download = `${createPortfolioFileName(generatedPortfolio.name)}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (downloadError) {
      setError(`Could not create the portfolio download: ${downloadError.message}`)
    } finally {
      setDownloading(false)
    }
  }

  if (loadingRoles || authLoading) {
    return <main className="grid min-h-screen place-items-center text-stone-500">Loading portfolio templates…</main>
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-5 py-12">
        <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_24px_70px_-38px_rgba(30,26,20,.32)] sm:p-9">
          <a href="#" className="font-display text-2xl font-extrabold tracking-[-0.08em]">folio<span className="text-violet-600">.</span></a>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Your work, always yours</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.055em]">{authMode === "signin" ? "Welcome back." : "Make your account."}</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">{authMode === "signin" ? "Sign in to build a new portfolio or revisit your saved work." : "Create an account to save and revisit your portfolios."}</p>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={submitAuth} className="mt-6 space-y-4">
            {authMode === "signup" && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" placeholder="Alex" autoComplete="given-name" required maxLength={80} value={authForm.firstName} onChange={(event) => setAuthForm((current) => ({ ...current, firstName: event.target.value }))} />
              <Field label="Last name" placeholder="Morgan" autoComplete="family-name" required maxLength={80} value={authForm.lastName} onChange={(event) => setAuthForm((current) => ({ ...current, lastName: event.target.value }))} />
            </div>}
            <Field label="Email address" type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} />
            <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete={authMode === "signin" ? "current-password" : "new-password"} required minLength={8} maxLength={128} value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} hint={authMode === "signup" ? "Use at least 8 characters." : undefined} />
            <button type="submit" disabled={authSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">
              {authSubmitting ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-500">
            {authMode === "signin" ? "New to folio?" : "Already have an account?"}{" "}
            <button type="button" className="font-bold text-violet-700 hover:text-violet-900" onClick={() => { setError(""); setAuthMode(authMode === "signin" ? "signup" : "signin") }}>
              {authMode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell min-h-screen">
      <nav className="app-nav sticky top-0 z-30 border-b border-stone-200/80 bg-[#f7f7f4]/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8">
          <a href="#" className="font-display text-2xl font-extrabold tracking-[-0.08em]">folio<span className="text-violet-600">.</span></a>
          <button type="button" onClick={openProfileEditor} className="flex items-center gap-2 rounded-full px-1 py-1 text-left text-sm text-stone-600 transition hover:bg-violet-50 sm:px-2" aria-label="Edit profile">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 sm:h-9 sm:w-9">{profileInitial}</span>
            <span className="hidden sm:block"><span className="block font-semibold">{profileName}</span><span className="block text-xs text-stone-400">Edit profile</span></span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentView("builder")} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${currentView === "builder" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-300 hover:border-stone-500"}`}>Home</button>
            <button type="button" onClick={openLibrary} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${currentView === "library" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-stone-300 hover:border-stone-500"}`}>My library</button>
            <button type="button" onClick={signOut} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold transition hover:border-stone-500">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="app-main mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {currentView === "builder" && <><section className="app-hero mb-9 grid gap-8 overflow-hidden rounded-[2rem] px-6 py-9 text-white shadow-[0_30px_90px_-45px_rgba(80,48,160,.65)] sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Your next chapter starts here
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Make your work<br className="hidden sm:block" /> <span className="app-hero-accent">impossible to miss.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-violet-100/85 sm:text-base">A portfolio that feels like you. Pick your role, shape your style, and bring your best work to life.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-white/85">
              {["5 job-specific layouts", "6 visual styles", "Download-ready files"].map((label) => <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">{label}</span>)}
            </div>
          </div>
          <div className="app-hero-art relative hidden h-52 w-64 items-center justify-center lg:flex" aria-hidden="true">
            <div className="app-art-orbit app-art-orbit-one" />
            <div className="app-art-orbit app-art-orbit-two" />
            <div className="app-art-card app-art-card-back"><span>YOUR WORK</span><i>✳</i></div>
            <div className="app-art-card app-art-card-front"><span>PORTFOLIO</span><strong>01</strong><small>MADE TO STAND OUT</small></div>
            <span className="app-art-spark app-art-spark-one">✦</span><span className="app-art-spark app-art-spark-two">✳</span>
          </div>
        </section>

        <section id="builder" className="mx-auto max-w-6xl">
          <form onSubmit={generatePortfolio} className="app-form app-step-form rounded-3xl border border-stone-200 bg-white p-5 shadow-[0_18px_65px_-42px_rgba(39,29,69,.32)] sm:p-8">
            <div className="app-step-heading mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="app-step-number" aria-hidden="true">01</span>
                <div><p className="app-step-kicker text-xs font-bold uppercase tracking-[0.16em]">Step 1 · Your details</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Tell us about your work</h2></div>
              </div>
              <span className="app-step-limit rounded-full px-3 py-1.5 text-xs font-semibold">{portfolioCountLoading ? "Checking limit…" : `${generatedCount} / ${portfolioLimit} generated`}</span>
            </div>

            <div className="app-identity-grid grid gap-4 sm:grid-cols-2">
              <Field label="Your name" placeholder="e.g. Alex Morgan" autoComplete="name" required maxLength={120} value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-stone-700">Your job role</span>
                <select className={`form-control ${accent.ring}`} value={form.role} onChange={(event) => updateForm("role", event.target.value)}>
                  {roles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>

            {selectedRole && <div className={`my-5 rounded-2xl p-4 ${accent.soft}`}>
              <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4" /> {selectedRole.label} · a distinct portfolio design</div>
              <p className="mt-1 text-sm leading-6 opacity-80">{selectedRole.description}</p>
              <p className="mt-2 text-xs font-semibold opacity-80">Design focus: {selectedRole.focus}, {selectedRole.highlightsTitle.toLowerCase()}, and a layout tailored to this role.</p>
            </div>}

            <fieldset className="app-style-section my-6">
              <legend className="text-sm font-semibold text-stone-700">Choose a visual style</legend>
              <p className="mb-3 mt-1 text-xs leading-5 text-stone-500">This changes the portfolio’s colors, surfaces, cards, and overall visual feel.</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioStyles.map((style) => {
                  const isSelected = form.style === style.id
                  return <button
                    key={style.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateForm("style", style.id)}
                    className={`app-style-card rounded-2xl border p-3 text-left transition ${isSelected ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-stone-200 hover:border-stone-400"}`}
                  >
                    <span className={`style-preview style-preview-${style.id}`} aria-hidden="true">
                      <span className="style-preview-nav"><i /><i /><i /><b>YOUR NAME</b><em>ABOUT&nbsp;&nbsp; WORK</em></span>
                      <span className="style-preview-hero">
                        <span className="style-preview-copy">
                          <i>PORTFOLIO · 2026</i>
                          <b>Creative<br />by nature.</b>
                          <small><i /><i /></small>
                        </span>
                        <span className="style-preview-art"><i /><i /><i /></span>
                      </span>
                      <span className="style-preview-projects"><b>SELECTED WORK</b><i /><i /><i /></span>
                    </span>
                    <span className="flex items-center justify-between gap-2 text-sm font-bold text-stone-800">
                      {style.label}
                      {isSelected && <Check className="h-4 w-4 text-violet-600" />}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-stone-500">{style.description}</span>
                  </button>
                })}
              </div>
            </fieldset>

            <div className="app-contact-grid grid gap-4 sm:grid-cols-2">
              <Field label="Email address" type="email" placeholder="alex@example.com" autoComplete="email" required maxLength={254} value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
              <Field label="Contact number (optional)" type="tel" placeholder="+1 555 123 4567" autoComplete="tel" maxLength={30} value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              <Field className="sm:col-span-2" as="textarea" label="A little about you" placeholder="What do you do? What makes your approach different? Keep it human." required maxLength={1200} value={form.about} onChange={(event) => updateForm("about", event.target.value)} />
              <Field label="Skills & tools" placeholder="React, Figma, SQL…" hint="Separate each skill with a comma." value={form.skills} onChange={(event) => updateForm("skills", event.target.value)} />
            </div>

            <div className="app-project-section mt-7 border-t border-stone-100 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div><h3 className="font-display text-lg font-bold">Your projects</h3><p className="mt-0.5 text-xs text-stone-500">Add up to 10 pieces of work. Enter both a title and description to include a project.</p></div>
                <button type="button" onClick={addProject} disabled={form.projects.length >= 10} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-xs font-bold transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add project</button>
              </div>
              <div className="space-y-4">
                {form.projects.map((project, index) => (
                  <div key={index} className="app-project-card rounded-2xl border border-stone-200 bg-[#fdfdfc] p-4">
                    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-stone-400">Project {String(index + 1).padStart(2, "0")}</span>{form.projects.length > 1 && <button type="button" aria-label={`Remove project ${index + 1}`} onClick={() => removeProject(index)} className="text-stone-400 transition hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className={`form-control ${accent.ring}`} aria-label={`Project ${index + 1} title`} placeholder="Project title" maxLength={120} required={Boolean(project.title.trim() || project.description.trim() || project.link.trim())} value={project.title} onChange={(event) => updateProject(index, "title", event.target.value)} />
                      <input className={`form-control ${accent.ring}`} aria-label={`Project ${index + 1} link`} type="url" placeholder="Project link (optional)" maxLength={500} value={project.link} onChange={(event) => updateProject(index, "link", event.target.value)} />
                      <textarea className={`form-control min-h-20 resize-y sm:col-span-2 ${accent.ring}`} aria-label={`Project ${index + 1} description`} placeholder="What did you make, and what was the impact?" maxLength={600} required={Boolean(project.title.trim() || project.description.trim() || project.link.trim())} value={project.description} onChange={(event) => updateProject(index, "description", event.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="app-form-actions mt-7 border-t border-stone-100 pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="submit" disabled={saving || portfolioCountLoading || portfolioLimitReached} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200/50 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ${accent.solid}`}>
                  <Sparkles className="h-4 w-4" /> {saving ? "Generating portfolio…" : portfolioLimitReached ? "Generation limit reached" : `Generate ${selectedStyle.label} portfolio`}
                </button>
                <button type="button" onClick={previewPortfolio} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-bold text-stone-800 transition hover:border-violet-400 hover:text-violet-700">
                  <ExternalLink className="h-4 w-4" /> Preview portfolio
                </button>
              </div>
              {savedId && <p className="mt-3 text-center text-xs text-emerald-700">Saved to your portfolio library · ID #{savedId}</p>}
              {portfolioLimitReached && <p className="mt-3 text-center text-xs leading-5 text-amber-700">You’ve used all {portfolioLimit} generation slots. Deleting portfolios from your library won’t reset this limit.</p>}
            </div>
          </form>
        </section>

        {generatedPortfolio && <section id="generated-preview" className="mt-10 overflow-hidden rounded-3xl border border-stone-200 bg-[#eeece7] shadow-[0_12px_40px_-28px_rgba(30,26,20,.3)]">
          <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-[#f4f2ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">{generationId === null && savedId === null ? "Preview your portfolio" : "Step 2 · Preview your generated portfolio"}</p>
              <p className="mt-1 text-sm text-stone-600">{generationId === null && savedId === null ? "This is a preview only. Generate the portfolio to download its files." : "Review it first. When you’re happy, download all three files as a ZIP."}</p>
            </div>
            {(generationId !== null || savedId !== null) && <button type="button" onClick={downloadPortfolio} disabled={downloading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60">
              <Download className="h-4 w-4" /> {downloading ? "Preparing files…" : "Download HTML + CSS + JS"}
            </button>}
            {generationId !== null && <button type="button" onClick={movePortfolioToLibrary} disabled={savingToLibrary} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-3 text-sm font-bold text-violet-700 transition hover:border-violet-500 hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60">
              <Plus className="h-4 w-4" /> {savingToLibrary ? "Moving to library…" : "Move to my library"}
            </button>}
            {savedId !== null && generationId === null && <button type="button" onClick={openLibrary} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-bold transition hover:border-violet-400 hover:text-violet-700">
              View in my library
            </button>}
          </div>
          <div className="flex items-center gap-2 border-b border-stone-200/80 bg-[#f8f7f4] px-5 py-3 sm:px-6">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ed7d73]" /><span className="h-2.5 w-2.5 rounded-full bg-[#e6bd58]" /><span className="h-2.5 w-2.5 rounded-full bg-[#70ba82]" />
            <span className="ml-2 text-xs font-medium text-stone-500">{generatedPortfolio.name} · {generatedPortfolio.roleLabel} · {portfolioStyles.find((style) => style.id === generatedPortfolio.style)?.label || portfolioStyles[0].label}</span>
          </div>
          <iframe
            key={savedId}
            title={`${generatedPortfolio.name}'s generated portfolio preview`}
            className="block h-[760px] w-full border-0 bg-white sm:h-[900px]"
            sandbox="allow-scripts"
            srcDoc={buildPreviewDocument(generatedPortfolio)}
          />
          {(generationId !== null || savedId !== null) && <div className="flex flex-col gap-3 border-t border-stone-200/80 bg-[#f4f2ee] px-5 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Unzip the download, then open <code className="rounded bg-white px-1.5 py-1 font-mono">index.html</code> in a browser.</span>
            <span className="inline-flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" /> Includes <code className="font-mono">index.html</code>, <code className="font-mono">style.css</code>, and <code className="font-mono">script.js</code></span>
          </div>}
        </section>}
        </>}

        {currentView === "library" && <section className="app-library mx-auto max-w-5xl">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Your account · {generatedCount} / {portfolioLimit} generated</p><h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.055em]">Your portfolio library</h1><p className="mt-2 text-sm text-stone-500">Portfolios you choose to move here are saved for later preview and download.</p></div>
            <div className="flex flex-wrap gap-2 self-start">
              {library.length > 0 && <button type="button" disabled={deletingAllPortfolios || deletingPortfolioId !== null || libraryLoading} onClick={deleteAllPortfolios} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"><Trash2 className="h-4 w-4" /> {deletingAllPortfolios ? "Deleting all…" : "Delete all"}</button>}
              <button type="button" disabled={portfolioLimitReached || portfolioCountLoading} onClick={() => setCurrentView("builder")} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="h-4 w-4" /> {portfolioLimitReached ? "Limit reached" : "Create a portfolio"}</button>
            </div>
          </div>
          {libraryLoading ? <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Loading your saved portfolios…</div>
            : library.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-display text-lg font-bold">Your library is ready for its first portfolio.</p><p className="mt-2 text-sm text-stone-500">Generate a portfolio, then choose <strong>Move to my library</strong> to save it here.</p></div>
              : <div className="grid gap-4 sm:grid-cols-2">{library.map((item) => {
                const itemAccent = accentStyles[roles.find((roleItem) => roleItem.id === item.role)?.accent] || accentStyles.violet
                return <article key={item.id} className="app-library-card rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${itemAccent.soft}`}>{item.portfolio.roleLabel}</span><span className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleDateString()}</span></div>
                  <h2 className="mt-4 font-display text-xl font-bold">{item.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-500">{item.portfolio.about}</p>
                  <p className="mt-3 text-xs text-stone-400">{portfolioStyles.find((style) => style.id === item.portfolio.style)?.label || portfolioStyles[0].label} · {item.portfolio.projects.length} {item.portfolio.projects.length === 1 ? "project" : "projects"} · {item.portfolio.skills.length} skills</p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
                    <button type="button" onClick={() => previewSavedPortfolio(item.portfolio, item.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-stone-700"><ExternalLink className="h-3.5 w-3.5" /> Preview</button>
                    <button type="button" onClick={() => { setGeneratedPortfolio(item.portfolio); setSavedId(item.id); window.setTimeout(() => document.getElementById("generated-preview")?.scrollIntoView({ behavior: "smooth" }), 100) }} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold transition hover:border-stone-400"><Download className="h-3.5 w-3.5" /> Download</button>
                    <button type="button" disabled={deletingAllPortfolios || deletingPortfolioId !== null} onClick={() => deletePortfolio(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> {deletingPortfolioId === item.id ? "Deleting…" : "Delete"}</button>
                  </div>
                </article>
              })}</div>}
        </section>}

        <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-stone-200 pt-5 text-xs text-stone-400 sm:flex-row"><span>Make good work. Tell its story.</span><span>folio. © {new Date().getFullYear()}</span></footer>
      </main>
      {profileOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 px-4 py-8" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !profileSaving) setProfileOpen(false)
      }}>
        <section role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Account settings</p>
          <h2 id="profile-dialog-title" className="mt-2 font-display text-2xl font-extrabold tracking-tight">Edit your profile</h2>
          <p className="mt-2 text-sm text-stone-500">Update the name shown beside your profile picture.</p>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <Field label="First name" autoComplete="given-name" required maxLength={80} value={profileForm.firstName} onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))} />
            <Field label="Last name" autoComplete="family-name" required maxLength={80} value={profileForm.lastName} onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" disabled={profileSaving} onClick={() => setProfileOpen(false)} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-500 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={profileSaving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60">{profileSaving ? "Saving…" : "Save profile"}</button>
            </div>
          </form>
        </section>
      </div>}
    </div>
  )
}

export default App
