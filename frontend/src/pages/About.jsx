import { NavLink, Link } from 'react-router-dom'

function About({ toggleTheme, theme }) {
  const steps = [
    {
      icon: "📸",
      title: "Upload Label",
      description:
        "Take a photo of any packaged food nutrition label and upload it to IngreSight",
    },
    {
      icon: "🤖",
      title: "AI Extraction",
      description:
        "Google Gemini Vision AI reads the label and extracts all nutrition values with high accuracy",
    },
    {
      icon: "⚖️",
      title: "Health Scoring",
      description:
        "Our rule-based scoring engine evaluates each nutrient using WHO and FDA guidelines",
    },
    {
      icon: "📊",
      title: "Insights Generated",
      description:
        "AI generates personalised health insights, consumption frequency and recommendations",
    },
  ];

  const nutrients = [
    {
      name: "Calories",
      weight: "25%",
      description: "Primary driver of weight gain",
    },
    {
      name: "Sugar",
      weight: "25%",
      description: "Linked to diabetes and obesity",
    },
    {
      name: "Sodium",
      weight: "20%",
      description: "Major cause of hypertension",
    },
    {
      name: "Fat",
      weight: "15%",
      description: "Saturated fat affects heart health",
    },
    { name: "Fiber", weight: "10%", description: "Beneficial for digestion" },
    {
      name: "Protein",
      weight: "5%",
      description: "Essential for muscle and satiety",
    },
  ];

  const techStack = [
    { name: "React + Vite", role: "Frontend", color: "#38bdf8" },
    { name: "FastAPI", role: "Backend", color: "#4ade80" },
    { name: "MongoDB Atlas", role: "Database", color: "#34d399" },
    { name: "Gemini 2.5 Flash", role: "AI Vision", color: "#a78bfa" },
    { name: "Render", role: "Backend Host", color: "#fb923c" },
    { name: "Vercel", role: "Frontend Host", color: "#94a3b8" },
  ];
  return (
    <div className="about-page">
      <nav className="navbar">
  <div className="navbar-brand">
    <span className="navbar-logo">🥗</span>
    <span className="navbar-title">IngreSight</span>
  </div>
  <div className="navbar-links">
    <NavLink to="/" end className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>Home</NavLink>
    <NavLink to="/about" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>About</NavLink>
    <NavLink to="/stats" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>Stats</NavLink>
    <NavLink to="/history" className={({ isActive }) => isActive ? 'navbar-link active-link' : 'navbar-link'}>History</NavLink>
    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  </div>
</nav>

      <div className="about-content">
        <div className="about-hero">
          <h1 className="hero-title">
            About <span className="gradient-text">IngreSight</span>
          </h1>
          <p className="hero-subtitle">
            An AI-powered nutrition label analyzer that helps you make informed
            food choices through intelligent health scoring and personalized
            insights
          </p>
        </div>

        <section className="about-section">
          <h2 className="about-section-title">How It Works</h2>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">Scoring Model</h2>
          <p className="about-section-subtitle">
            Our transparent rule-based scoring system evaluates six key
            nutrients. Each nutrient receives a sub-score from 0-100 which is
            combined using weighted averaging to produce the final health score.
          </p>
          <div className="scoring-table">
            {nutrients.map((nutrient, i) => (
              <div key={i} className="scoring-row">
                <div className="scoring-left">
                  <span className="scoring-name">{nutrient.name}</span>
                  <span className="scoring-desc">{nutrient.description}</span>
                </div>
                <div className="scoring-weight">{nutrient.weight}</div>
              </div>
            ))}
          </div>
          <div className="scoring-note">
            <span>💡</span>
            <p>
              Score of 75-100 = Healthy · 50-74 = Moderate · 25-49 = Unhealthy ·
              0-24 = Poor
            </p>
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">Tech Stack</h2>
          <div className="tech-grid">
            {techStack.map((tech, i) => (
              <div key={i} className="tech-card">
                <span className="tech-name" style={{ color: tech.color }}>
                  {tech.name}
                </span>
                <span className="tech-role">{tech.role}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">Limitations</h2>
          <div className="limitations-list">
            <div className="limitation-item">
              <span className="limitation-icon">⚠️</span>
              <div>
                <p className="limitation-title">Per Serving Assumption</p>
                <p className="limitation-desc">
                  All scores are calculated based on per-serving values. Labels
                  showing per 100g values may produce different scores.
                </p>
              </div>
            </div>
            <div className="limitation-item">
              <span className="limitation-icon">⚠️</span>
              <div>
                <p className="limitation-title">Image Quality Dependent</p>
                <p className="limitation-desc">
                  Accuracy depends on image clarity. Blurry or partially visible
                  labels may result in incomplete extraction.
                </p>
              </div>
            </div>
            <div className="limitation-item">
              <span className="limitation-icon">⚠️</span>
              <div>
                <p className="limitation-title">Ultra-Processed Food Penalty</p>
                <p className="limitation-desc">
                  Current model scores individual nutrients only. Future
                  versions will include processing level as a scoring factor.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="footer">
        <p>IngreSight — AI Nutritional Label Analyzer</p>
        <p className="footer-sub">Minor Project · Computer Science</p>
      </footer>
    </div>
  );
}

export default About;
