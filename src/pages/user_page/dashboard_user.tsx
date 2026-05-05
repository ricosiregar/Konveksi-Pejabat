import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Scissors,
  Clock,
  Shield,
  Star,
  ChevronDown,
  Package,
  Truck,
  Palette,
  MapPin,
  ExternalLink,
} from "lucide-react";

/* ─── DATA ─────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Scissors,
    title: "Jahitan Presisi",
    desc: "Setiap jahitan dikerjakan oleh tenaga ahli berpengalaman lebih dari 10 tahun.",
  },
  {
    icon: Palette,
    title: "Sablon Custom",
    desc: "Terima desain kustom dalam berbagai teknik: DTF, screen printing, bordir.",
  },
  {
    icon: Clock,
    title: "Tepat Waktu",
    desc: "Kami menghargai deadline Anda. Pengerjaan sesuai jadwal yang disepakati.",
  },
  {
    icon: Shield,
    title: "Garansi Kualitas",
    desc: "Produk tidak sesuai? Kami siap revisi atau ganti tanpa biaya tambahan.",
  },
  {
    icon: Package,
    title: "MOQ Rendah",
    desc: "Mulai dari 12 pcs per warna. Cocok untuk komunitas, startup, hingga korporat.",
  },
  {
    icon: Truck,
    title: "Pengiriman Nasional",
    desc: "Kirim ke seluruh Indonesia dengan packaging aman dan rapi.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Konsultasi",
    desc: "Hubungi kami via WhatsApp atau langsung pesan melalui website. Ceritakan kebutuhan Anda.",
  },
  {
    num: "02",
    title: "Desain & Approval",
    desc: "Tim kami menyiapkan mockup desain. Anda review dan setujui sebelum produksi dimulai.",
  },
  {
    num: "03",
    title: "Produksi",
    desc: "Bahan dipotong, dijahit, dan disablon dengan standar kualitas tinggi di workshop kami.",
  },
  {
    num: "04",
    title: "Terima Produk",
    desc: "Produk dikemas dengan rapi dan dikirim langsung ke alamat Anda di seluruh Indonesia.",
  },
];

/* ─── HOOK: Intersection Observer ──────────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── COMPONENTS ────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --ink: #111110;
          --paper: #f5f4f0;
          --warm: #e8e4db;
          --accent: #c8410a;
          --accent-light: #f0ddd5;
          --muted: #7a786f;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        #landing {
          font-family: 'DM Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
        }

        .serif { font-family: 'DM Serif Display', serif; }

        /* NAV (Hidden in Dashboard) */
        .nav {
          display: none;
        }
        .nav-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.25rem;
          color: var(--accent);
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .nav-logo span { color: var(--accent); }
        .nav-cta {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 10px 22px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-cta:hover { background: var(--accent); transform: scale(1.02); }

        /* HERO */
        .hero {
          min-height: calc(100vh - 4rem);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 100px 5% 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(200,65,10,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(200,65,10,0.05) 0%, transparent 60%);
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }
        .hero-content { position: relative; z-index: 1; max-width: 820px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent-light);
          border: 1px solid rgba(200,65,10,0.2);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--accent);
          margin-bottom: 28px;
          animation: fadeUp 0.6s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .hero-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--ink);
          animation: fadeUp 0.6s ease 0.1s both;
        }
        .hero-title em { font-style: italic; color: var(--accent); }
        .hero-sub {
          margin-top: 24px;
          font-size: 1.1rem;
          line-height: 1.65;
          color: var(--muted);
          max-width: 480px;
          font-weight: 300;
          animation: fadeUp 0.6s ease 0.2s both;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 16px;
          margin-top: 40px; flex-wrap: wrap;
          animation: fadeUp 0.6s ease 0.3s both;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--ink); color: var(--paper);
          padding: 14px 28px; border-radius: 100px;
          font-size: 0.95rem; font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s, gap 0.2s;
        }
        .btn-primary:hover { background: var(--accent); gap: 12px; }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--muted); font-size: 0.9rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--ink); }
        .hero-scroll {
          position: absolute; bottom: 32px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          color: var(--muted); font-size: 0.75rem;
          animation: fadeIn 1s ease 1s both;
        }
        .hero-scroll svg { animation: bounce 2s infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* STATS STRIP */
        .stats {
          background: var(--ink);
          padding: 40px 5%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
        }
        @media (max-width: 640px) {
          .stats { grid-template-columns: repeat(2, 1fr); }
        }
        .stat-item {
          padding: 24px 32px;
          border-right: 1px solid rgba(255,255,255,0.08);
          text-align: center;
        }
        .stat-item:last-child { border-right: none; }
        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: var(--paper);
          display: block;
        }
        .stat-label {
          font-size: 0.8rem;
          color: rgba(245,244,240,0.45);
          margin-top: 4px;
          display: block;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* SECTION */
        .section { padding: 96px 5%; }
        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .section-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        .section-title em { font-style: italic; color: var(--accent); }
        .section-desc {
          margin-top: 16px;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--muted);
          max-width: 480px;
          font-weight: 300;
        }

        /* ABOUT */
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          margin-top: 64px;
        }
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
        }
        .about-img-wrap {
          position: relative;
          aspect-ratio: 4/5;
          border-radius: 4px;
          overflow: hidden;
          background: var(--warm);
        }
        .about-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
          filter: sepia(10%) contrast(1.05);
        }
        .about-img-badge {
          position: absolute;
          bottom: 24px; right: -16px;
          background: var(--paper);
          border: 1px solid var(--warm);
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        .about-img-badge strong {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          display: block;
          color: var(--accent);
        }
        .about-img-badge span {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .about-checks { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }
        .about-check {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 0.9rem; color: var(--ink);
        }
        .about-check svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }

        /* FEATURES */
        .features-bg { background: var(--warm); }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          margin-top: 64px;
          background: rgba(0,0,0,0.06);
          border-radius: 8px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr; }
        }
        .feature-card {
          background: var(--warm);
          padding: 36px 32px;
          transition: background 0.25s;
        }
        .feature-card:hover { background: var(--paper); }
        .feature-icon {
          width: 44px; height: 44px;
          background: var(--accent-light);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 20px;
        }
        .feature-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.15rem;
          color: var(--ink);
          margin-bottom: 10px;
        }
        .feature-desc {
          font-size: 0.875rem;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 300;
        }

        /* STEPS */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-top: 64px;
          position: relative;
        }
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr; }
        }
        .steps-grid::before {
          content: '';
          position: absolute;
          top: 28px; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.3;
        }
        @media (max-width: 768px) {
          .steps-grid::before { display: none; }
        }
        .step-card { padding: 0 24px 0 0; }
        .step-num {
          font-family: 'DM Serif Display', serif;
          font-size: 2.5rem;
          color: var(--accent);
          opacity: 0.25;
          line-height: 1;
          margin-bottom: 16px;
        }
        .step-title {
          font-weight: 600;
          font-size: 1rem;
          color: var(--ink);
          margin-bottom: 10px;
        }
        .step-desc {
          font-size: 0.875rem;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 300;
        }

        /* CTA */
        .cta-section {
          background: var(--ink);
          padding: 96px 5%;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(200,65,10,0.15) 0%, transparent 70%);
        }
        .cta-content { position: relative; z-index: 1; }
        .cta-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          color: var(--paper);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        .cta-title em { font-style: italic; color: #f0a080; }
        .cta-sub {
          font-size: 1rem;
          color: rgba(245,244,240,0.5);
          margin-bottom: 40px;
          font-weight: 300;
        }
        .btn-accent {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: var(--paper);
          padding: 14px 32px; border-radius: 100px;
          font-size: 1rem; font-weight: 500;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s, gap 0.2s;
          box-shadow: 0 4px 24px rgba(200,65,10,0.4);
        }
        .btn-accent:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 32px rgba(200,65,10,0.5);
          gap: 12px;
        }

        /* MAP SECTION */
        .map-section {
          padding: 96px 5%;
          background: var(--paper);
        }
        .map-inner {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 40px;
          align-items: stretch;
          margin-top: 48px;
        }
        @media (max-width: 900px) {
          .map-inner { grid-template-columns: 1fr; }
        }
        .map-frame-wrap {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--warm);
          min-height: 360px;
        }
        .map-frame-wrap iframe {
          width: 100%;
          height: 100%;
          min-height: 360px;
          border: none;
          display: block;
        }
        .map-info-card {
          background: var(--ink);
          border-radius: 12px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 28px;
        }
        .map-info-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245,244,240,0.35);
          margin-bottom: 8px;
        }
        .map-info-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: var(--paper);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .map-info-name em { font-style: italic; color: #f0a080; }
        .map-info-addr {
          font-size: 0.85rem;
          color: rgba(245,244,240,0.5);
          line-height: 1.6;
          font-weight: 300;
        }
        .map-hours {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .map-hour-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
        }
        .map-hour-day { color: rgba(245,244,240,0.45); font-weight: 300; }
        .map-hour-time { color: var(--paper); font-weight: 500; }
        .map-hour-time.closed { color: rgba(200,65,10,0.7); }
        .map-btn-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn-maps-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--accent); color: var(--paper);
          padding: 12px 20px; border-radius: 100px;
          font-size: 0.875rem; font-weight: 500;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-maps-primary:hover { background: #a53208; transform: scale(1.02); }
        .map-tip {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(200,65,10,0.12);
          border: 1px solid rgba(200,65,10,0.2);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .map-tip svg { color: #f0a080; flex-shrink: 0; margin-top: 1px; }
        .map-tip-text {
          font-size: 0.775rem;
          color: rgba(245,244,240,0.55);
          line-height: 1.55;
          font-weight: 300;
        }

        /* FOOTER */
        .footer {
          background: var(--ink);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 32px 5%;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .footer-logo {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: var(--paper);
        }
        .footer-logo span { color: var(--accent); }
        .footer-copy {
          font-size: 0.8rem;
          color: rgba(245,244,240,0.3);
        }
      `}</style>

      <div id="landing">
        {/* NAV - Hidden */}

        {/* HERO */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-content">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Produksi aktif · Estimasi 7–14 hari kerja
            </div>
            <h1 className="hero-title">
              Pakaian yang <em>bicara</em><br />
              untuk brand Anda
            </h1>
            <p className="hero-sub">
              Konveksi custom berkualitas tinggi untuk komunitas. — kami tangani semuanya.
            </p>
            <div className="hero-actions" />
          </div>
          <div className="hero-scroll">
            <span>Scroll</span>
            <ChevronDown size={14} />
          </div>
        </section>

        {/* ABOUT */}
        <section className="section">
          <FadeIn>
            <p className="section-label">Tentang Kami</p>
          </FadeIn>
          <div className="about-grid">
            <FadeIn>
              <div className="about-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=750&fit=crop"
                  alt="Workshop konveksi"
                />
                <div className="about-img-badge">
                  <strong>2016</strong>
                  <span>Berdiri sejak</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <h2 className="section-title">
                Bukan sekadar<br /><em>jahit menjahit</em>
              </h2>
              <p className="section-desc">
                Kami adalah mitra produksi pakaian yang peduli pada detail.
                Selama 8 tahun, kami telah membantu ratusan brand, komunitas,
                dan perusahaan mewujudkan identitas visual mereka melalui pakaian
                yang benar-benar berkualitas.
              </p>
              <div className="about-checks">
                {[
                  "Workshop sendiri di Bandung, Jawa Barat",
                  "Tim QC yang ketat di setiap tahap produksi",
                  "Bahan premium dari supplier terpercaya",
                  "Melayani order satuan hingga ribuan pcs",
                ].map((t) => (
                  <div key={t} className="about-check">
                    <CheckCircle size={16} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-bg" />
          <FadeIn className="cta-content">
            <h2 className="cta-title">
              Masih Ragu<br /><em>Untuk Produksi?</em>
            </h2>
            <p className="cta-sub">
              Coba Desain Dulu Ajaa.
            </p>
            <Link to="/chat" className="btn-accent">
              Desain Sekarang! <ArrowRight size={16} />
            </Link>
          </FadeIn>
        </section>

        {/* MAP LOKASI */}
        <section className="map-section">
          <FadeIn>
            <p className="section-label">Lokasi Kami</p>
            <h2 className="section-title">
              Kunjungi <em>workshop</em> kami
            </h2>
            <p className="section-desc">
              Ambil pesanan langsung atau konsultasi tatap muka di workshop kami di Kabupaten Bandung.
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="map-inner">
              {/* Google Maps Embed */}
              <div className="map-frame-wrap">
                <iframe
                  src="https://maps.google.com/maps?q=-7.0454444,107.5318776&z=16&output=embed"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Konveksi Pejabat"
                />
              </div>

              {/* Info Card */}
              <div className="map-info-card">
                <div>
                  <p className="map-info-label">Workshop</p>
                  <h3 className="map-info-name">Konveksi <em>Pejabat</em></h3>
                  <p className="map-info-addr">
                    Kp. Jl. Cikancung No.03/07, Pananjung<br />
                    Kec. Cangkuang, Kab. Bandung<br />
                    Jawa Barat 40238
                  </p>
                </div>

                <div className="map-hours">
                  <p className="map-info-label" style={{ marginBottom: 0 }}>Jam Operasional</p>
                  {[
                    { day: "Senin – Jumat", time: "08.00 – 17.00" },
                    { day: "Sabtu", time: "08.00 – 14.00" },
                    { day: "Minggu", time: "Tutup", closed: true },
                  ].map(({ day, time, closed }) => (
                    <div key={day} className="map-hour-row">
                      <span className="map-hour-day">{day}</span>
                      <span className={`map-hour-time${closed ? " closed" : ""}`}>{time}</span>
                    </div>
                  ))}
                </div>

                <div className="map-btn-wrap">
                  <a
                    href="https://maps.google.com/?q=-7.0454444,107.5318776"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-maps-primary"
                  >
                    <ExternalLink size={14} />
                    Buka di Google Maps
                  </a>
                  <div className="map-tip">
                    <MapPin size={14} />
                    <p className="map-tip-text">
                      Bawa bukti pesanan (nomor order atau screenshot konfirmasi) saat mengambil produk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-logo">
            Konveksi<span> </span>Pejabat
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Konveksi Pejabat · Bandung, Indonesia
          </p>
        </footer>
      </div>
    </>
  );
}