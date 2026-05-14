import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════
function useWindowSize() {
  const [size, setSize] = useState({ width: 1024, height: 768 });
  useEffect(() => {
    function update() { setSize({ width: window.innerWidth, height: window.innerHeight }); }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

// ═══════════════════════════════════════════════════════════════
// MOTION PRIMITIVES — scroll reveal, count-up, scroll progress
// ═══════════════════════════════════════════════════════════════
function useReveal({ threshold = 0.15, rootMargin = '0px 0px -80px 0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true); return;
    }
    const node = ref.current;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold, rootMargin });
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return [ref, visible];
}

// Inline style helper for scroll/mount reveal cascades.
// Pass `visible=true` to ease in; vary `delay` (ms) for stagger.
function reveal(visible, delay = 0, distance = 20) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity .7s cubic-bezier(.2,.7,.3,1) ${delay}ms, transform .7s cubic-bezier(.2,.7,.3,1) ${delay}ms`,
    willChange: 'opacity, transform',
  };
}

// Animated number that counts up from 0 to `end` once `play=true`.
function CountUp({ end, duration = 1400, play = true }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!play || started.current) return;
    started.current = true;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, play]);
  return <>{val}</>;
}

// Slim gold scroll-progress bar pinned to the top of the viewport.
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    function onScroll() {
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      setPct(Math.min(100, Math.max(0, (window.scrollY / max) * 100)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 60, pointerEvents: 'none' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-soft) 100%)', transition: 'width .1s linear' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESIGN LABELS
// ═══════════════════════════════════════════════════════════════
const FIELD_LABELS = {
  engineering: 'هندسة', cs: 'حاسب وتقنية', medical: 'طب وصحة', business: 'أعمال',
  science: 'علوم', law: 'قانون', education: 'تعليم', arts: 'فنون وتصميم',
  social: 'علوم اجتماعية', general: 'عام', all: 'جميع التخصصات'
};
const WEATHER_LABELS = { hot: 'حار', moderate: 'معتدل', cold: 'بارد', mixed: 'متغير' };
const SAFETY_LABELS = { very_safe: 'آمن جداً', safe: 'آمن', moderate: 'معتدل' };
const TIER_LABELS = { 1: 'الفئة الأولى · نخبة', 2: 'الفئة الثانية · متميز', 3: 'الفئة الثالثة · متاح' };
const MF_LABELS = {
  halal: { easy: 'حلال متوفر بسهولة', moderate: 'حلال متوفر', limited: 'حلال محدود' },
  mosque: { on_campus: 'مسجد في الحرم', nearby: 'مسجد قريب', limited: 'مساجد محدودة' },
  saudiCommunity: { large: 'مجتمع سعودي كبير', medium: 'مجتمع سعودي متوسط', small: 'مجتمع سعودي صغير' },
  prayerRoom: { yes: 'غرفة صلاة متوفرة', no: 'لا توجد غرفة صلاة', unknown: 'غير معلوم' }
};
const BUDGET_LABELS = {
  scholarship_only: 'ابتعاث حكومي',
  scholarship_preferred: 'أفضل الابتعاث',
  self_funded: 'تمويل ذاتي',
  undecided: 'لم أحدد'
};
function getWeatherColor(val) {
  if (!val) return 'var(--ink-faint)';
  if (val === 'hot' || (typeof val === 'string' && val.includes('حار'))) return '#c0392b';
  if (val === 'cold' || (typeof val === 'string' && val.includes('بارد'))) return '#2471a3';
  if (val === 'moderate' || (typeof val === 'string' && val.includes('معتدل'))) return '#b07820';
  return 'var(--ink-faint)';
}
function getSafetyColor(val) {
  if (!val) return 'var(--ink-faint)';
  if (val === 'very_safe' || (typeof val === 'string' && val.includes('جداً'))) return '#1e8449';
  if (val === 'safe' || (typeof val === 'string' && val.includes('آمن'))) return '#27ae60';
  if (val === 'moderate' || (typeof val === 'string' && val.includes('معتدل'))) return '#b07820';
  return 'var(--ink-faint)';
}

// ═══════════════════════════════════════════════════════════════
// DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════
function TopoLines({ opacity = 0.06 }) {
  return (
    <svg aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity, pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id="topo" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 0 32 Q 16 18 32 32 T 64 32" fill="none" stroke="var(--ink)" strokeWidth="0.6" />
          <path d="M 0 16 Q 16 2 32 16 T 64 16" fill="none" stroke="var(--ink)" strokeWidth="0.6" />
          <path d="M 0 48 Q 16 34 32 48 T 64 48" fill="none" stroke="var(--ink)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topo)" />
    </svg>
  );
}

function Compass({ size = 96, trackMouse = false }) {
  const c = size / 2;
  const [needleAngle, setNeedleAngle] = useState(0);
  const svgRef = useRef(null);
  useEffect(() => {
    if (!trackMouse) return;
    const onMove = (e) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setNeedleAngle(Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [trackMouse]);
  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={c - 2} fill="none" stroke="var(--ink)" strokeWidth="0.8" />
      <circle cx={c} cy={c} r={c - 12} fill="none" stroke="var(--ink)" strokeWidth="0.4" />
      <circle cx={c} cy={c} r={3} fill="var(--ink)" />
      <g transform={`rotate(${needleAngle}, ${c}, ${c})`}>
        <polygon points={`${c},${c-(c-6)} ${c-6},${c} ${c},${c+4} ${c+6},${c}`} fill="var(--accent)" />
        <polygon points={`${c},${c+(c-6)} ${c-4},${c} ${c},${c-4} ${c+4},${c}`} fill="none" stroke="var(--ink)" strokeWidth="0.8" />
      </g>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r1 = c - 2, r2 = c - (i % 6 === 0 ? 10 : 6);
        return <line key={i} x1={c+Math.cos(a)*r1} y1={c+Math.sin(a)*r1} x2={c+Math.cos(a)*r2} y2={c+Math.sin(a)*r2} stroke="var(--ink)" strokeWidth="0.6" />;
      })}
      <text x={c} y={10} textAnchor="middle" fontFamily="serif" fontSize="9" fill="var(--ink)">N</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
function HardButton({ children, onClick, variant = 'primary', disabled, size = 'md', style: extra }) {
  const [hover, setHover] = useState(false);
  const sizes = { sm: { padding: '9px 18px', fontSize: '13px' }, md: { padding: '14px 26px', fontSize: '14px' }, lg: { padding: '18px 34px', fontSize: '16px' } };
  const variants = {
    primary: { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' },
    accent: { background: 'var(--accent)', color: '#1a1206', border: '1px solid var(--accent)' },
    ghost: { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)' },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...v, ...sizes[size], fontFamily: 'var(--f-body)', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '14px', transition: 'transform .25s cubic-bezier(.2,.7,.3,1), background .25s', transform: hover && !disabled ? 'translateY(-2px)' : 'translateY(0)', borderRadius: 0, ...extra }}>
      {children}
    </button>
  );
}

function SectionEyebrow({ n, en, ar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '24px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid var(--hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px' }}>
        <span style={{ fontFamily: 'var(--f-num)', fontSize: '56px', lineHeight: 0.9, color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>{n}</span>
        <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '32px', lineHeight: 1 }}>{ar}</span>
      </div>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>— {en}</span>
    </div>
  );
}

const edMono = { fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase' };
const edNum = { fontFamily: 'var(--f-num)', fontFeatureSettings: "'lnum' 1", fontVariantNumeric: 'lining-nums' };

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const COUNTRIES = [
  { value: 'USA', ar: 'أمريكا', arFull: 'الولايات المتحدة', en: 'United States', code: 'US', lat: '38°N' },
  { value: 'UK', ar: 'بريطانيا', arFull: 'المملكة المتحدة', en: 'United Kingdom', code: 'GB', lat: '54°N' },
  { value: 'Canada', ar: 'كندا', arFull: 'كندا', en: 'Canada', code: 'CA', lat: '62°N' },
  { value: 'Australia', ar: 'أستراليا', arFull: 'أستراليا', en: 'Australia', code: 'AU', lat: '27°S' },
  { value: 'Japan', ar: 'اليابان', arFull: 'اليابان', en: 'Japan', code: 'JP', lat: '36°N' },
  { value: 'SouthKorea', ar: 'كوريا', arFull: 'كوريا الجنوبية', en: 'South Korea', code: 'KR', lat: '37°N' },
  { value: 'Spain', ar: 'إسبانيا', arFull: 'إسبانيا', en: 'Spain', code: 'ES', lat: '40°N' },
  { value: 'NewZealand', ar: 'نيوزيلندا', arFull: 'نيوزيلندا', en: 'New Zealand', code: 'NZ', lat: '41°S' },
  { value: 'Germany', ar: 'ألمانيا', arFull: 'ألمانيا', en: 'Germany', code: 'DE', lat: '51°N' },
  { value: 'Ireland', ar: 'أيرلندا', arFull: 'أيرلندا', en: 'Ireland', code: 'IE', lat: '53°N' },
  { value: 'Malaysia', ar: 'ماليزيا', arFull: 'ماليزيا', en: 'Malaysia', code: 'MY', lat: '3°N' },
  { value: 'Turkey', ar: 'تركيا', arFull: 'تركيا', en: 'Turkey', code: 'TR', lat: '39°N' },
  { value: 'Netherlands', ar: 'هولندا', arFull: 'هولندا', en: 'Netherlands', code: 'NL', lat: '52°N' },
  { value: 'France', ar: 'فرنسا', arFull: 'فرنسا', en: 'France', code: 'FR', lat: '46°N' },
];

const PASSIONS_OPTIONS = [
  { value: 'hands_on', label: 'العمل على مشاريع عملية ومختبرات' },
  { value: 'data_math', label: 'تحليل البيانات وحل المسائل الرياضية' },
  { value: 'leadership', label: 'قيادة فرق وتنظيم فعاليات' },
  { value: 'research', label: 'البحث والقراءة والكتابة الأكاديمية' },
  { value: 'design', label: 'التصميم والعمل الإبداعي' },
  { value: 'helping', label: 'مساعدة الناس والعمل الاجتماعي' },
  { value: 'coding', label: 'البرمجة وبناء الأنظمة التقنية' },
  { value: 'entrepreneurship', label: 'ريادة الأعمال والمشاريع التجارية' },
];

const GOALS_OPTIONS = [
  { value: 'global_company', label: 'العمل في شركة عالمية بالخارج' },
  { value: 'ksa_government', label: 'العودة للسعودية والعمل في القطاع الحكومي' },
  { value: 'ksa_private', label: 'العودة للسعودية والعمل في القطاع الخاص' },
  { value: 'own_business', label: 'بدء مشروع تجاري خاص' },
  { value: 'academia', label: 'العمل في الأكاديميا والبحث العلمي' },
  { value: 'professional_license', label: 'الحصول على رخصة مهنية مثل PE أو CPA' },
  { value: 'exploring', label: 'لا زلت أستكشف خياراتي' },
];

// ═══════════════════════════════════════════════════════════════
// PROGRAM STATUS DATA
// ═══════════════════════════════════════════════════════════════
const PROGRAM_SCHEDULE = [
  { id: 'rawwad', name: 'مسار الرواد', description: 'أفضل 30 جامعة عالمياً • يغطي الرسوم والإقامة والتأمين والسفر', levels: ['bachelor', 'master'], openMonth: 2, closeMonth: 4, openLabel: 'فبراير', closeLabel: 'أبريل', link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-arruaad/' },
  { id: 'tamayoz', name: 'مسار التميز', description: 'أفضل 50 جامعة عالمياً • تخصصات ذات أولوية لرؤية 2030', levels: ['bachelor', 'master'], openMonth: 2, closeMonth: 4, openLabel: 'فبراير', closeLabel: 'أبريل', link: 'https://moe.gov.sa/ar/knowledgecenter/eservices/Pages/ksp.aspx' },
  { id: 'imdad', name: 'مسار إمداد', description: 'أفضل 200 جامعة • مجالات هندسة وطب وأعمال وتقنية وعلوم', levels: ['bachelor', 'master'], openMonth: 2, closeMonth: 4, openLabel: 'فبراير', closeLabel: 'أبريل', link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-emdad/' },
  { id: 'waed', name: 'مسار واعد', description: 'مع شركات سعودية كبرى • يضمن التوظيف بعد التخرج', levels: ['highschool'], openMonth: 1, closeMonth: 3, openLabel: 'يناير', closeLabel: 'مارس', link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-waaid/' },
  { id: 'aramco', name: 'برنامج أرامكو CDPNE', description: 'لطلاب الثانوية العلمية • يضمن التوظيف في أرامكو', levels: ['highschool'], openMonth: 9, closeMonth: 11, openLabel: 'سبتمبر', closeLabel: 'نوفمبر', link: 'https://www.aramco.com/en/careers/for-saudi-applicants/student-opportunities/college-degree-program' },
  { id: 'sabic', name: 'منح سابك', description: 'للتخصصات الهندسية والكيميائية • معدل 90% فأعلى', levels: ['highschool'], openMonth: 10, closeMonth: 12, openLabel: 'أكتوبر', closeLabel: 'ديسمبر', link: 'https://www.sabic.com/en/careers/middle-east-africa/students-and-fresh-graduates' },
  { id: 'kgsp', name: 'برنامج كاوست KGSP', description: 'تخصصات STEM عبر موهبة • مع الماجستير في كاوست لاحقاً', levels: ['highschool'], openMonth: 10, closeMonth: 1, crossYear: true, openLabel: 'أكتوبر', closeLabel: 'يناير', link: 'https://kgsp.kaust.edu.sa/' },
  { id: 'health', name: 'الابتعاث الصحي', description: 'وزارة الصحة • للتخصصات الطبية والصحية فقط', levels: ['bachelor', 'master', 'phd'], openMonth: 1, closeMonth: 3, openLabel: 'يناير', closeLabel: 'مارس', link: 'https://www.moh.gov.sa' },
  { id: 'misk', name: 'زمالة مسك', description: 'برنامج قيادي لمدة 6 أشهر • تطوير ريادي وقيادي', levels: ['bachelor', 'master'], openMonth: 4, closeMonth: 6, openLabel: 'أبريل', closeLabel: 'يونيو', link: 'https://misk.org.sa' },
  { id: 'faculty', name: 'ابتعاث هيئة التدريس', description: 'بترشيح من الجامعة السعودية • للعودة للتدريس فيها', levels: ['master', 'phd'], varies: true, openLabel: 'يتفاوت حسب الجامعة', link: 'https://moe.gov.sa' },
  { id: 'sacm', name: 'الملحقية الثقافية SACM', description: 'تسجيل مستمر • رعاية جميع المبتعثين السعوديين في الخارج', levels: ['all'], ongoing: true, openLabel: 'مفتوح على مدار السنة', link: 'https://www.sacm.org/' },
];

const MONTH_NAMES = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const LEVEL_DISPLAY = { highschool: 'ثانوية', bachelor: 'بكالوريوس', master: 'ماجستير', phd: 'دكتوراه', all: 'جميع المراحل' };
const LEVEL_FILTERS = [
  { value: 'all', label: 'الكل' }, { value: 'highschool', label: 'ثانوية' },
  { value: 'bachelor', label: 'بكالوريوس' }, { value: 'master', label: 'ماجستير' },
  { value: 'phd', label: 'دكتوراه وأخرى' },
];

function getProgramStatus(prog) {
  if (prog.ongoing) return 'ongoing';
  if (prog.varies) return 'varies';
  const m = new Date().getMonth() + 1;
  if (prog.crossYear) { const isOpen = m >= prog.openMonth || m <= prog.closeMonth; if (!isOpen) return 'closed'; return m === prog.closeMonth ? 'closing' : 'open'; }
  const isOpen = m >= prog.openMonth && m <= prog.closeMonth;
  if (!isOpen) return 'closed';
  return m === prog.closeMonth ? 'closing' : 'open';
}

function getNextOpenText(prog) {
  if (!prog.openMonth) return null;
  const m = new Date().getMonth() + 1;
  let diff = prog.openMonth - m;
  if (diff <= 0) diff += 12;
  if (diff === 1) return 'الشهر القادم';
  if (diff === 2) return 'خلال شهرين';
  return `في ${MONTH_NAMES[prog.openMonth]}`;
}

function getStatusStyle(status) {
  switch (status) {
    case 'open': return { label: 'مفتوح', color: '#2d5016', bg: 'rgba(45,80,22,0.12)' };
    case 'closing': return { label: 'يغلق قريباً', color: '#8b5e00', bg: 'rgba(139,94,0,0.12)' };
    case 'closed': return { label: 'مغلق', color: '#fff', bg: '#c0392b' };
    case 'varies': return { label: 'يتفاوت', color: 'var(--accent)', bg: 'rgba(182,135,58,0.12)' };
    case 'ongoing': return { label: 'مستمر', color: '#2d5016', bg: 'rgba(45,80,22,0.12)' };
    default: return { label: '', color: 'var(--ink-faint)', bg: 'transparent' };
  }
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE DATA
// ═══════════════════════════════════════════════════════════════
const CHAPTERS = [
  { id: 'you', n: 'I', title: 'أنت', en: 'من أنت', keys: ['academicLevel', 'currentInstitution', 'gpa', 'english'] },
  { id: 'goals', n: 'II', title: 'أهدافك', en: 'ما تريده', keys: ['field', 'degreeLevel', 'passions', 'goals'] },
  { id: 'logistics', n: 'III', title: 'اللوجستيات', en: 'التفاصيل', keys: ['countries', 'weatherPreference', 'budget', 'gender', 'mahram'] },
];

// ═══════════════════════════════════════════════════════════════
// HOME: NAV
// ═══════════════════════════════════════════════════════════════
function NavLink({ href, children }) {
  const [hover, setHover] = useState(false);
  return (
    <a href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', transition: 'color .2s', color: hover ? 'var(--navy)' : 'var(--navy-soft)', paddingBottom: 4, textDecoration: 'none' }}>
      {children}
      <span style={{ position: 'absolute', bottom: -2, right: 0, height: 1.5, background: 'var(--gold)', width: hover ? '100%' : 0, transition: 'width .3s ease' }} />
    </a>
  );
}

function Nav({ onStart, isMobile }) {
  return (
    <header className="no-print" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(245,239,227,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '16px 16px' : '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: '14px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 800, fontSize: isMobile ? 18 : 20, fontFamily: 'var(--f-warm)', boxShadow: '0 4px 12px rgba(var(--gold-shadow), 0.3)' }}>م</div>
          <span style={{ fontFamily: 'var(--f-warm)', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: 'var(--navy)' }}>مستشار الابتعاث</span>
        </div>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '32px', fontFamily: 'var(--f-warm)', fontSize: '14px', fontWeight: 500 }}>
            <NavLink href="#how">كيف يعمل</NavLink>
            <NavLink href="#programs">برامج الابتعاث</NavLink>
            <NavLink href="#explorer">الجامعات</NavLink>
          </nav>
        )}
        <button onClick={onStart} style={{ background: 'var(--navy)', color: 'var(--sand)', border: 'none', padding: isMobile ? '10px 18px' : '12px 24px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontWeight: 600, fontSize: isMobile ? 13 : 14, cursor: 'pointer', transition: 'background .25s ease, color .25s ease, transform .25s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--navy)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = 'var(--sand)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          ابدأ الاستشارة
        </button>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: HERO
// ═══════════════════════════════════════════════════════════════
function Hero({ onStart, isMobile }) {
  const heroPhoto = '/images/hero-student.jpg';
  const [mounted, setMounted] = useState(false);
  const [statsRef, statsVisible] = useReveal({ threshold: 0.3 });
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '32px 16px 60px' : '60px 40px 100px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: isMobile ? '40px' : '60px', alignItems: 'center' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'var(--sand-2)', color: 'var(--navy-soft)', padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--f-warm)', marginBottom: '24px', ...reveal(mounted, 0) }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
          <span>مدعوم بالذكاء الاصطناعي</span>
        </div>
        <h1 style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? 'clamp(36px, 9vw, 48px)' : 'clamp(40px, 5vw, 64px)', fontWeight: 700, lineHeight: 1.2, color: 'var(--navy)', margin: '0 0 24px', letterSpacing: '-0.5px', ...reveal(mounted, 120) }}>
          اعثر على جامعتك <span style={{ color: 'var(--gold)' }}>المثالية</span> في الخارج
        </h1>
        <p style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? '16px' : '18px', color: 'var(--navy-soft)', lineHeight: 1.8, margin: '0 0 36px', maxWidth: '520px', fontWeight: 400, ...reveal(mounted, 240) }}>
          نوصي بأفضل الجامعات والمنح الحكومية حسب معدلك ومجالك واهتماماتك، خلال دقائق وبدون تعقيد.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', flexWrap: 'wrap', ...reveal(mounted, 360) }}>
          <button onClick={onStart} style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none', padding: '18px 32px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 16px rgba(var(--gold-shadow),0.3)', transition: 'transform .25s ease, box-shadow .25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(var(--gold-shadow),0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(var(--gold-shadow),0.3)'; }}>
            <span>ابدأ الاستشارة</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <a href="#how" style={{ color: 'var(--navy)', fontFamily: 'var(--f-warm)', fontWeight: 500, fontSize: '15px', textDecoration: 'underline', textDecorationThickness: '1.5px', textUnderlineOffset: '5px', padding: '18px 8px' }}>شاهد كيف يعمل</a>
        </div>
        <div ref={statsRef} style={{ display: 'flex', gap: isMobile ? '24px' : '40px', paddingTop: '28px', borderTop: '1px solid var(--warm-rule)', flexWrap: 'wrap', ...reveal(mounted, 480) }}>
          {[{ n: 236, l: 'جامعة معتمدة' }, { n: 14, l: 'دولة حول العالم' }, { n: 11, l: 'برنامج ابتعاث' }].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontFamily: 'var(--f-warm-num)', fontSize: '32px', fontWeight: 700, color: 'var(--navy)', direction: 'ltr', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                <CountUp end={s.n} duration={1400 + i * 200} play={statsVisible} />
              </div>
              <div style={{ fontFamily: 'var(--f-warm)', fontSize: '13px', color: 'var(--navy-soft)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {!isMobile && (
        <div style={{ position: 'relative', aspectRatio: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', ...reveal(mounted, 180, 30) }}>
          <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle at 60% 40%, var(--gold-soft) 0%, transparent 65%)', borderRadius: '50%', opacity: 0.5, zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: '28px', overflow: 'hidden', background: 'linear-gradient(135deg, var(--gold-soft) 0%, var(--sand-2) 100%)', boxShadow: '0 30px 80px rgba(26,41,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={heroPhoto} alt="طالب سعودي مبتعث" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'ken-burns 16s ease-in-out infinite alternate' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div style={{ position: 'absolute', top: '8%', left: '-8%', background: 'var(--sand-card)', borderRadius: '18px', padding: '14px 18px', boxShadow: '0 10px 40px rgba(26,41,66,0.15)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--warm-rule)', zIndex: 2, animation: 'warm-float 6s ease-in-out infinite' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)' }}>CA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)', direction: 'ltr' }}>Toronto</div>
              <div style={{ fontSize: 11, color: 'var(--navy-soft)', fontWeight: 500, fontFamily: 'var(--f-warm)' }}>الفئة الأولى · هندسة</div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '32%', right: '-8%', background: 'var(--sand-card)', borderRadius: '18px', padding: '14px 18px', boxShadow: '0 10px 40px rgba(26,41,66,0.15)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--warm-rule)', zIndex: 2, animation: 'warm-float 6s ease-in-out infinite 2s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)' }}>UK</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)', direction: 'ltr' }}>Imperial</div>
              <div style={{ fontSize: 11, color: 'var(--navy-soft)', fontWeight: 500, fontFamily: 'var(--f-warm)' }}>الفئة الأولى · طب</div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '6%', left: '4%', background: 'var(--sand-card)', borderRadius: '18px', padding: '14px 18px', boxShadow: '0 10px 40px rgba(26,41,66,0.15)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--warm-rule)', zIndex: 2, animation: 'warm-float 6s ease-in-out infinite 4s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)' }}>DE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--f-warm-num)', direction: 'ltr' }}>TU Munich</div>
              <div style={{ fontSize: 11, color: 'var(--navy-soft)', fontWeight: 500, fontFamily: 'var(--f-warm)' }}>الفئة الثانية · علوم</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: HOW IT WORKS (new — replaces Method)
// ═══════════════════════════════════════════════════════════════
function HowItWorks({ isMobile }) {
  const steps = [
    {
      n: '01',
      title: 'شارك ملفك',
      desc: 'ارفع سيرتك الذاتية أو أجب عن أسئلة قصيرة عن معدلك وتخصصك وما تبحث عنه.',
      icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>)
    },
    {
      n: '02',
      title: 'تحليل ذكي',
      desc: 'نموذجنا يقرأ 236 جامعة و11 برنامج ابتعاث ويختار ما يناسبك خلال ثوانٍ.',
      icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>)
    },
    {
      n: '03',
      title: 'توصيات شخصية',
      desc: 'تقرير مفصّل: جامعات مرشحة، برامج ابتعاث مناسبة، وخطة عمل خطوة بخطوة.',
      icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
    }
  ];
  const [sectionRef, visible] = useReveal();
  return (
    <section id="how" ref={sectionRef} style={{ padding: isMobile ? '60px 16px' : '100px 40px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'var(--f-warm-num)', direction: 'ltr', ...reveal(visible, 0) }}>
          <span style={{ width: 24, height: 1.5, background: 'var(--gold)' }} />
          <span>How it works</span>
        </div>
        <h2 style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? '28px' : 'clamp(32px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.25, color: 'var(--navy)', margin: '0 0 16px', letterSpacing: '-0.5px', ...reveal(visible, 80) }}>ثلاث خطوات بسيطة</h2>
        <p style={{ fontFamily: 'var(--f-warm)', fontSize: '17px', color: 'var(--navy-soft)', lineHeight: 1.7, margin: '16px auto 0', maxWidth: '600px', ...reveal(visible, 160) }}>من ملف بسيط إلى توصيات شخصية في أقل من خمس دقائق.</p>
      </div>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Dashed connecting line behind icons — desktop only */}
        {!isMobile && (
          <svg aria-hidden="true" style={{ position: 'absolute', top: 120, right: '16.5%', left: '16.5%', height: 2, width: '67%', pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 800 2" preserveAspectRatio="none">
            <line x1="0" y1="1" x2="800" y2="1" stroke="var(--gold-soft)" strokeWidth="2" strokeDasharray="6 8" style={{ strokeDashoffset: visible ? 0 : 200, transition: 'stroke-dashoffset 1.4s ease-out 400ms' }} />
          </svg>
        )}
        {steps.map((s, i) => (
          <div key={i} style={{ background: 'var(--sand-card)', border: '1px solid var(--warm-rule)', borderRadius: '24px', padding: '36px 28px', transition: 'transform .3s ease, box-shadow .3s ease, border-color .3s ease, opacity .7s cubic-bezier(.2,.7,.3,1) ' + (260 + i * 140) + 'ms', position: 'relative', zIndex: 1, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 22px 56px rgba(26,41,66,0.10)'; e.currentTarget.style.borderColor = 'var(--gold-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--warm-rule)'; }}>
            <div style={{ fontFamily: 'var(--f-warm-num)', fontSize: '14px', fontWeight: 700, color: 'var(--gold)', marginBottom: '20px', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 28, height: 1.5, background: 'var(--gold)' }} />
              <span>Step {s.n}</span>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: 'var(--navy)', transform: visible ? 'scale(1)' : 'scale(0.85)', transition: `transform .6s cubic-bezier(.2,.7,.3,1) ${360 + i * 140}ms` }}>
              {s.icon}
            </div>
            <div style={{ fontFamily: 'var(--f-warm)', fontSize: '20px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>{s.title}</div>
            <div style={{ fontFamily: 'var(--f-warm)', fontSize: '15px', color: 'var(--navy-soft)', lineHeight: 1.7 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: QUOTE RIBBON
// ═══════════════════════════════════════════════════════════════
function QuoteRibbon({ isMobile }) {
  return (
    <section style={{ maxWidth: 1280, margin: isMobile ? '48px auto 0' : '96px auto 0', padding: isMobile ? '0 16px' : '0 40px' }}>
      <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: isMobile ? '24px 0' : '36px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto', gap: isMobile ? '12px' : '32px', alignItems: 'center' }}>
        {!isMobile && <span style={{ ...edMono, color: 'var(--accent)', direction: 'ltr' }}>§ I</span>}
        <p style={{ margin: 0, fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? '22px' : 'clamp(24px, 2.6vw, 38px)', lineHeight: 1.5, textAlign: 'center' }}>
          ساعات بحث، ملفات إكسل، أسئلة بدون إجابة — اختصرها مستشار الابتعاث في ثلاث دقائق.
        </p>
        {!isMobile && <span style={{ ...edMono, color: 'var(--ink-faint)' }}>الرياض ٢٦</span>}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: METHOD (HOW IT WORKS)
// ═══════════════════════════════════════════════════════════════
function Method({ isMobile }) {
  const steps = [
    { n: 'I', en: 'Tell us', ar: 'أَخبِرنا', body: 'اثنا عشر سؤالاً عن مستواك، تخصصك، وأهدافك. لا حسابات، لا بريد إلكتروني.' },
    { n: 'II', en: 'We listen', ar: 'نُنصِت', body: 'يقرأ المستشار ملفك، يطابقه مع شروط البرامج الحكومية وقواعد الجامعات.' },
    { n: 'III', en: 'We answer', ar: 'نُجيب', body: 'تقرير محرر بعناية: برامج، جامعات، مراحل عملية للأسابيع القادمة.' },
  ];
  return (
    <section id="method" style={{ maxWidth: 1280, margin: isMobile ? '48px auto 0' : '96px auto 0', padding: isMobile ? '0 16px' : '0 40px' }}>
      <SectionEyebrow n="I" en="المنهجية" ar="الطريقة" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 0 }}>
        {steps.map((s, i) => (
          <article key={i} style={{ padding: isMobile ? '20px 0' : '8px 32px 8px 0', borderInlineStart: !isMobile && i > 0 ? '1px solid var(--hairline)' : 'none', paddingInlineStart: !isMobile && i > 0 ? '32px' : 0, borderTop: isMobile && i > 0 ? '1px solid var(--hairline)' : 'none' }}>
            <div style={{ ...edNum, fontSize: isMobile ? '56px' : '84px', fontStyle: 'italic', lineHeight: 0.9, color: 'var(--accent)', fontWeight: 400, marginBottom: '16px' }}>{s.n}.</div>
            <div style={{ ...edMono, color: 'var(--ink-soft)', marginBottom: '6px' }}>المرحلة {String(i + 1).padStart(2, '0')}</div>
            <h3 style={{ fontFamily: 'var(--f-arabic-disp)', fontWeight: 400, fontSize: isMobile ? '32px' : '44px', lineHeight: 1, margin: '0 0 14px' }}>{s.ar}</h3>
            <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '15px', lineHeight: 2, color: 'var(--ink-soft)', margin: 0 }}>{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: PROGRAM STATUS BOARD
// ═══════════════════════════════════════════════════════════════
function getWarmStatusStyle(status) {
  switch (status) {
    case 'open':    return { label: 'مفتوح',     bg: 'var(--gold-soft)',         color: 'var(--navy)',      pulse: true };
    case 'closing': return { label: 'يغلق قريباً', bg: 'var(--bronze)',            color: 'var(--sand)',      pulse: false };
    case 'closed':  return { label: 'مغلق',      bg: 'rgba(26,41,66,0.08)',      color: 'var(--navy-soft)', pulse: false };
    case 'varies':  return { label: 'يتفاوت',    bg: 'var(--sand-2)',            color: 'var(--navy-soft)', pulse: false };
    case 'ongoing': return { label: 'مستمر',     bg: 'var(--sand-2)',            color: 'var(--navy-soft)', pulse: false };
    default:        return { label: '',          bg: 'transparent',              color: 'var(--navy-soft)', pulse: false };
  }
}

function ProgramBoard({ programFilter, setProgramFilter, isMobile }) {
  const [sectionRef, visible] = useReveal();
  const filtered = PROGRAM_SCHEDULE.filter(p => {
    if (programFilter === 'all') return true;
    if (programFilter === 'phd') return p.levels.includes('phd') || p.levels.includes('all');
    return p.levels.includes(programFilter) || p.levels.includes('all');
  });

  return (
    <section id="programs" ref={sectionRef} style={{ background: 'var(--sand-card)', padding: isMobile ? '60px 16px' : '100px 40px', borderTop: '1px solid var(--warm-rule)', borderBottom: '1px solid var(--warm-rule)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'var(--f-warm-num)', direction: 'ltr', ...reveal(visible, 0) }}>
            <span style={{ width: 24, height: 1.5, background: 'var(--gold)' }} />
            <span>Scholarship Programs</span>
          </div>
          <h2 style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? '28px' : 'clamp(32px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.25, color: 'var(--navy)', margin: '0 0 16px', letterSpacing: '-0.5px', ...reveal(visible, 80) }}>برامج الابتعاث الحكومية</h2>
          <p style={{ fontFamily: 'var(--f-warm)', fontSize: '17px', color: 'var(--navy-soft)', lineHeight: 1.7, margin: 0, maxWidth: '720px', ...reveal(visible, 160) }}>
            ١١ برنامج رسمي · مواعيد التقديم تقريبية بناءً على الدورات السابقة، تحقق دائماً من المواقع الرسمية قبل التقديم.
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', overflowX: isMobile ? 'auto' : 'visible', ...reveal(visible, 220) }}>
          {LEVEL_FILTERS.map(f => {
            const active = programFilter === f.value;
            return (
              <button key={f.value} onClick={() => setProgramFilter(f.value)}
                style={{ background: active ? 'var(--navy)' : 'var(--sand)', border: '1px solid', borderColor: active ? 'var(--navy)' : 'var(--warm-rule)', padding: '10px 18px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontSize: '14px', fontWeight: 500, color: active ? 'var(--sand)' : 'var(--navy-soft)', cursor: 'pointer', transition: 'all .2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--navy)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--warm-rule)'; e.currentTarget.style.color = 'var(--navy-soft)'; } }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Program card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
          {filtered.map((prog, i) => {
            const status = getProgramStatus(prog);
            const sStyle = getWarmStatusStyle(status);
            const nextOpen = status === 'closed' ? getNextOpenText(prog) : null;
            const delay = 280 + Math.min(i, 8) * 70;
            return (
              <article key={prog.id} style={{ background: 'var(--sand)', border: '1px solid var(--warm-rule)', borderRadius: '20px', padding: '24px', transition: 'transform .3s ease, box-shadow .3s ease, border-color .3s ease, opacity .7s cubic-bezier(.2,.7,.3,1) ' + delay + 'ms', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(26,41,66,0.08)'; e.currentTarget.style.borderColor = 'var(--gold-soft)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--warm-rule)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'var(--f-warm-num)', fontSize: '13px', fontWeight: 700, color: 'var(--gold)', direction: 'ltr', letterSpacing: '0.5px' }}>
                    №{String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontFamily: 'var(--f-warm)', fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '999px', background: sStyle.bg, color: sStyle.color, animation: sStyle.pulse ? 'gold-pulse-pill 2.4s ease-out infinite' : 'none' }}>
                    {sStyle.label}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--f-warm)', fontSize: '22px', lineHeight: 1.3, margin: '0 0 10px', fontWeight: 700, color: 'var(--navy)' }}>{prog.name}</h3>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {(prog.levels.includes('all') ? ['all'] : prog.levels).map(lv => (
                    <span key={lv} style={{ fontFamily: 'var(--f-warm)', fontSize: '11px', fontWeight: 600, padding: '3px 10px', background: 'var(--sand-2)', color: 'var(--navy-soft)', borderRadius: '999px' }}>{LEVEL_DISPLAY[lv]}</span>
                  ))}
                </div>
                <p style={{ fontFamily: 'var(--f-warm)', fontSize: '14px', lineHeight: 1.8, color: 'var(--navy-soft)', margin: '0 0 14px' }}>{prog.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--f-warm)', fontSize: '13px', color: 'var(--navy)', marginBottom: '8px', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {!prog.ongoing && !prog.varies && <span>يفتح {prog.openLabel} · يغلق {prog.closeLabel}</span>}
                  {(prog.varies || prog.ongoing) && <span>{prog.openLabel}</span>}
                </div>
                {nextOpen && (
                  <div style={{ fontFamily: 'var(--f-warm)', fontSize: '12px', color: 'var(--bronze)', fontWeight: 600, marginBottom: '12px' }}>
                    التالي: يفتح {nextOpen} تقريباً
                  </div>
                )}
                <a href={prog.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--f-warm)', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1.5px solid var(--gold)', paddingBottom: '2px', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--navy)'}>
                  <span>الموقع الرسمي</span><span>←</span>
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: UNIVERSITY EXPLORER
// ═══════════════════════════════════════════════════════════════
// Map Arabic country names to campus photo filenames. Missing entries fall back to a gradient placeholder.
const COUNTRY_IMAGES = {
  'الولايات المتحدة': '/images/campus-usa.jpg',
  'المملكة المتحدة': '/images/campus-uk.jpg',
  'كندا': '/images/campus-canada.jpg',
  'أستراليا': '/images/campus-australia.jpg',
  'اليابان': '/images/campus-japan.jpg',
  'كوريا الجنوبية': '/images/campus-southkorea.jpg',
  'إسبانيا': '/images/campus-spain.jpg',
  'نيوزيلندا': '/images/campus-newzealand.jpg',
  'ألمانيا': '/images/campus-germany.jpg',
  'أيرلندا': '/images/campus-ireland.jpg',
  'ماليزيا': '/images/campus-malaysia.jpg',
  'تركيا': '/images/campus-turkey.jpg',
  'هولندا': '/images/campus-netherlands.jpg',
  'فرنسا': '/images/campus-france.jpg',
};

const UNI_COUNTRY_TABS = [
  { value: 'all', ar: 'الكل', en: 'الكل' },
  { value: 'الولايات المتحدة', ar: 'أمريكا', en: 'الولايات المتحدة' },
  { value: 'المملكة المتحدة', ar: 'بريطانيا', en: 'المملكة المتحدة' },
  { value: 'كندا', ar: 'كندا', en: 'كندا' },
  { value: 'أستراليا', ar: 'أستراليا', en: 'أستراليا' },
  { value: 'اليابان', ar: 'اليابان', en: 'اليابان' },
  { value: 'كوريا الجنوبية', ar: 'كوريا', en: 'كوريا الجنوبية' },
  { value: 'إسبانيا', ar: 'إسبانيا', en: 'إسبانيا' },
  { value: 'نيوزيلندا', ar: 'نيوزيلندا', en: 'نيوزيلندا' },
  { value: 'ألمانيا', ar: 'ألمانيا', en: 'ألمانيا' },
  { value: 'أيرلندا', ar: 'أيرلندا', en: 'أيرلندا' },
  { value: 'ماليزيا', ar: 'ماليزيا', en: 'ماليزيا' },
  { value: 'تركيا', ar: 'تركيا', en: 'تركيا' },
  { value: 'هولندا', ar: 'هولندا', en: 'هولندا' },
  { value: 'فرنسا', ar: 'فرنسا', en: 'فرنسا' },
];

const UNI_FIELD_TABS = [
  { value: 'all', label: 'الكل' },
  { value: 'engineering', label: 'هندسة' },
  { value: 'cs', label: 'حاسب' },
  { value: 'medical', label: 'طب' },
  { value: 'business', label: 'أعمال' },
  { value: 'science', label: 'علوم' },
  { value: 'law', label: 'قانون' },
  { value: 'arts', label: 'فنون' },
];

function UniversityExplorer({ universities, loading: uniLoading, isMobile }) {
  const [countryFilter, setCountryFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCount, setShowCount] = useState(12);
  const [expandedUni, setExpandedUni] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [headerRef, headerVisible] = useReveal();
  const [gridRef, gridVisible] = useReveal({ threshold: 0.05 });

  if (uniLoading) {
    return (
      <section id="explorer" style={{ background: 'var(--sand-2)', padding: isMobile ? '60px 16px' : '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '48px', height: '48px', border: '2px solid var(--warm-rule)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'ed-spin 1.2s linear infinite', margin: '0 auto 20px' }} />
          <div style={{ fontFamily: 'var(--f-warm)', fontSize: 14, color: 'var(--navy-soft)' }}>جارٍ تحميل بيانات الجامعات...</div>
        </div>
      </section>
    );
  }

  const filtered = universities
    .filter(u => countryFilter === 'all' || u.country === countryFilter)
    .filter(u => fieldFilter === 'all' || u.fields.includes(fieldFilter))
    .filter(u => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.nameAr.includes(search) || u.nameEn.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
    });

  const showing = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  return (
    <section id="explorer" style={{ background: 'var(--sand-2)', padding: isMobile ? '60px 16px' : '100px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div ref={headerRef} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'var(--f-warm-num)', direction: 'ltr', ...reveal(headerVisible, 0) }}>
            <span style={{ width: 24, height: 1.5, background: 'var(--gold)' }} />
            <span>University Explorer</span>
          </div>
          <h2 style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? '28px' : 'clamp(32px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.25, color: 'var(--navy)', margin: '0 0 16px', letterSpacing: '-0.5px', ...reveal(headerVisible, 80) }}>استكشف {universities.length} جامعة بنفسك</h2>
          <p style={{ fontFamily: 'var(--f-warm)', fontSize: '17px', color: 'var(--navy-soft)', lineHeight: 1.7, margin: 0, maxWidth: '600px', ...reveal(headerVisible, 160) }}>ابحث وقارن بين الجامعات حسب الدولة والمجال والفئة. كل البيانات محدّثة ومراجعة.</p>
        </div>

        {/* Search bar */}
        <div style={{ background: 'var(--sand-card)', borderRadius: '20px', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(26,41,66,0.06)', border: '1px solid var(--warm-rule)', maxWidth: '720px', transition: 'box-shadow .3s ease, border-color .3s ease', ...reveal(headerVisible, 220) }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن جامعة، مدينة، أو تخصص..."
            onFocus={e => { e.currentTarget.parentElement.style.borderColor = 'var(--gold-soft)'; e.currentTarget.parentElement.style.boxShadow = '0 0 0 4px rgba(var(--gold-shadow), 0.18), 0 4px 20px rgba(26,41,66,0.08)'; }}
            onBlur={e => { e.currentTarget.parentElement.style.borderColor = 'var(--warm-rule)'; e.currentTarget.parentElement.style.boxShadow = '0 4px 20px rgba(26,41,66,0.06)'; }}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '14px 20px', fontFamily: 'var(--f-warm)', fontSize: isMobile ? '14px' : '16px', color: 'var(--navy)', direction: 'rtl' }} />
          <div style={{ background: 'var(--gold)', color: 'var(--navy)', padding: '12px 18px', borderRadius: '14px', fontFamily: 'var(--f-warm)', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        {/* Country pill tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', overflowX: isMobile ? 'auto' : 'visible' }}>
          {UNI_COUNTRY_TABS.map(tab => {
            const active = countryFilter === tab.value;
            return (
              <button key={tab.value} onClick={() => { setCountryFilter(tab.value); setShowCount(12); }}
                style={{ background: active ? 'var(--navy)' : 'var(--sand-card)', border: '1px solid', borderColor: active ? 'var(--navy)' : 'var(--warm-rule)', padding: '10px 18px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontSize: '14px', fontWeight: 500, color: active ? 'var(--sand)' : 'var(--navy-soft)', cursor: 'pointer', transition: 'all .2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--navy)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--warm-rule)'; e.currentTarget.style.color = 'var(--navy-soft)'; } }}>
                {tab.ar}
              </button>
            );
          })}
        </div>

        {/* Field filter pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', overflowX: isMobile ? 'auto' : 'visible' }}>
          {UNI_FIELD_TABS.map(f => {
            const active = fieldFilter === f.value;
            return (
              <button key={f.value} onClick={() => { setFieldFilter(f.value); setShowCount(12); }}
                style={{ background: active ? 'var(--gold-soft)' : 'transparent', border: '1px solid', borderColor: active ? 'var(--gold)' : 'var(--warm-rule)', padding: '8px 14px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontSize: '13px', fontWeight: 500, color: active ? 'var(--navy)' : 'var(--navy-soft)', cursor: 'pointer', transition: 'all .2s ease', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {f.label}
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: 'var(--f-warm)', fontSize: '13px', color: 'var(--navy-soft)', marginBottom: '20px' }}>
          {filtered.length} من أصل {universities.length} جامعة
        </div>

        {/* University card grid */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {showing.map((u, i) => {
            const isExpanded = expandedUni === i;
            const isHovered = hoveredCard === i;
            const cardDelay = Math.min(i, 9) * 60;
            const mfLabels = [];
            if (u.muslimFriendly) {
              if (MF_LABELS.halal[u.muslimFriendly.halal]) mfLabels.push(MF_LABELS.halal[u.muslimFriendly.halal]);
              if (MF_LABELS.mosque[u.muslimFriendly.mosque]) mfLabels.push(MF_LABELS.mosque[u.muslimFriendly.mosque]);
              if (MF_LABELS.saudiCommunity[u.muslimFriendly.saudiCommunity]) mfLabels.push(MF_LABELS.saudiCommunity[u.muslimFriendly.saudiCommunity]);
              if (MF_LABELS.prayerRoom[u.muslimFriendly.prayerRoom]) mfLabels.push(MF_LABELS.prayerRoom[u.muslimFriendly.prayerRoom]);
            }
            return (
              <div key={i} style={{ background: 'var(--sand-card)', border: '1px solid var(--warm-rule)', borderRadius: '20px', padding: '20px', transition: 'transform .3s ease, border-color .3s ease, box-shadow .3s ease, opacity .7s cubic-bezier(.2,.7,.3,1) ' + cardDelay + 'ms', display: 'flex', flexDirection: 'column', gap: '14px', opacity: gridVisible ? 1 : 0, transform: gridVisible ? 'translateY(0)' : 'translateY(20px)' }}
                onMouseEnter={e => { setHoveredCard(i); e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(26,41,66,0.08)'; }}
                onMouseLeave={e => { setHoveredCard(null); e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--warm-rule)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '14px', background: 'linear-gradient(135deg, var(--gold-soft) 0%, var(--sand-2) 100%)', overflow: 'hidden' }}>
                  {COUNTRY_IMAGES[u.country] && (
                    <img src={COUNTRY_IMAGES[u.country]} alt={`حرم جامعة في ${u.country}`} loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: isHovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform .6s cubic-bezier(.2,.7,.3,1)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  )}
                  <div style={{ position: 'absolute', bottom: 8, right: 10, padding: '3px 10px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(4px)', transform: isHovered ? 'translateY(-4px)' : 'translateY(0)', transition: 'transform .3s ease, background .3s ease, color .3s ease', background: isHovered ? 'rgba(201,169,97,0.95)' : 'rgba(26,41,66,0.75)', color: isHovered ? 'var(--navy)' : 'var(--sand)' }}>
                    {u.country}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--f-warm)', fontSize: '16px', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3 }}>{u.nameAr}</div>
                    <div style={{ fontFamily: 'var(--f-warm-num)', fontSize: '12px', color: 'var(--navy-soft)', direction: 'ltr', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nameEn} · {u.city}</div>
                  </div>
                  <div style={{ background: 'var(--gold-soft)', color: 'var(--navy)', padding: '4px 10px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {TIER_LABELS[u.tier] || `الفئة ${u.tier}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontFamily: 'var(--f-warm)', fontSize: '12px', color: 'var(--navy-soft)' }}>
                  {WEATHER_LABELS[u.weather] && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: getWeatherColor(u.weather) }} />
                      {WEATHER_LABELS[u.weather]}
                    </span>
                  )}
                  {SAFETY_LABELS[u.safety] && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: getSafetyColor(u.safety) }} />
                      {SAFETY_LABELS[u.safety]}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {u.fields.filter(f => f !== 'all').slice(0, 4).map(f => (
                    <span key={f} style={{ fontFamily: 'var(--f-warm)', fontSize: '11px', padding: '3px 9px', background: 'var(--sand-2)', color: 'var(--navy-soft)', borderRadius: '999px', fontWeight: 500 }}>
                      {FIELD_LABELS[f] || f}
                    </span>
                  ))}
                </div>
                {mfLabels.length > 0 && (
                  <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--f-warm)', fontSize: '12px', color: 'var(--gold)', fontWeight: 600, textAlign: 'right', marginTop: 'auto' }}>
                    {isExpanded ? 'إخفاء البيئة الإسلامية ▲' : 'بيئة مناسبة للمسلمين ▼'}
                  </button>
                )}
                {isExpanded && mfLabels.length > 0 && (
                  <div style={{ padding: '12px 14px', background: 'var(--sand-2)', borderRadius: '12px', borderInlineStart: '3px solid var(--gold)' }}>
                    {mfLabels.map((label, mi) => (
                      <div key={mi} style={{ fontFamily: 'var(--f-warm)', fontSize: '12px', color: 'var(--navy-soft)', lineHeight: 1.8 }}>· {label}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--navy-soft)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontFamily: 'var(--f-warm)', fontSize: 16, fontWeight: 600, color: 'var(--navy)', margin: '0 0 6px' }}>لا توجد جامعات تطابق معايير البحث</p>
            <p style={{ fontFamily: 'var(--f-warm)', fontSize: 13, margin: 0 }}>جرّب تعديل المرشحات</p>
          </div>
        )}

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button onClick={() => setShowCount(prev => prev + 12)}
              style={{ background: 'transparent', color: 'var(--navy)', border: '1px solid var(--navy)', padding: '14px 28px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all .2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy)'; e.currentTarget.style.color = 'var(--sand)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--navy)'; }}>
              عرض {Math.min(12, filtered.length - showCount)} جامعة أخرى ({filtered.length - showCount} متبقية)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: CLOSING CTA + FOOTER
// ═══════════════════════════════════════════════════════════════
function ClosingCTA({ onStart, isMobile }) {
  const [sectionRef, visible] = useReveal();
  const [btnHover, setBtnHover] = useState(false);
  return (
    <section ref={sectionRef} style={{ background: 'var(--navy)', color: 'var(--sand)', padding: isMobile ? '60px 16px' : '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Soft gold glow behind the CTA */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', width: 600, height: 600, transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(var(--gold-shadow), 0.18) 0%, transparent 60%)', pointerEvents: 'none', opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }} />
      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: 'var(--f-warm)', fontSize: isMobile ? '32px' : 'clamp(32px, 4vw, 48px)', fontWeight: 700, lineHeight: 1.25, margin: '0 0 16px', letterSpacing: '-0.5px', color: 'var(--sand)', ...reveal(visible, 0) }}>جامعتك في الخارج تنتظرك</h2>
        <p style={{ fontFamily: 'var(--f-warm)', fontSize: '17px', color: 'rgba(245,239,227,0.7)', margin: '0 0 36px', lineHeight: 1.7, ...reveal(visible, 120) }}>
          ابدأ رحلتك الآن، شارك ملفك، واحصل على توصيات شخصية لأفضل الجامعات والمنح الحكومية المناسبة لك.
        </p>
        <div style={reveal(visible, 240)}>
          <button onClick={onStart}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none', padding: '18px 36px', borderRadius: '999px', fontFamily: 'var(--f-warm)', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', transform: btnHover ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform .25s ease', animation: btnHover ? 'none' : 'gold-pulse 2.4s ease-out infinite', boxShadow: btnHover ? '0 10px 32px rgba(var(--gold-shadow), 0.6)' : '0 4px 16px rgba(var(--gold-shadow), 0.4)' }}>
            <span>ابدأ الاستشارة الآن</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer({ isMobile }) {
  return (
    <footer style={{ background: 'var(--sand)', padding: isMobile ? '40px 16px' : '48px 40px', borderTop: '1px solid var(--warm-rule)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr', gap: isMobile ? '32px' : '48px', fontFamily: 'var(--f-warm)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '12px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', fontWeight: 800, fontSize: 18, fontFamily: 'var(--f-warm)' }}>م</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>مستشار الابتعاث</span>
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.9, color: 'var(--navy-soft)', maxWidth: '320px', margin: 0 }}>
            مشروع مستقل يساعد الطلاب السعوديين على الوصول لأفضل برامج الابتعاث والجامعات العالمية.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '13px', marginBottom: '4px' }}>الموقع</div>
          <a href="#how" style={{ fontSize: '13px', color: 'var(--navy-soft)' }}>كيف يعمل</a>
          <a href="#explorer" style={{ fontSize: '13px', color: 'var(--navy-soft)' }}>الجامعات</a>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--navy-soft)', lineHeight: 2 }}>
          © 2026 مستشار الابتعاث<br />
          صُنع في الرياض · مشروع مستقل<br />
          صنعه{' '}<a href="https://www.linkedin.com/in/sanad-al-lheani/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>Sanad Allheani</a>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// CV UPLOAD SCREEN
// ═══════════════════════════════════════════════════════════════
function CVUploadScreen({ cvFile, setCvFile, cvBase64, setCvBase64, cvError, setCvError, onContinue, onBack, isMobile }) {
  const [dragOver, setDragOver] = useState(false);
  const [reading, setReading] = useState(false);
  const inputRef = useRef(null);

  const MAX_BYTES = 2 * 1024 * 1024; // 2MB raw PDF

  const handleFile = (file) => {
    setCvError('');
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setCvError('الملف يجب أن يكون بصيغة PDF فقط.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setCvError('حجم الملف يتجاوز الحد المسموح (٢ ميجا).');
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' ? result.replace(/^data:application\/pdf;base64,/, '') : '';
      if (!base64) {
        setCvError('تعذر قراءة الملف. حاول مرة أخرى.');
        setReading(false);
        return;
      }
      setCvFile(file);
      setCvBase64(base64);
      setReading(false);
    };
    reader.onerror = () => {
      setCvError('تعذر قراءة الملف. حاول مرة أخرى.');
      setReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setCvFile(null);
    setCvBase64('');
    setCvError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', position: 'relative' }}>
      <TopoLines opacity={0.04} />
      <Head><title>مستشار الابتعاث — ملف الطالب</title></Head>

      {/* Masthead */}
      <header style={{ borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--f-display)', fontWeight: 500, fontSize: '26px', direction: 'ltr', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
            <Compass size={28} />
            <span>Mustashar</span>
            <span style={{ fontFamily: 'var(--f-arabic-disp)', fontStyle: 'normal', fontSize: '20px', color: 'var(--ink-soft)', marginInlineStart: '4px' }}>· مستشار</span>
          </button>
          <div style={{ ...edMono, color: 'var(--ink-soft)' }}>اختياري · مقدمة</div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '32px 16px 48px' : '64px 32px 80px', position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '24px', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '14px' : '18px' }}>
            <span style={{ fontFamily: 'var(--f-num)', fontSize: isMobile ? '44px' : '56px', lineHeight: 0.9, color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>№00</span>
            <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? '26px' : '32px', lineHeight: 1 }}>ملف الطالب</span>
          </div>
          <span style={{ ...edMono, color: 'var(--ink-soft)', display: isMobile ? 'none' : 'inline' }}>— الملف الشخصي</span>
        </div>

        {/* Lede */}
        <p style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? '18px' : '22px', lineHeight: 1.6, color: 'var(--ink-soft)', margin: '0 0 8px' }}>
          أرفق سيرتك للحصول على تحليل أعمق وأكثر شخصية.
        </p>
        <p style={{ fontFamily: 'var(--f-arabic)', fontSize: isMobile ? '15px' : '16px', lineHeight: 1.85, color: 'var(--ink)', margin: '0 0 36px' }}>
          ارفق سيرتك الذاتية بصيغة PDF ليصبح التحليل أعمق وأقرب إلى ملفك. الخطوة اختيارية، ولن يؤثر تخطيها على جودة التوصيات.
          <br />
          <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>سواء أرفقت السيرة أو لم ترفقها، ستجيب على ١٢ سؤالاً بعد ذلك.</span>
        </p>

        {/* File specs strip — surfaces upload constraints visibly */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--hairline)', marginBottom: '20px' }}>
          {[
            { label: 'الصيغة', value: 'PDF فقط' },
            { label: 'الحد الأقصى', value: '٢ ميجابايت' },
            { label: 'النوع المطلوب', value: 'نص قابل للقراءة (لا صور ممسوحة)' },
          ].map((spec, i) => (
            <div key={spec.label} style={{
              padding: isMobile ? '12px 14px' : '14px 18px',
              borderInlineStart: !isMobile && i > 0 ? '1px solid var(--hairline)' : 'none',
              borderTop: isMobile && i > 0 ? '1px solid var(--hairline)' : 'none',
            }}>
              <div style={{ ...edMono, color: 'var(--ink-faint)', marginBottom: '4px' }}>{spec.label}</div>
              <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '14px', color: 'var(--ink)', fontWeight: 500 }}>{spec.value}</div>
            </div>
          ))}
        </div>

        {/* Drop zone or selected file */}
        {!cvFile ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
              display: 'block', cursor: 'pointer',
              border: `1px dashed ${dragOver ? 'var(--accent)' : 'var(--hairline)'}`,
              background: dragOver ? 'rgba(193, 154, 92, 0.04)' : 'transparent',
              padding: isMobile ? '36px 20px' : '56px 32px',
              textAlign: 'center',
              transition: 'all .2s ease'
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => handleFile(e.target.files && e.target.files[0])}
              style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
            />
            <svg width="42" height="48" viewBox="0 0 42 48" fill="none" style={{ margin: '0 auto 14px', display: 'block' }} aria-hidden="true">
              <path d="M4 2 H26 L38 14 V46 H4 Z" stroke="var(--ink)" strokeWidth="1.2" fill="none" />
              <path d="M26 2 V14 H38" stroke="var(--ink)" strokeWidth="1.2" fill="none" />
              <line x1="11" y1="24" x2="31" y2="24" stroke="var(--ink-soft)" strokeWidth="0.8" />
              <line x1="11" y1="30" x2="31" y2="30" stroke="var(--ink-soft)" strokeWidth="0.8" />
              <line x1="11" y1="36" x2="24" y2="36" stroke="var(--ink-soft)" strokeWidth="0.8" />
            </svg>
            <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '16px', color: 'var(--ink)', marginBottom: '6px' }}>
              {reading ? 'جارٍ قراءة الملف…' : 'اسحب ملف PDF هنا أو اضغط للاختيار'}
            </div>
            <div style={{ ...edMono, color: 'var(--ink-faint)' }}>PDF فقط · الحد الأقصى ٢ ميجابايت</div>
          </label>
        ) : (
          <div style={{ border: '1px solid var(--rule)', padding: isMobile ? '18px' : '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <svg width="28" height="32" viewBox="0 0 42 48" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M4 2 H26 L38 14 V46 H4 Z" stroke="var(--ink)" strokeWidth="1.2" fill="none" />
                <path d="M26 2 V14 H38" stroke="var(--ink)" strokeWidth="1.2" fill="none" />
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '15px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cvFile.name}</div>
                <div style={{ ...edMono, ...edNum, color: 'var(--ink-faint)', marginTop: '4px', direction: 'ltr' }}>{formatSize(cvFile.size)} / 2.0 MB · مُرفَق</div>
              </div>
            </div>
            <button onClick={handleRemove} aria-label="إزالة الملف" style={{ background: 'none', border: '1px solid var(--hairline)', color: 'var(--ink-soft)', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        )}

        {/* Error */}
        {cvError && (
          <div style={{ marginTop: '14px', padding: '10px 14px', border: '1px solid var(--hairline)', background: 'rgba(166, 60, 47, 0.04)', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: '#7a2a22' }}>
            {cvError}
          </div>
        )}

        {/* Privacy note */}
        <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '12px', color: 'var(--ink-faint)', lineHeight: 1.8, margin: '20px 0 0' }}>
          نقرأ سيرتك لاستخراج المعلومات الأكاديمية والمهنية فقط، ولا نحتفظ بأي معلومات اتصال شخصية. الملف لا يُسجَّل ولا يُشارَك مع أي طرف ثالث.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '14px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--hairline)' }}>
          <button onClick={onContinue} style={{ background: 'none', border: 'none', cursor: 'pointer', ...edMono, color: 'var(--ink-soft)', padding: '12px 0', textAlign: isMobile ? 'center' : 'right' }}>
            تخطي ←
          </button>
          <HardButton variant="primary" onClick={onContinue} disabled={reading}>
            <span>{cvFile ? 'إرفاق ومتابعة' : 'متابعة بدون سيرة'}</span>
            <span>→</span>
          </HardButton>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE SCREEN
// ═══════════════════════════════════════════════════════════════
function QuestionnaireScreen({ answers, setAnswers, step, setStep, questions, totalSteps, onBack, onNext, isStepValid, confirming, isMobile }) {
  const currentQ = questions[step];
  if (!currentQ) return null;
  const progress = ((step + 1) / totalSteps) * 100;

  // Determine current chapter
  const currentChapter = CHAPTERS.find(ch => ch.keys.includes(currentQ.key)) || CHAPTERS[0];

  const btnStyle = (active) => ({
    textAlign: 'right', padding: '16px 20px',
    background: active ? 'var(--ink)' : 'transparent',
    color: active ? 'var(--paper)' : 'var(--ink)',
    border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
    fontFamily: 'var(--f-arabic)', fontSize: '15px', fontWeight: 400,
    cursor: 'pointer', transition: 'all .25s',
    display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between',
  });

  const toggleCountry = (val) => setAnswers(prev => ({ ...prev, countries: prev.countries.includes(val) ? prev.countries.filter(c => c !== val) : [...prev.countries, val] }));
  const toggleMulti = (key, val) => setAnswers(prev => ({ ...prev, [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val] }));

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', position: 'relative' }}>
      <TopoLines opacity={0.04} />
      <Head><title>مستشار الابتعاث — الاستبيان</title></Head>

      {/* Completion confirmation overlay */}
      {confirming && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', animation: 'ed-fade-in .3s ease' }}>
          <div style={{ ...edNum, fontStyle: 'italic', fontWeight: 400, fontSize: '96px', lineHeight: 1, color: 'var(--accent)', direction: 'ltr' }}>
            {String(totalSteps).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </div>
          <div style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '36px', color: 'var(--ink)' }}>اكتمل ✓</div>
          <div style={{ ...edMono, color: 'var(--ink-faint)' }}>اكتمل الاستبيان</div>
        </div>
      )}

      {/* Masthead */}
      <header style={{ borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--f-display)', fontWeight: 500, fontSize: '26px', direction: 'ltr', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
            <Compass size={28} />
            <span>Mustashar</span>
            <span style={{ fontFamily: 'var(--f-arabic-disp)', fontStyle: 'normal', fontSize: '20px', color: 'var(--ink-soft)', marginInlineStart: '4px' }}>· مستشار</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', ...edMono, color: 'var(--ink-soft)' }}>
            <span>الفصل {currentChapter.n}</span>
            <span style={{ width: '1px', height: '14px', background: 'var(--hairline)' }} />
            <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '16px', lineHeight: 1, letterSpacing: 0 }}>{currentChapter.title}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '28px 16px' : '48px 32px', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '4px' }}>◆ الفصل {currentChapter.n} — {currentChapter.title}</div>
            <div style={{ ...edNum, fontStyle: 'italic', fontWeight: 400, fontSize: '48px', lineHeight: 1, direction: 'ltr' }}>
              {String(step + 1).padStart(2, '0')}<span style={{ color: 'var(--ink-faint)' }}> / {String(totalSteps).padStart(2, '0')}</span>
            </div>
          </div>
          <div style={{ width: '200px' }}>
            <div style={{ height: '2px', background: 'var(--hairline)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${progress}%`, background: 'var(--accent)', transition: 'width .4s ease' }} />
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--f-arabic-disp)', fontWeight: 400, fontSize: '28px', lineHeight: 1.3, margin: '0 0 6px' }}>{currentQ.label}</h2>
          <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--ink-soft)', margin: '0 0 32px' }}>{currentQ.hint}</p>

          {/* Select */}
          {currentQ.type === 'select' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px' }}>
              {currentQ.options.map(opt => {
                const active = answers[currentQ.key] === opt.value;
                return (
                  <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, [currentQ.key]: opt.value }))} style={btnStyle(active)}>
                    <span>{opt.label}</span>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: `1px solid ${active ? 'var(--paper)' : 'var(--hairline)'}`, background: active ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Countries */}
          {currentQ.type === 'countries' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--hairline)' }}>
              {COUNTRIES.map((c, ci) => {
                const cols = isMobile ? 2 : 4;
                const active = answers.countries.includes(c.value);
                return (
                  <button key={c.value} onClick={() => toggleCountry(c.value)}
                    style={{ background: active ? 'var(--paper-2)' : 'transparent', border: 'none', borderInlineEnd: (ci + 1) % cols !== 0 ? '1px solid var(--hairline)' : 'none', borderBottom: ci < COUNTRIES.length - cols ? '1px solid var(--hairline)' : 'none', padding: isMobile ? '16px 12px' : '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', position: 'relative', transition: 'all .25s', color: 'var(--ink)' }}>
                    <span style={{ ...edMono, color: 'var(--ink-faint)', direction: 'ltr' }}>{c.code}</span>
                    <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '24px', lineHeight: 1 }}>{c.ar}</span>
                    {active && (
                      <span style={{ position: 'absolute', top: '10px', insetInlineStart: '10px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent)', color: '#1a1206', fontFamily: 'var(--f-display)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Multiselect */}
          {currentQ.type === 'multiselect' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options.map(opt => {
                const active = answers[currentQ.key].includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => toggleMulti(currentQ.key, opt.value)} style={btnStyle(active)}>
                    <span>{opt.label}</span>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${active ? 'var(--paper)' : 'var(--hairline)'}`, background: active ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#1a1206' : 'transparent', fontSize: '12px', fontWeight: 700 }}>{active ? '✓' : ''}</span>
                  </button>
                );
              })}
              {currentQ.extraKey && (
                <input type="text" value={answers[currentQ.extraKey]} onChange={e => setAnswers(prev => ({ ...prev, [currentQ.extraKey]: e.target.value }))} placeholder={currentQ.extraPlaceholder}
                  style={{ width: '100%', padding: '16px', background: 'transparent', border: '1px solid var(--hairline)', fontFamily: 'var(--f-arabic)', fontSize: '15px', color: 'var(--ink)', direction: 'rtl', marginTop: '4px' }} />
              )}
            </div>
          )}

          {/* Text */}
          {currentQ.type === 'text' && (
            <div style={{ position: 'relative' }}>
              <input type="text" value={answers[currentQ.key]} onChange={e => setAnswers(prev => ({ ...prev, [currentQ.key]: e.target.value }))} placeholder={currentQ.placeholder}
                style={{ width: '100%', padding: '16px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', fontFamily: 'var(--f-arabic-disp)', fontSize: '26px', fontWeight: 400, color: 'var(--ink)', direction: 'rtl', textAlign: 'right' }} />
            </div>
          )}

          {/* GPA */}
          {currentQ.type === 'gpa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--hairline)' }}>
                {['4', '5', '100'].map((s, si, arr) => {
                  const active = answers.gpaScale === s;
                  return (
                    <button key={s} onClick={() => setAnswers(prev => ({ ...prev, gpaScale: s }))}
                      style={{ flex: 1, padding: '14px', background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--paper)' : 'var(--ink)', border: 'none', borderInlineEnd: si < arr.length - 1 ? '1px solid var(--hairline)' : 'none', fontFamily: 'var(--f-display)', fontSize: '18px', fontStyle: 'italic', cursor: 'pointer', transition: 'all .25s' }}>
                      من {s}
                    </button>
                  );
                })}
              </div>
              <input type="number" step="0.01" value={answers.gpa} onChange={e => setAnswers(prev => ({ ...prev, gpa: e.target.value }))} placeholder={`أدخل معدلك من ${answers.gpaScale}`}
                style={{ width: '100%', padding: '18px 24px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--hairline)', fontFamily: 'var(--f-display)', fontSize: '26px', fontStyle: 'italic', fontWeight: 500, outline: 'none' }} />
            </div>
          )}

          {/* English */}
          {currentQ.type === 'english' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { value: 'ielts', label: 'آيلتس (IELTS)' }, { value: 'toefl', label: 'توفل (TOEFL)' },
                  { value: 'step', label: 'اختبار ستيب (STEP)' }, { value: 'duolingo', label: 'دولينجو (Duolingo)' },
                  { value: 'intermediate', label: 'متوسط، لا توجد شهادة' }, { value: 'beginner', label: 'مبتدئ' },
                ].map(opt => {
                  const active = answers.english === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, english: opt.value }))} style={btnStyle(active)}>
                      <span>{opt.label}</span>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: active ? 'var(--accent)' : 'transparent', border: `1px solid ${active ? 'var(--paper)' : 'var(--hairline)'}` }} />
                    </button>
                  );
                })}
              </div>
              {['ielts', 'toefl', 'duolingo', 'step'].includes(answers.english) && (
                <input type="text" value={answers.englishScore} onChange={e => setAnswers(prev => ({ ...prev, englishScore: e.target.value }))} placeholder="أدخل درجتك"
                  style={{ width: '100%', padding: '16px 24px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--hairline)', fontFamily: 'var(--f-display)', fontSize: '22px', fontStyle: 'italic', outline: 'none' }} />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '56px', paddingTop: '28px', borderTop: '1px solid var(--rule)' }}>
          <button onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontSize: '15px', fontFamily: 'var(--f-display)', fontStyle: 'italic', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>
            ← السابق
          </button>
          <HardButton variant="primary" size="md" disabled={!isStepValid()} onClick={onNext}>
            <span>{step === totalSteps - 1 ? 'تحليل ملفي' : 'التالي'}</span>
            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '20px' }}>→</span>
          </HardButton>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════════════════════════
function ResultsScreen({ loading, error, results, answers, onRetry, onReset, onPrint, isMobile }) {
  const [expandedUni, setExpandedUni] = useState(null);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).toUpperCase();

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', position: 'relative' }}>
      <TopoLines opacity={0.04} />
      <Head><title>مستشار الابتعاث — التقرير</title></Head>

      {/* Masthead */}
      <header style={{ borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--f-display)', fontWeight: 500, fontSize: '26px', direction: 'ltr', fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
            <Compass size={28} /><span>Mustashar</span>
          </button>
          <div style={{ ...edMono, color: 'var(--ink-soft)' }}>التقرير</div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Loading */}
        {loading && (
          <div style={{ maxWidth: 980, margin: '0 auto', padding: isMobile ? '80px 16px' : '120px 32px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr', gap: isMobile ? '32px' : '48px', alignItems: 'center', textAlign: isMobile ? 'center' : undefined }}>
            <div style={{ position: 'relative', width: isMobile ? '64px' : '96px', height: isMobile ? '64px' : '96px', margin: isMobile ? '0 auto' : undefined }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid var(--hairline)', borderTopColor: 'var(--accent)', animation: 'ed-spin 1.6s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '16px', borderRadius: '50%', border: '1px solid var(--hairline)', borderRightColor: 'var(--accent)', animation: 'ed-spin 2.4s linear infinite reverse' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '56px', lineHeight: 1, marginBottom: '14px' }}>نُؤلِّف تقريرك.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ ...edMono, color: 'var(--ink-faint)', fontSize: '11px' }}>◆ جارٍ تأليف التقرير</span>
                <span style={{ fontFamily: 'var(--f-arabic)', fontSize: '18px', color: 'var(--ink-soft)' }}>
                  تأليف التقرير<span style={{ animation: 'ed-blink 1s steps(1) infinite' }}>_</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '16px', color: 'var(--ink-soft)', marginBottom: '28px' }}>{error}</p>
            <HardButton variant="primary" onClick={onRetry}>
              <span>حاول مرة أخرى</span><span>↺</span>
            </HardButton>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '20px 16px 60px' : '32px 40px 80px' }}>
            {/* Newspaper Masthead */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...edMono, color: 'var(--ink-soft)', padding: '6px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
                <span>المجلد الأول — التقرير ٠٠٠١</span>
                <span style={{ direction: 'ltr' }}>{dateStr}</span>
                <span>إصدار الرياض</span>
              </div>
              <h1 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: 'clamp(72px, 10vw, 144px)', lineHeight: 0.85, margin: '20px 0 16px', fontWeight: 400, textAlign: 'center' }}>مستشار الابتعاث</h1>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--ink-soft)' }}>
                <span style={{ fontFamily: 'var(--f-arabic-disp)', fontStyle: 'normal' }}>التقرير الشخصي</span>
                <span style={{ color: 'var(--accent)' }}>◆ مُجمَّع بالذكاء الاصطناعي · مجاناً ◆</span>
                <span>صفحة · ٠٠٠١</span>
              </div>
            </div>

            {/* CV Status */}
            {results.cvStatus && results.cvStatus !== 'none' && (() => {
              const map = {
                used:   { color: '#1e8449', text: 'تم دمج سيرتك الذاتية في التحليل والتوصيات.' },
                empty:  { color: '#b07820', text: 'تم رفع السيرة لكن لم نستخرج منها معلومات كافية. التحليل يعتمد على إجاباتك في الاستبيان فقط. (إن كانت سيرتك ممسوحة كصورة، حاول إعادة إنشائها كملف نصي).' },
                failed: { color: '#c0392b', text: 'تعذر قراءة ملف السيرة الذاتية. التحليل تم بناءً على إجابات الاستبيان فقط. يمكنك إعادة المحاولة بملف PDF نصي.' }
              };
              const info = map[results.cvStatus];
              if (!info) return null;
              return (
                <div style={{ border: '1px solid var(--hairline)', background: 'var(--paper-2)', padding: '14px 18px', marginBottom: '20px', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: 'var(--ink-soft)', borderInlineStart: `3px solid ${info.color}` }}>
                  ◆ {info.text}
                </div>
              );
            })()}

            {/* Language Warning */}
            {results.languageWarning && (
              <div style={{ border: '1px solid var(--hairline)', background: 'var(--paper-2)', padding: '14px 18px', marginBottom: '32px', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: 'var(--ink-soft)', borderInlineStart: '3px solid var(--accent)' }}>
                ◆ {results.languageWarning}
              </div>
            )}

            {/* Lead — Dossier + Analysis (RTL: dossier right, analysis left — user reads dossier first then analysis) */}
            <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.7fr', gap: isMobile ? '32px' : '48px', paddingBottom: '40px', borderBottom: '1px solid var(--rule)' }}>
              <aside style={{ alignSelf: 'start', padding: '24px 28px', background: 'var(--paper-2)', border: '1px solid var(--hairline)' }}>
                <div style={{ ...edMono, color: 'var(--ink-faint)', marginBottom: '16px' }}>الملف الشخصي</div>
                <dl style={{ margin: 0, fontFamily: 'var(--f-arabic)', fontSize: '13.5px' }}>
                  {[
                    ['التخصص', answers?.field],
                    ['المرحلة', answers?.degreeLevel],
                    ['GPA', answers?.gpa ? `${answers.gpa} / ${answers.gpaScale}` : '—'],
                    ['الإنجليزية', answers?.englishScore ? `${answers.english?.toUpperCase()} ${answers.englishScore}` : answers?.english],
                    ['الوجهات', answers?.countries?.map(c => COUNTRIES.find(x => x.value === c)?.ar).filter(Boolean).join(' · ')],
                    ['التمويل', BUDGET_LABELS[answers?.budget] || answers?.budget],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px dotted var(--hairline)' }}>
                      <dt style={{ color: 'var(--ink-soft)', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px' }}>{k}</dt>
                      <dd style={{ margin: 0, textAlign: 'left', fontWeight: 500 }}>{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
              <div>
                <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '14px' }}>◆ صدارة العدد</div>
                <h2 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1, margin: 0, fontWeight: 400 }}>
                  {answers?.field
                    ? <>طريقك إلى <span style={{ color: 'var(--accent)', fontFamily: 'var(--f-display)', fontStyle: 'italic' }}>{answers.field}</span> — مرسوم.</>
                    : <>طريقك إلى الخارج — مرسوم.</>}
                </h2>
                {results.analysis && (
                  <div style={{ marginTop: '28px', columnCount: isMobile ? 1 : 2, columnGap: '36px', columnRule: '1px solid var(--hairline)', fontFamily: 'var(--f-arabic)', fontSize: '15.5px', lineHeight: 2 }}>
                    <span style={{ ...edNum, fontFamily: 'var(--f-display)', fontSize: '88px', lineHeight: 0.78, float: 'right', marginInlineStart: '10px', marginBottom: '-8px', color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400 }}>{results.analysis.charAt(0)}</span>
                    {results.analysis.slice(1)}
                  </div>
                )}
              </div>
            </section>

            {/* Programs */}
            {results.programs?.length > 0 && (
              <section style={{ marginTop: '56px' }}>
                <SectionEyebrow n="I" en="المنح الحكومية" ar="البرامج الحكومية" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 0 }}>
                  {results.programs.map((p, i) => {
                    const left = isMobile || i % 2 === 0;
                    const top = isMobile ? i === 0 : i < 2;
                    return (
                      <article key={i} style={{ padding: '28px', paddingInlineStart: left ? 0 : '28px', paddingInlineEnd: left ? '28px' : 0, borderTop: top ? 'none' : '1px solid var(--hairline)', borderInlineStart: left ? 'none' : '1px solid var(--hairline)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                          <span style={{ ...edNum, fontSize: '40px', lineHeight: 0.9, color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400, direction: 'ltr' }}>№{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <h3 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '26px', lineHeight: 1.2, margin: '0 0 14px', fontWeight: 400 }}>{p.name}</h3>
                        <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '14px', lineHeight: 2, margin: '0 0 14px', color: 'var(--ink-soft)' }}>{p.description}</p>
                        {p.fit && (
                          <div style={{ background: 'var(--paper-2)', padding: '12px 14px', marginBottom: '14px', borderInlineStart: '2px solid var(--accent)' }}>
                            <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '4px' }}>لماذا أنت</div>
                            <p style={{ margin: 0, fontFamily: 'var(--f-arabic)', fontSize: '13.5px', lineHeight: 1.9 }}>{p.fit}</p>
                          </div>
                        )}
                        {p.eligibility && (
                          <div style={{ borderTop: '1px dotted var(--hairline)', paddingTop: '12px', marginBottom: '12px' }}>
                            <div style={{ ...edMono, color: 'var(--ink-faint)', marginBottom: '4px' }}>الأهلية</div>
                            <p style={{ margin: 0, fontFamily: 'var(--f-arabic)', fontSize: '13.5px', lineHeight: 1.9, color: 'var(--ink-soft)' }}>{p.eligibility}</p>
                          </div>
                        )}
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '16px', borderBottom: '1px solid var(--ink)', paddingBottom: '2px' }}>
                            <span>{p.linkLabel || 'زيارة الموقع'}</span><span>→</span>
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Universities */}
              <section style={{ marginTop: '64px' }}>
                <SectionEyebrow n="II" en="الجامعات" ar="الجامعات" />
                {results.universitiesRelaxed && results.universities?.length > 0 && (
                  <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'rgba(193,154,107,0.08)', border: '1px solid var(--accent)', fontFamily: 'var(--f-arabic)', fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-soft)' }}>
                    وسّعنا نطاق البحث ليشمل جامعات إضافية قد تناسبك، لأن معاييرك الأصلية لم تطابق جامعات كافية.
                  </div>
                )}
                {(!results.universities || results.universities.length === 0) && (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: 'var(--f-arabic)', fontSize: '15px', lineHeight: 1.8, color: 'var(--ink-soft)', borderTop: '1px solid var(--rule)' }}>
                    لم نجد جامعات تطابق معاييرك بدقة. جرّب توسيع اختيار الدول أو مراجعة المعدل.
                  </div>
                )}
                {results.universities?.length > 0 && (
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid var(--rule)' }}>
                  {results.universities.map((u, i) => {
                    const isExpanded = expandedUni === i;
                    return (
                      <li key={i} style={{ borderBottom: '1px solid var(--hairline)', padding: isMobile ? '16px 0' : '24px 0', display: 'grid', gridTemplateColumns: isMobile ? '40px 1fr' : '60px 2fr 1.4fr auto', gap: isMobile ? '12px' : '28px', alignItems: 'start' }}>
                        <div style={{ ...edNum, fontStyle: 'italic', fontSize: isMobile ? '24px' : '36px', lineHeight: 1, color: 'var(--accent)', fontWeight: 400, direction: 'ltr' }}>№{String(i + 1).padStart(2, '0')}</div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? '20px' : '24px', lineHeight: 1.1, margin: '0 0 4px', fontWeight: 400 }}>{u.nameAr}</h3>
                          <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: isMobile ? '14px' : '17px', color: 'var(--ink-soft)', direction: 'ltr', textAlign: 'right', marginBottom: '8px' }}>
                            {u.nameEn}{u.country ? ` · ${u.country}${u.city ? ', ' + u.city : ''}` : ''}
                          </div>
                          {u.notes && <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '14px', lineHeight: 1.95, margin: '0 0 8px', color: 'var(--ink-soft)', maxWidth: '460px' }}>{u.notes}</p>}
                          {/* On mobile: inline tier/weather/safety + link */}
                          {isMobile && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                              {u.tier && <span style={{ ...edNum, padding: '2px 8px', border: '1px solid var(--rule)', direction: 'ltr', fontSize: '12px', color: 'var(--ink)' }}>{u.tier}</span>}
                              {u.fitLevel && <span style={{ fontFamily: 'var(--f-arabic)', fontSize: '11px', color: 'var(--ink-soft)' }}>{u.fitLevel}</span>}
                              {u.weather && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--f-arabic)', fontSize: '11px', color: getWeatherColor(u.weather) }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getWeatherColor(u.weather) }} />
                                  {u.weather}
                                </span>
                              )}
                              {u.link && (
                                <a href={u.link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '13px', color: 'var(--accent)', direction: 'ltr' }}>
                                  الموقع →
                                </a>
                              )}
                              {u.muslimFriendly?.length > 0 && (
                                <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '12px', color: 'var(--accent)', direction: 'ltr' }}>
                                  {isExpanded ? '▾ أقل' : '▸ بيئة إسلامية'}
                                </button>
                              )}
                            </div>
                          )}
                          {isMobile && isExpanded && u.muslimFriendly?.length > 0 && (
                            <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--paper-2)', borderInlineStart: '2px solid var(--accent)' }}>
                              {u.muslimFriendly.map((mf, mi) => (
                                <div key={mi} style={{ fontFamily: 'var(--f-arabic)', fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 2 }}>{mf}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Desktop: tier/weather/safety column */}
                        {!isMobile && (
                          <div>
                            {u.tier && <div style={{ ...edNum, display: 'inline-block', padding: '4px 12px', border: '1px solid var(--rule)', direction: 'ltr', marginBottom: '8px', fontSize: '14px', color: 'var(--ink)' }}>{u.tier}</div>}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              {u.fitLevel && <span style={{ fontFamily: 'var(--f-arabic)', fontSize: '12px', color: 'var(--ink-soft)' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginInlineEnd: '6px' }} />{u.fitLevel}</span>}
                              {u.weather && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--f-arabic)', fontSize: '12px', color: getWeatherColor(u.weather) }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getWeatherColor(u.weather), flexShrink: 0 }} />
                                  {u.weather}
                                </span>
                              )}
                              {u.safety && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--f-arabic)', fontSize: '12px', color: getSafetyColor(u.safety) }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSafetyColor(u.safety), flexShrink: 0 }} />
                                  {u.safety}
                                </span>
                              )}
                            </div>
                            {u.muslimFriendly?.length > 0 && (
                              <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '13px', color: 'var(--accent)', direction: 'ltr' }}>
                                {isExpanded ? '▾ أقل' : '▸ بيئة إسلامية'}
                              </button>
                            )}
                            {isExpanded && u.muslimFriendly?.length > 0 && (
                              <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--paper-2)', borderInlineStart: '2px solid var(--accent)' }}>
                                {u.muslimFriendly.map((mf, mi) => (
                                  <div key={mi} style={{ fontFamily: 'var(--f-arabic)', fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 2 }}>{mf}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Desktop: link column */}
                        {!isMobile && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {u.link && (
                              <a href={u.link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', borderBottom: '1px solid var(--ink)', paddingBottom: '2px', display: 'inline-flex', gap: '6px' }}>
                                <span>الموقع</span><span>→</span>
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                )}
              </section>

            {/* Requirements */}
            {results.requirements?.length > 0 && (
              <section style={{ marginTop: '64px' }}>
                <SectionEyebrow n="III" en="المتطلبات" ar="المتطلبات" />
                <div style={{ border: '1px solid var(--hairline)', padding: '28px 32px' }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', columnCount: isMobile ? 1 : 2, columnGap: '36px', fontFamily: 'var(--f-arabic)', fontSize: '14.5px', lineHeight: 2 }}>
                    {results.requirements.map((r, i) => (
                      <li key={i} style={{ breakInside: 'avoid', padding: '10px 0', borderBottom: i < results.requirements.length - 1 ? '1px dotted var(--hairline)' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ ...edNum, fontStyle: 'italic', fontSize: '16px', color: 'var(--accent)', minWidth: '28px', direction: 'ltr' }}>{String(i + 1).padStart(2, '0')}.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Next Steps */}
            {results.nextSteps?.length > 0 && (
              <section style={{ marginTop: '64px' }}>
                <SectionEyebrow n="IV" en="الخطوات القادمة" ar="الخطوات القادمة" />
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid var(--rule)' }}>
                  {results.nextSteps.map((s, i) => (
                    <li key={i} style={{ borderBottom: '1px solid var(--hairline)', padding: isMobile ? '16px 0' : '22px 0', display: 'grid', gridTemplateColumns: isMobile ? '40px 1fr' : '80px 1fr auto', gap: isMobile ? '12px' : '28px', alignItems: 'center' }}>
                      <div style={{ ...edNum, fontStyle: 'italic', fontSize: isMobile ? '32px' : '56px', lineHeight: 0.9, color: 'var(--accent)', fontWeight: 400, direction: 'ltr' }}>{String(i + 1).padStart(2, '0')}</div>
                      <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '16px', lineHeight: 1.85 }}>{s}</div>
                      <div style={{ ...edMono, color: 'var(--ink-faint)' }}>الأسبوع {Math.ceil((i + 1) / 2)}</div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Actions */}
            <section className="no-print" style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid var(--rule)', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <HardButton variant="ghost" onClick={onPrint}><span>طباعة</span><span>⎙</span></HardButton>
              <HardButton variant="ghost" onClick={onPrint}><span>حفظ PDF</span><span>↓</span></HardButton>
              <HardButton variant="primary" onClick={onReset}><span>ابدأ من جديد</span><span>↺</span></HardButton>
            </section>

            <footer style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid var(--hairline)', ...edMono, color: 'var(--ink-faint)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '4px' : 0, justifyContent: 'space-between', alignItems: isMobile ? 'center' : undefined, fontSize: isMobile ? '9px' : undefined }}>
              <span>— نهاية التقرير —</span>
              <span>مستشار · ٢٠٢٦ · المجلد الأول</span>
              <span>صُنع في الرياض — غير حكومي</span>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Home() {
  const { width: winWidth } = useWindowSize();
  const isMobile = winWidth < 768;
  const [screen, setScreen] = useState('landing');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    academicLevel: '', currentInstitution: '', gpa: '', gpaScale: '4',
    english: '', englishScore: '', field: '', degreeLevel: '',
    countries: [], weatherPreference: '', budget: '', gender: '', mahram: '',
    passions: [], passionsExtra: '', goals: [], goalsExtra: ''
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [programFilter, setProgramFilter] = useState('all');
  const [universities, setUniversities] = useState([]);
  const [uniLoading, setUniLoading] = useState(true);
  const [cvFile, setCvFile] = useState(null);
  const [cvBase64, setCvBase64] = useState('');
  const [cvError, setCvError] = useState('');

  // Fetch university data for explorer
  useEffect(() => {
    fetch('/api/recommend')
      .then(r => r.json())
      .then(data => { setUniversities(data.universities || []); setUniLoading(false); })
      .catch(() => setUniLoading(false));
  }, []);

  // Scroll to top on screen change
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const baseQuestions = [
    { key: 'academicLevel', label: 'ما هو مستواك الأكاديمي الحالي؟', hint: 'اختر المرحلة التي أكملتها أو تدرس بها حالياً', type: 'select',
      options: [
        { value: 'highschool', label: 'طالب ثانوية أو خريج حديث' },
        { value: 'bachelor_student', label: 'طالب بكالوريوس' },
        { value: 'bachelor_graduate', label: 'خريج بكالوريوس' },
        { value: 'master_student', label: 'طالب ماجستير' },
        { value: 'master_graduate', label: 'خريج ماجستير' },
        { value: 'phd_student', label: 'طالب دكتوراه' }
      ]
    },
    { key: 'currentInstitution', label: 'من أي جامعة أو مؤسسة حصلت على شهادتك الحالية؟', hint: 'اكتب اسم الجامعة أو المدرسة', type: 'text', placeholder: 'مثال: جامعة الملك عبدالعزيز' },
    { key: 'gpa', label: 'ما هو معدلك التراكمي؟', hint: 'اختر المقياس ثم أدخل المعدل', type: 'gpa' },
    { key: 'english', label: 'ما مستوى إتقانك للغة الإنجليزية؟', hint: 'إذا كان لديك شهادة رسمية اختر نوعها', type: 'english' },
    { key: 'field', label: 'ما هو التخصص الذي ترغب بدراسته؟', hint: 'كن محدداً قدر الإمكان', type: 'text', placeholder: 'مثال: هندسة ذكاء اصطناعي، طب أسنان، إدارة أعمال' },
    { key: 'degreeLevel', label: 'ما هي الدرجة العلمية التي تسعى إليها؟', hint: 'اختر المرحلة القادمة', type: 'select',
      options: [
        { value: 'bachelor', label: 'بكالوريوس' },
        { value: 'master', label: 'ماجستير' },
        { value: 'phd', label: 'دكتوراه' },
        { value: 'diploma', label: 'دبلوم أو شهادة مهنية' }
      ]
    },
    { key: 'countries', label: 'ما هي الدول التي تفضل الدراسة فيها؟', hint: 'اختر كل الدول التي تهمك، يمكنك اختيار أكثر من دولة', type: 'countries' },
    { key: 'weatherPreference', label: 'ما نوع المناخ الذي تفضله؟', hint: 'هذا يساعدنا في ترشيح مدن مناسبة لك', type: 'select',
      options: [
        { value: 'hot', label: 'حار ومشمس' },
        { value: 'moderate', label: 'معتدل ومتوسط' },
        { value: 'cold', label: 'بارد وثلجي' },
        { value: 'no_preference', label: 'لا يهمني المناخ' }
      ]
    },
    { key: 'budget', label: 'ما هي خطتك للتمويل؟', hint: 'هذا يساعدنا في ترشيح البرامج المناسبة', type: 'select',
      options: [
        { value: 'scholarship_only', label: 'أبحث عن ابتعاث حكومي فقط' },
        { value: 'scholarship_preferred', label: 'أفضل الابتعاث لكن مستعد للتمويل الذاتي' },
        { value: 'self_funded', label: 'تمويل ذاتي' },
        { value: 'undecided', label: 'لم أحدد بعد' }
      ]
    },
    { key: 'gender', label: 'الجنس', hint: 'بعض البرامج لها شروط خاصة', type: 'select',
      options: [{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }]
    },
    { key: 'mahram', label: 'هل سيرافقك محرم أثناء الدراسة؟', hint: 'يؤثر على اشتراطات بعض البرامج والدول', type: 'select',
      options: [{ value: 'yes', label: 'نعم، سيرافقني محرم' }, { value: 'no', label: 'لا' }, { value: 'unsure', label: 'لم أقرر بعد' }],
      showIf: (a) => a.gender === 'female'
    },
    { key: 'passions', label: 'ما الذي استمتعت به أكثر في دراستك أو حياتك؟', hint: 'اختر كل ما ينطبق عليك', type: 'multiselect', options: PASSIONS_OPTIONS, extraKey: 'passionsExtra', extraPlaceholder: 'أخبرنا أكثر إن أحببت' },
    { key: 'goals', label: 'ما هي أهدافك المهنية بعد التخرج؟', hint: 'اختر كل ما ينطبق عليك', type: 'multiselect', options: GOALS_OPTIONS, extraKey: 'goalsExtra', extraPlaceholder: 'أخبرنا أكثر إن أحببت' }
  ];

  const questions = baseQuestions.filter(q => !q.showIf || q.showIf(answers));
  const totalSteps = questions.length;
  const currentQ = questions[step];

  const isStepValid = () => {
    if (!currentQ) return false;
    if (currentQ.key === 'gpa') return answers.gpa && parseFloat(answers.gpa) > 0;
    if (currentQ.key === 'english') return answers.english !== '';
    if (currentQ.key === 'countries') return answers.countries && answers.countries.length > 0;
    if (currentQ.type === 'multiselect') return answers[currentQ.key] && answers[currentQ.key].length > 0;
    return answers[currentQ.key] && answers[currentQ.key].toString().trim() !== '';
  };

  const [confirming, setConfirming] = useState(false);

  const generateRecommendations = async () => {
    // Show 800ms completion confirmation
    setConfirming(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setConfirming(false);

    setScreen('results');
    setLoading(true);
    setError(null);

    const selectedCountryLabels = answers.countries
      .map(v => COUNTRIES.find(c => c.value === v)?.arFull)
      .filter(Boolean)
      .join('، ');

    const passionsLabels = answers.passions.map(v => PASSIONS_OPTIONS.find(o => o.value === v)?.label).filter(Boolean);
    const goalsLabels = answers.goals.map(v => GOALS_OPTIONS.find(o => o.value === v)?.label).filter(Boolean);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          countriesText: selectedCountryLabels,
          passions: passionsLabels.concat(answers.passionsExtra ? [answers.passionsExtra] : []),
          goals: goalsLabels.concat(answers.goalsExtra ? [answers.goalsExtra] : []),
          ...(cvBase64 ? { cv: cvBase64 } : {})
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحليل بياناتك. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else generateRecommendations();
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else setScreen('cvUpload');
  };
  const handleReset = () => {
    setScreen('landing');
    setStep(0);
    setAnswers({
      academicLevel: '', currentInstitution: '', gpa: '', gpaScale: '4',
      english: '', englishScore: '', field: '', degreeLevel: '',
      countries: [], weatherPreference: '', budget: '', gender: '', mahram: '',
      passions: [], passionsExtra: '', goals: [], goalsExtra: ''
    });
    setResults(null);
    setError(null);
    setCvFile(null);
    setCvBase64('');
    setCvError('');
  };

  // ── LANDING ──
  if (screen === 'landing') return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: 'var(--sand)' }}>
      <Head>
        <title>مستشار الابتعاث</title>
        <meta name="description" content="مرشدك الذكي إلى الابتعاث الحكومي والجامعات العالمية" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ScrollProgress />
      <Nav onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
      <Hero onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
      <HowItWorks isMobile={isMobile} />
      <ProgramBoard programFilter={programFilter} setProgramFilter={setProgramFilter} isMobile={isMobile} />
      <UniversityExplorer universities={universities} loading={uniLoading} isMobile={isMobile} />
      <ClosingCTA onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
      <Footer isMobile={isMobile} />
    </div>
  );

  // ── CV UPLOAD ──
  if (screen === 'cvUpload') return (
    <CVUploadScreen
      cvFile={cvFile} setCvFile={setCvFile}
      cvBase64={cvBase64} setCvBase64={setCvBase64}
      cvError={cvError} setCvError={setCvError}
      onContinue={() => setScreen('questionnaire')}
      onBack={() => setScreen('landing')}
      isMobile={isMobile}
    />
  );

  // ── QUESTIONNAIRE ──
  if (screen === 'questionnaire') return (
    <QuestionnaireScreen
      answers={answers} setAnswers={setAnswers}
      step={step} setStep={setStep}
      questions={questions} totalSteps={totalSteps}
      onBack={handleBack} onNext={handleNext} isStepValid={isStepValid}
      confirming={confirming} isMobile={isMobile}
    />
  );

  // ── RESULTS ──
  if (screen === 'results') return (
    <ResultsScreen
      loading={loading} error={error} results={results} answers={answers}
      onRetry={generateRecommendations} onReset={handleReset} onPrint={() => window.print()}
      isMobile={isMobile}
    />
  );

  return null;
}
