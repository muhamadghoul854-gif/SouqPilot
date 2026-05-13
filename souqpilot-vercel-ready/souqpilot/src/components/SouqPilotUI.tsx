import { useState, useEffect } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: "p1", title: "The Founder's Flight Manual", slug: "founders-flight-manual",
    category: "ebook", price: 29, currency: "USD",
    description: "The complete playbook for building a profitable digital business from 0 to cruising altitude. 280 pages, 40 frameworks.",
    features: ["280 pages of battle-tested strategy", "40 proprietary frameworks", "Lifetime updates included", "PDF + EPUB formats"],
    icon: "📖", rating: 4.9, sales: 2840, badge: "BESTSELLER",
    previewAvailable: true,
  },
  {
    id: "p2", title: "SaaS Autopilot Boilerplate", slug: "saas-autopilot-boilerplate",
    category: "software", price: 97, currency: "USD",
    description: "Next.js + Supabase + Stripe boilerplate. Ship your SaaS in 48 hours, not 6 months. Battle-tested in production.",
    features: ["Auth, billing & dashboard pre-built", "Stripe + Lemon Squeezy", "Multi-tenant ready", "TypeScript + Prisma"],
    icon: "⚡", rating: 4.8, sales: 1120, badge: "NEW",
    previewAvailable: false,
  },
  {
    id: "p3", title: "Altitude Marketing Masterclass", slug: "altitude-marketing",
    category: "course", price: 67, currency: "USD",
    description: "15 hours of video training on digital marketing. From $0 to $50k/month using content, SEO, and paid channels.",
    features: ["15+ hours of HD video", "Private community access", "Monthly live Q&As", "Certificate of completion"],
    icon: "🎓", rating: 4.7, sales: 3210, badge: "TOP RATED",
    previewAvailable: true,
  },
  {
    id: "p4", title: "Cockpit UI Kit — Figma", slug: "cockpit-ui-kit",
    category: "template", price: 49, currency: "USD",
    description: "600+ Figma components for dashboard and SaaS interfaces. Aviation-inspired precision design system.",
    features: ["600+ components", "Auto-layout throughout", "Dark & light modes", "Free updates forever"],
    icon: "🎨", rating: 5.0, sales: 890, badge: "POPULAR",
    previewAvailable: true,
  },
  {
    id: "p5", title: "Python Data Science Runway", slug: "python-data-science",
    category: "ebook", price: 34, currency: "USD",
    description: "From Python basics to production ML models. 300 pages, 60 real datasets, code on GitHub.",
    features: ["300+ pages with code", "60 real datasets included", "GitHub repository access", "Covers pandas, sklearn, torch"],
    icon: "🐍", rating: 4.8, sales: 1760, badge: null,
    previewAvailable: false,
  },
  {
    id: "p6", title: "No-Code Launch Pad", slug: "no-code-launchpad",
    category: "course", price: 44, currency: "USD",
    description: "Build and monetize digital products without writing a single line of code. Tools: Webflow, Notion, Gumroad.",
    features: ["8 hours of video content", "10 done-for-you templates", "Monetization strategies", "Tool discount bundle"],
    icon: "🚀", rating: 4.6, sales: 2100, badge: null,
    previewAvailable: true,
  },
];

const PURCHASES = [
  { id: "o1", productTitle: "The Founder's Flight Manual", date: "2025-04-18", amount: 29, status: "completed", token: "tok-f91a2", clicks: 2, maxClicks: 5 },
  { id: "o2", productTitle: "Cockpit UI Kit — Figma", date: "2025-03-05", amount: 49, status: "completed", token: "tok-b34c7", clicks: 1, maxClicks: 5 },
  { id: "o3", productTitle: "Altitude Marketing Masterclass", date: "2025-05-01", amount: 67, status: "completed", token: "tok-a72e1", clicks: 0, maxClicks: 5 },
];

const CATS = ["All", "ebook", "course", "software", "template"];

const CAT_META = {
  ebook:    { label: "E-Book",    color: "#FF6B35" },
  course:   { label: "Course",   color: "#00B4D8" },
  software: { label: "Software", color: "#7B61FF" },
  template: { label: "Template", color: "#06D6A0" },
  other:    { label: "Other",    color: "#FFD166" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(n, cur = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 0 }).format(n);
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function SouqPilot() {
  const [view, setView] = useState("landing"); // landing | detail | dashboard
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cat, setCat] = useState("All");
  const [downloading, setDownloading] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);

  // Animated altitude counter
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 80);
    return () => clearInterval(t);
  }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function handleBuy(product) {
    setAddedToCart(product.id);
    showToast(`"${product.title}" added to cart`);
    setTimeout(() => setAddedToCart(null), 2000);
  }

  function handleDownload(purchase) {
    if (purchase.clicks >= purchase.maxClicks) return;
    setDownloading(purchase.id);
    showToast("Generating secure download link…", "info");
    setTimeout(() => {
      setDownloading(null);
      showToast("Download started ↓", "success");
    }, 1800);
  }

  const filtered = cat === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
  const altitudeVal = 31000 + Math.round(Math.sin(tick * 0.05) * 400);

  return (
    <div style={{ fontFamily: "'DM Serif Display', 'Playfair Display', Georgia, serif", background: "#080C14", color: "#E8EBF0", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; background: #080C14; }
        ::-webkit-scrollbar-thumb { background: #FF6B35; }

        .mono { font-family: 'IBM Plex Mono', monospace; }
        .sans { font-family: 'DM Sans', sans-serif; }

        /* HUD grid lines */
        .hud-grid {
          background-image:
            linear-gradient(rgba(255,107,53,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,107,53,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Cockpit border style */
        .cockpit-border {
          border: 1px solid rgba(255,107,53,0.2);
          position: relative;
        }
        .cockpit-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border: 1px solid transparent;
          background: linear-gradient(135deg, rgba(255,107,53,0.4), transparent 40%, transparent 60%, rgba(0,180,216,0.2)) border-box;
          mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          pointer-events: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #FF6B35, #E85A20);
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 12px 28px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-primary:hover::after { opacity: 1; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,53,0.4); }

        .btn-ghost {
          background: transparent;
          color: rgba(232,235,240,0.6);
          border: 1px solid rgba(255,107,53,0.25);
          border-radius: 4px;
          padding: 12px 28px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: #FF6B35; color: #FF6B35; }

        .product-card {
          background: #0D1220;
          border: 1px solid rgba(255,107,53,0.12);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          position: relative;
        }
        .product-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,107,53,0.6), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .product-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255,107,53,0.35);
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(255,107,53,0.08);
        }
        .product-card:hover::before { opacity: 1; }

        .nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s;
          color: rgba(232,235,240,0.5);
        }
        .nav-link:hover, .nav-link.active { color: #FF6B35; }

        .cat-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 16px;
          border: 1px solid rgba(255,107,53,0.2);
          border-radius: 2px;
          background: transparent;
          color: rgba(232,235,240,0.5);
          cursor: pointer;
          transition: all 0.2s;
        }
        .cat-pill:hover, .cat-pill.active {
          background: #FF6B35;
          color: #fff;
          border-color: #FF6B35;
        }

        .hud-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,107,53,0.6);
        }
        .hud-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 22px;
          font-weight: 600;
          color: #FF6B35;
          letter-spacing: -0.02em;
        }

        .toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #0D1220;
          border: 1px solid rgba(255,107,53,0.4);
          color: #E8EBF0;
          padding: 14px 28px;
          border-radius: 4px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          z-index: 999;
          animation: toastIn 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }
        .toast.info { border-color: rgba(0,180,216,0.5); }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        .progress-bar { height: 3px; background: rgba(255,107,53,0.15); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #FF6B35, #FFB347); border-radius: 2px; transition: width 0.4s; }

        .shimmer { animation: shimmer 3s infinite; }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent);
          animation: scan 4s linear infinite;
          pointer-events: none;
        }
        @keyframes scan { from { top: 0; } to { top: 100%; } }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,12,20,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,107,53,0.12)",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setView("landing")}>
          <div style={{
            width: 34, height: 34, background: "linear-gradient(135deg, #FF6B35, #E85A20)",
            borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
          }}>✈</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>SouqPilot</div>
            <div className="mono" style={{ fontSize: 9, color: "rgba(255,107,53,0.6)", letterSpacing: "0.2em" }}>DIGITAL MARKETPLACE</div>
          </div>
        </div>

        {/* HUD Altitude Display */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "6px 20px", background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)", borderRadius: 4 }}>
          <div>
            <div className="hud-label" style={{ fontSize: 8 }}>ALT</div>
            <div className="mono" style={{ fontSize: 14, color: "#FF6B35", fontWeight: 600 }}>{altitudeVal.toLocaleString()} ft</div>
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,107,53,0.2)" }} />
          <div>
            <div className="hud-label" style={{ fontSize: 8 }}>STATUS</div>
            <div className="mono shimmer" style={{ fontSize: 12, color: "#06D6A0", fontWeight: 600 }}>● CRUISING</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <span className={`nav-link ${view === "landing" ? "active" : ""}`} onClick={() => setView("landing")}>Marketplace</span>
          <span className={`nav-link ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>Dashboard</span>
          <button className="btn-ghost" style={{ padding: "8px 16px" }}>Sign In</button>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 11 }}>Board Now</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: LANDING
      ══════════════════════════════════════════════════════════════════════ */}
      {view === "landing" && (
        <>
          {/* HERO */}
          <section className="hud-grid" style={{ padding: "90px 40px 80px", maxWidth: 1280, margin: "0 auto", position: "relative" }}>
            <div className="scan-line" />

            {/* Corner brackets */}
            {[
              { top: 20, left: 20, borderTop: "2px solid", borderLeft: "2px solid", width: 30, height: 30 },
              { top: 20, right: 20, borderTop: "2px solid", borderRight: "2px solid", width: 30, height: 30 },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", borderColor: "rgba(255,107,53,0.4)", ...style }} />
            ))}

            <div style={{ maxWidth: 760 }}>
              <div className="mono" style={{ fontSize: 10, color: "#FF6B35", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "inline-block", width: 32, height: 1, background: "#FF6B35" }} />
                CLEARED FOR TAKEOFF — RUNWAY 01
              </div>

              <h1 style={{
                fontSize: "clamp(44px, 6.5vw, 88px)",
                fontWeight: 700,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                marginBottom: 28,
              }}>
                Your Digital
                <br />
                <em style={{ fontStyle: "italic", color: "#FF6B35" }}>Destination</em>
                <br />
                For Premium Assets
              </h1>

              <p className="sans" style={{ fontSize: 18, color: "rgba(232,235,240,0.55)", lineHeight: 1.7, maxWidth: 520, marginBottom: 44, fontWeight: 300 }}>
                E-books, courses, and software engineered for
                builders who move fast. Every product — precision-crafted,
                instantly delivered.
              </p>

              <div style={{ display: "flex", gap: 16 }}>
                <button className="btn-primary" style={{ fontSize: 12 }}>
                  ⬡ Enter Marketplace
                </button>
                <button className="btn-ghost" style={{ fontSize: 12 }}>
                  View Manifest →
                </button>
              </div>
            </div>

            {/* Flight stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              marginTop: 80,
              background: "rgba(255,107,53,0.08)",
              border: "1px solid rgba(255,107,53,0.12)",
              borderRadius: 6,
              overflow: "hidden",
            }}>
              {[
                ["6,200+", "Products", "in hangar"],
                ["98K+", "Buyers", "aboard"],
                ["99.9%", "Delivery", "rate"],
                ["$1.8M+", "Creator", "payouts"],
              ].map(([v, l1, l2]) => (
                <div key={l1} style={{ padding: "28px 32px", background: "#0D1220", borderRight: "1px solid rgba(255,107,53,0.08)" }}>
                  <div className="hud-value">{v}</div>
                  <div className="hud-label" style={{ marginTop: 4 }}>{l1}</div>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(232,235,240,0.3)", letterSpacing: "0.1em" }}>{l2}</div>
                </div>
              ))}
            </div>
          </section>

          {/* PRODUCTS */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 40px 100px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
              <div>
                <div className="hud-label">— CARGO MANIFEST</div>
                <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 8 }}>Featured Products</h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATS.map(c => (
                  <button key={c} className={`cat-pill ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                    {c === "All" ? "All Systems" : CAT_META[c]?.label ?? c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {filtered.map((product, idx) => {
                const meta = CAT_META[product.category] ?? { color: "#FF6B35", label: product.category };
                return (
                  <div key={product.id} className="product-card" style={{ animationDelay: `${idx * 60}ms` }}>
                    {/* Card header */}
                    <div style={{
                      height: 140,
                      background: `linear-gradient(135deg, ${meta.color}15, ${meta.color}05)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 52,
                      borderBottom: `1px solid ${meta.color}18`,
                      position: "relative",
                    }}>
                      {product.icon}

                      {/* Badge */}
                      {product.badge && (
                        <div className="mono" style={{
                          position: "absolute", top: 14, left: 14,
                          background: meta.color,
                          color: "#fff",
                          fontSize: 9, letterSpacing: "0.15em",
                          padding: "3px 10px", borderRadius: 2,
                        }}>
                          {product.badge}
                        </div>
                      )}

                      {/* Category tag */}
                      <div className="mono" style={{
                        position: "absolute", top: 14, right: 14,
                        background: "rgba(8,12,20,0.7)",
                        color: meta.color,
                        border: `1px solid ${meta.color}40`,
                        fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
                        padding: "3px 10px", borderRadius: 2,
                      }}>
                        {meta.label}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "22px 24px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em", flex: 1, paddingRight: 12 }}>
                          {product.title}
                        </h3>
                        <span className="mono" style={{ fontSize: 20, fontWeight: 600, color: "#FF6B35", whiteSpace: "nowrap" }}>
                          {fmtPrice(product.price)}
                        </span>
                      </div>

                      <p className="sans" style={{ fontSize: 13, color: "rgba(232,235,240,0.5)", lineHeight: 1.65, marginBottom: 18, fontWeight: 300 }}>
                        {product.description.substring(0, 100)}…
                      </p>

                      <div className="mono" style={{ fontSize: 11, color: "rgba(232,235,240,0.35)", marginBottom: 18, display: "flex", gap: 16 }}>
                        <span>★ {product.rating}</span>
                        <span>{product.sales.toLocaleString()} sold</span>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        {product.previewAvailable && (
                          <button
                            className="btn-ghost"
                            style={{ flex: 1, padding: "10px 0", fontSize: 11 }}
                            onClick={() => { setSelectedProduct(product); setView("detail"); }}
                          >
                            Preview
                          </button>
                        )}
                        <button
                          className="btn-primary"
                          style={{
                            flex: 1, padding: "10px 0", fontSize: 11,
                            background: addedToCart === product.id
                              ? "linear-gradient(135deg, #06D6A0, #04B98A)"
                              : undefined,
                          }}
                          onClick={() => handleBuy(product)}
                        >
                          {addedToCart === product.id ? "✓ ADDED" : "BUY NOW"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section style={{
            borderTop: "1px solid rgba(255,107,53,0.1)",
            padding: "80px 40px",
            maxWidth: 1280, margin: "0 auto",
          }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div className="hud-label">— FLIGHT OPERATIONS</div>
              <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10 }}>How It Works</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
              {[
                ["01", "Browse", "Explore the manifest. Preview before boarding."],
                ["02", "Checkout", "Secure payment via Stripe or PayPal."],
                ["03", "Download", "Signed URL generated the moment payment clears."],
                ["04", "Own Forever", "Access from your dashboard — anytime."],
              ].map(([n, t, d]) => (
                <div key={n} style={{ background: "#0D1220", border: "1px solid rgba(255,107,53,0.1)", padding: "32px 28px" }}>
                  <div className="mono" style={{ fontSize: 32, fontWeight: 600, color: "rgba(255,107,53,0.2)", marginBottom: 16 }}>{n}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t}</h3>
                  <p className="sans" style={{ fontSize: 13, color: "rgba(232,235,240,0.45)", lineHeight: 1.65, fontWeight: 300 }}>{d}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: PRODUCT DETAIL
      ══════════════════════════════════════════════════════════════════════ */}
      {view === "detail" && selectedProduct && (() => {
        const p = selectedProduct;
        const meta = CAT_META[p.category] ?? { color: "#FF6B35", label: p.category };
        return (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 40px" }}>
            <button
              className="mono"
              style={{ background: "none", border: "none", color: "rgba(232,235,240,0.4)", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", marginBottom: 40, textTransform: "uppercase" }}
              onClick={() => setView("landing")}
            >
              ← Back to Manifest
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>
              {/* Left */}
              <div>
                {/* Hero */}
                <div style={{
                  height: 280, background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}08, #080C14)`,
                  border: `1px solid ${meta.color}20`,
                  borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 96, marginBottom: 36,
                  position: "relative", overflow: "hidden",
                }}>
                  <div className="scan-line" />
                  {p.icon}
                  <div className="mono" style={{ position: "absolute", bottom: 18, left: 20, fontSize: 9, color: `${meta.color}80`, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                    {meta.label} · v1.0 · Instant Delivery
                  </div>
                </div>

                <div className="hud-label" style={{ marginBottom: 8 }}>— PRODUCT BRIEF</div>
                <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20 }}>{p.title}</h1>
                <p className="sans" style={{ fontSize: 16, color: "rgba(232,235,240,0.6)", lineHeight: 1.75, marginBottom: 36, fontWeight: 300 }}>
                  {p.description}
                </p>

                {/* Features */}
                <div className="hud-label" style={{ marginBottom: 16 }}>— FEATURES & SPECS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {p.features.map(f => (
                    <div key={f} style={{
                      background: "#0D1220",
                      border: `1px solid ${meta.color}18`,
                      borderRadius: 4, padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ color: "#FF6B35", fontSize: 14 }}>▶</span>
                      <span className="sans" style={{ fontSize: 13, color: "rgba(232,235,240,0.7)", fontWeight: 400 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Purchase card */}
              <div className="cockpit-border" style={{ background: "#0D1220", borderRadius: 8, padding: "32px", position: "sticky", top: 80 }}>
                <div className="hud-label" style={{ marginBottom: 12 }}>— FLIGHT TICKET</div>
                <div style={{ fontSize: 44, fontWeight: 700, color: "#FF6B35", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  {fmtPrice(p.price)}
                </div>
                <div className="mono" style={{ fontSize: 10, color: "rgba(232,235,240,0.3)", letterSpacing: "0.12em", marginBottom: 28 }}>
                  ONE-TIME PAYMENT · INSTANT DELIVERY
                </div>

                {/* Rating + sales */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                  {[["★ RATING", `${p.rating}/5.0`], ["SOLD", p.sales.toLocaleString()], ["DELIVERY", "Instant"], ["FORMAT", "Digital DL"]].map(([k, v]) => (
                    <div key={k} style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)", borderRadius: 4, padding: "12px 14px" }}>
                      <div className="hud-label" style={{ marginBottom: 4 }}>{k}</div>
                      <div className="mono" style={{ fontSize: 14, color: "#E8EBF0", fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", padding: "16px", fontSize: 13, marginBottom: 12 }}
                  onClick={() => handleBuy(p)}
                >
                  ⬡ Purchase & Download
                </button>
                <button className="btn-ghost" style={{ width: "100%", padding: "14px", fontSize: 12 }}>
                  Preview Sample
                </button>

                <div className="mono" style={{
                  marginTop: 24, padding: "14px",
                  background: "rgba(6,214,160,0.06)",
                  border: "1px solid rgba(6,214,160,0.15)",
                  borderRadius: 4, fontSize: 10, lineHeight: 1.7,
                  color: "rgba(6,214,160,0.7)", letterSpacing: "0.06em",
                }}>
                  🔒 SECURE · Files stored in private S3 bucket.
                  Download links expire in 1 hour. Your file path is never exposed.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: DASHBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      {view === "dashboard" && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "60px 40px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
            <div>
              <div className="hud-label">— CREW PORTAL</div>
              <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10 }}>
                Your Cargo Hold
              </h1>
            </div>
            <div className="mono shimmer" style={{ fontSize: 11, color: "#06D6A0", letterSpacing: "0.15em" }}>
              ● ALL SYSTEMS NOMINAL
            </div>
          </div>

          {/* Summary HUD */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2,
            background: "rgba(255,107,53,0.06)",
            border: "1px solid rgba(255,107,53,0.12)",
            borderRadius: 6, overflow: "hidden", marginBottom: 48,
          }}>
            {[
              ["3", "Products Owned"],
              ["3 / 15", "Downloads Used"],
              ["$145", "Total Invested"],
              ["1 YR", "Access Period"],
            ].map(([v, l]) => (
              <div key={l} style={{ padding: "24px 28px", background: "#0D1220", borderRight: "1px solid rgba(255,107,53,0.08)" }}>
                <div className="hud-value" style={{ fontSize: 28 }}>{v}</div>
                <div className="hud-label" style={{ marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Purchase list */}
          <div className="hud-label" style={{ marginBottom: 20 }}>— PURCHASE HISTORY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PURCHASES.map((p) => (
              <div key={p.id} className="cockpit-border" style={{
                background: "#0D1220", borderRadius: 0,
                padding: "24px 28px",
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 32,
              }}>
                {/* Info */}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>{p.productTitle}</div>
                  <div className="mono" style={{ fontSize: 10, color: "rgba(232,235,240,0.35)", letterSpacing: "0.1em", display: "flex", gap: 20 }}>
                    <span>PURCHASED {p.date}</span>
                    <span>{fmtPrice(p.amount)} USD</span>
                    <span style={{ color: "#06D6A0" }}>● COMPLETED</span>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ minWidth: 180 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 9, color: "rgba(232,235,240,0.35)", letterSpacing: "0.12em" }}>DOWNLOADS</span>
                    <span className="mono" style={{ fontSize: 9, color: "#FF6B35" }}>{p.clicks}/{p.maxClicks}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(p.clicks / p.maxClicks) * 100}%` }} />
                  </div>
                </div>

                {/* Action */}
                <button
                  className={p.clicks >= p.maxClicks ? "btn-ghost" : "btn-primary"}
                  style={{
                    minWidth: 160, padding: "12px 0", fontSize: 11,
                    background: downloading === p.id
                      ? "linear-gradient(135deg, #00B4D8, #0096B4)"
                      : p.clicks >= p.maxClicks
                      ? "transparent"
                      : undefined,
                    cursor: p.clicks >= p.maxClicks ? "not-allowed" : "pointer",
                    opacity: p.clicks >= p.maxClicks ? 0.4 : 1,
                  }}
                  disabled={p.clicks >= p.maxClicks}
                  onClick={() => handleDownload(p)}
                >
                  {downloading === p.id
                    ? "▼ LINKING..."
                    : p.clicks >= p.maxClicks
                    ? "LIMIT REACHED"
                    : "▼ DOWNLOAD"}
                </button>
              </div>
            ))}
          </div>

          {/* Security notice */}
          <div className="mono" style={{
            marginTop: 32, padding: "18px 24px",
            background: "rgba(0,180,216,0.04)",
            border: "1px solid rgba(0,180,216,0.15)",
            borderRadius: 4, fontSize: 10, lineHeight: 1.8,
            color: "rgba(0,180,216,0.6)", letterSpacing: "0.06em",
          }}>
            🛡 SECURITY PROTOCOL — All download links are signed with AWS S3 presigned URLs.
            Links expire 1 hour after generation. Your file storage paths are never exposed.
            Refunds will immediately revoke all download access.
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(255,107,53,0.1)",
        padding: "36px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
        background: "rgba(13,18,32,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✈</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>SouqPilot</span>
          <span className="mono" style={{ fontSize: 9, color: "rgba(255,107,53,0.4)", letterSpacing: "0.2em", marginLeft: 6 }}>v2.0</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: "rgba(232,235,240,0.2)", letterSpacing: "0.1em" }}>
          © 2025 SOUQPILOT · SECURE DELIVERY · PRIVATE CLOUD STORAGE
        </div>
      </footer>

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "⟳"} {toast.msg}
        </div>
      )}
    </div>
  );
}
