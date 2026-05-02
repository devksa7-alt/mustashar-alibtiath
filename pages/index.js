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
    case 'closed': return { label: 'مغلق', color: 'var(--ink-faint)', bg: 'rgba(20,35,59,0.06)' };
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
function Nav({ onStart, isMobile }) {
  return (
    <header className="no-print" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: isMobile ? '18px' : '24px', direction: 'ltr' }}>
          <Compass size={isMobile ? 20 : 24} />
          <span>Mustashar</span>
          {!isMobile && <span style={{ fontFamily: 'var(--f-arabic-disp)', fontStyle: 'normal', fontSize: '18px', color: 'var(--ink-soft)', marginInlineStart: '4px' }}>· مستشار</span>}
        </div>
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '28px', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: 'var(--ink-soft)' }}>
            <a href="#programs">البرامج</a>
            <a href="#atlas">الجامعات</a>
            <a href="#method">الطريقة</a>
          </nav>
        )}
        <HardButton variant="primary" size="sm" onClick={onStart}>
          <span>ابدأ</span>
          <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic' }}>→</span>
        </HardButton>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: HERO
// ═══════════════════════════════════════════════════════════════
function Hero({ onStart, isMobile }) {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '20px 16px 0' : '32px 40px 0', position: 'relative' }}>
      <div style={{ ...edMono, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink-soft)', marginBottom: isMobile ? '32px' : '56px', paddingTop: '4px', paddingBottom: '4px', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', fontSize: isMobile ? '8px' : undefined }}>
        <span>المجلد الأول · العدد ٠١ · ٢٠٢٦</span>
        {!isMobile && <span>الرياض ↔ العالم</span>}
        <span style={{ fontFamily: 'var(--f-arabic-disp)', letterSpacing: 0, fontSize: isMobile ? '11px' : '13px' }}>مجلة الطالب المُبتَعَث</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '32px' : '64px', alignItems: 'start' }}>
        <div style={{ paddingTop: '24px' }}>
          <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '18px' }}>◆ الفصل الأول — الرحلة</div>
          <p style={{ fontFamily: 'var(--f-arabic-disp)', fontWeight: 400, fontSize: '24px', lineHeight: 1.5, color: 'var(--ink-soft)', margin: '0 0 28px', maxWidth: '460px' }}>
            "لكل طالب يحلم بما هو أبعد من الخريطة —<br />
            <span style={{ color: 'var(--ink)' }}>هنا البوصلة.</span>"
          </p>
          <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '17px', lineHeight: 1.95, color: 'var(--ink-soft)', margin: '0 0 36px', maxWidth: '460px', fontWeight: 400 }}>
            مرشدك الذكي إلى الابتعاث الحكومي والجامعات العالمية. اثنا عشر سؤالاً تترجم إلى تقرير شخصي مكتوب بعناية — برامج، جامعات، ومراحل عملية.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <HardButton variant="primary" size="lg" onClick={onStart}>
              <span>ابدأ الاستشارة</span>
              <span style={{ fontFamily: 'var(--f-display)', fontSize: '22px', fontStyle: 'italic' }}>→</span>
            </HardButton>
            <a href="#method" style={{ fontFamily: 'var(--f-arabic)', fontSize: '15px', color: 'var(--ink-soft)', borderBottom: '1px solid var(--hairline)', paddingBottom: '4px' }}>اقرأ الطريقة</a>
          </div>
          {/* Decorative pull-quote anchor */}
          <div style={{ marginTop: '40px', padding: '24px 0', borderTop: '2px solid var(--accent)', borderBottom: '1px solid var(--hairline)' }}>
            <p style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '22px', lineHeight: 1.6, margin: 0, color: 'var(--ink)' }}>
              ◆ اثنا عشر سؤالاً فقط تفصلك عن خارطة طريقك.
            </p>
            <span style={{ ...edMono, color: 'var(--ink-faint)', fontSize: '9px', display: 'block', marginTop: '8px' }}>صُنع في الرياض · بالذكاء الاصطناعي</span>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', gap: '32px', paddingTop: '20px', borderTop: '1px solid var(--hairline)' }}>
            {[{ n: '12', l: 'أسئلة' }, { n: "3'", l: 'دقائق' }, { n: '8', l: 'وجهات' }].map((s, i) => (
              <div key={i}>
                <div style={{ ...edNum, fontSize: '56px', lineHeight: 1, fontWeight: 400, fontStyle: 'italic' }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '13px', marginTop: '4px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', order: isMobile ? -1 : 0 }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}><Compass size={48} trackMouse /></div>
          ) : (
            <div style={{ position: 'absolute', top: '-8px', left: '-8px' }}><Compass size={88} trackMouse /></div>
          )}
          <h1 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? 'clamp(72px, 18vw, 120px)' : 'clamp(96px, 13vw, 200px)', lineHeight: 0.92, margin: 0, fontWeight: 400, letterSpacing: '-0.005em', textAlign: 'right' }}>
            ابتَعِث<br />بثقة.
          </h1>
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '20px', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--f-arabic)', fontSize: '16px', color: 'var(--accent)', fontWeight: 500 }}>تأسس</span>
            <span style={{ fontFamily: 'var(--f-arabic)', fontSize: '18px', color: 'var(--ink-soft)', borderBottom: '1px dotted var(--hairline)', paddingBottom: '6px' }}>
              رفيقك الهادئ في السؤال الأكبر — <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '20px' }}>إلى أين؟</span>
            </span>
            <span style={{ ...edMono, color: 'var(--ink-faint)' }}>2026</span>
          </div>
        </div>
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
function ProgramBoard({ programFilter, setProgramFilter, isMobile }) {
  const filtered = PROGRAM_SCHEDULE.filter(p => {
    if (programFilter === 'all') return true;
    if (programFilter === 'phd') return p.levels.includes('phd') || p.levels.includes('all');
    return p.levels.includes(programFilter) || p.levels.includes('all');
  });

  return (
    <section id="programs" style={{ maxWidth: 1280, margin: isMobile ? '48px auto 0' : '96px auto 0', padding: isMobile ? '0 16px' : '0 40px' }}>
      <SectionEyebrow n="II" en="المنح الحكومية" ar="برامج الابتعاث" />
      <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '14px', color: 'var(--ink-soft)', marginTop: '-14px', marginBottom: '28px' }}>
        ◆ المواعيد تقريبية بناءً على الدورات السابقة — تحقق من المواقع الرسمية.
      </p>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '32px', borderBottom: '1px solid var(--hairline)', overflowX: 'auto' }}>
        {LEVEL_FILTERS.map(f => (
          <button key={f.value} onClick={() => setProgramFilter(f.value)}
            style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: programFilter === f.value ? '2px solid var(--accent)' : '2px solid transparent', fontFamily: 'var(--f-arabic)', fontSize: '15px', color: programFilter === f.value ? 'var(--ink)' : 'var(--ink-faint)', cursor: 'pointer', fontWeight: programFilter === f.value ? 500 : 400, transition: 'all .2s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Program grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 0 }}>
        {filtered.map((prog, i) => {
          const status = getProgramStatus(prog);
          const sStyle = getStatusStyle(status);
          const nextOpen = status === 'closed' ? getNextOpenText(prog) : null;
          const left = isMobile || i % 2 === 0;
          const top = isMobile ? i === 0 : i < 2;
          return (
            <article key={prog.id} style={{ padding: '28px', paddingInlineStart: left ? 0 : '28px', paddingInlineEnd: left ? '28px' : 0, borderTop: top ? 'none' : '1px solid var(--hairline)', borderInlineStart: left ? 'none' : '1px solid var(--hairline)', opacity: status === 'closed' ? 0.5 : 1, background: status === 'closed' ? 'var(--paper-2)' : 'transparent', transition: 'opacity .3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ ...edNum, fontSize: '40px', lineHeight: 0.9, color: 'var(--accent)', fontStyle: 'italic', fontWeight: 400, direction: 'ltr' }}>
                  №{String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ ...edMono, padding: '4px 10px', background: sStyle.bg, color: sStyle.color }}>
                  {sStyle.label}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '28px', lineHeight: 1.2, margin: '0 0 8px', fontWeight: 400 }}>{prog.name}</h3>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {(prog.levels.includes('all') ? ['all'] : prog.levels).map(lv => (
                  <span key={lv} style={{ fontFamily: 'var(--f-arabic)', fontSize: '13px', fontWeight: 500, padding: '4px 10px', border: '1px solid var(--hairline)', color: 'var(--ink-soft)' }}>{LEVEL_DISPLAY[lv]}</span>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '14px', lineHeight: 2, color: 'var(--ink-soft)', margin: '0 0 14px' }}>{prog.description}</p>
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '8px' }}>
                {!prog.ongoing && !prog.varies && <span>يفتح {prog.openLabel} · يغلق {prog.closeLabel}</span>}
                {(prog.varies || prog.ongoing) && <span>{prog.openLabel}</span>}
              </div>
              {nextOpen && (
                <div style={{ fontFamily: 'var(--f-arabic)', fontSize: '13px', color: 'var(--accent)', fontWeight: 500, marginBottom: '12px' }}>
                  التالي: يفتح {nextOpen} تقريباً
                </div>
              )}
              <a href={prog.link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '15px', borderBottom: '1px solid var(--ink)', paddingBottom: '2px' }}>
                <span>الموقع الرسمي</span><span>→</span>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: UNIVERSITY EXPLORER
// ═══════════════════════════════════════════════════════════════
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
  const [hoveredCountry, setHoveredCountry] = useState(null);

  if (uniLoading) {
    return (
      <section id="atlas" style={{ maxWidth: 1280, margin: '96px auto 0', padding: '0 40px' }}>
        <SectionEyebrow n="III" en="أطلس الجامعات" ar="دليل الجامعات" />
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '48px', height: '48px', border: '1px solid var(--hairline)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'ed-spin 1.6s linear infinite', margin: '0 auto 20px' }} />
          <div style={{ ...edMono, color: 'var(--ink-faint)' }}>جارٍ تحميل بيانات الأطلس</div>
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

  // Count per country
  const countByCountry = {};
  universities.forEach(u => { countByCountry[u.country] = (countByCountry[u.country] || 0) + 1; });

  return (
    <section id="atlas" style={{ maxWidth: 1280, margin: isMobile ? '48px auto 0' : '96px auto 0', padding: isMobile ? '0 16px' : '0 40px' }}>
      <SectionEyebrow n="III" en="أطلس الجامعات" ar="دليل الجامعات" />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? '24px' : '48px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 400, fontSize: isMobile ? '32px' : '48px', lineHeight: 1, margin: '0 0 16px' }}>
            {universities.length} جامعة،<br />أطلس واحد.
          </h2>
          <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '15px', lineHeight: 2, color: 'var(--ink-soft)', margin: '0 0 20px', maxWidth: '360px' }}>
            قاعدة بيانات شاملة للجامعات المدعومة ببرامج الابتعاث الحكومي. ابحث بالدولة أو التخصص أو الاسم.
          </p>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو المدينة..."
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: '1px solid var(--hairline)', fontFamily: 'var(--f-arabic)', fontSize: '15px', color: 'var(--ink)', direction: 'rtl' }} />
          </div>
          <div style={{ ...edMono, color: 'var(--ink-faint)', lineHeight: 2 }}>
            ★ {filtered.length} من {universities.length}
          </div>
        </div>

        {/* Country tabs */}
        <div>
          {isMobile ? (
            /* Mobile: horizontal scrollable tabs */
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid var(--hairline)', paddingBottom: '2px' }}>
              {UNI_COUNTRY_TABS.map(tab => {
                const active = countryFilter === tab.value;
                return (
                  <button key={tab.value} onClick={() => { setCountryFilter(tab.value); setShowCount(12); }}
                    style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: active ? 'var(--ink)' : 'var(--ink-faint)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s', flexShrink: 0 }}>
                    {tab.ar}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Desktop: vertical list */
            <div style={{ borderTop: '1px solid var(--rule)' }}>
              {UNI_COUNTRY_TABS.map((tab, i) => {
                const active = countryFilter === tab.value;
                const count = tab.value === 'all' ? universities.length : (countByCountry[tab.value] || 0);
                return (
                  <button key={tab.value} onClick={() => { setCountryFilter(tab.value); setShowCount(12); }}
                    onMouseEnter={() => setHoveredCountry(tab.value)} onMouseLeave={() => setHoveredCountry(null)}
                    style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto 24px', gap: '20px', alignItems: 'baseline', width: '100%', padding: '14px 0', cursor: 'pointer', background: active ? 'var(--paper-2)' : (hoveredCountry === tab.value ? 'rgba(20,35,59,0.03)' : 'transparent'), border: 'none', borderBottom: '1px solid var(--hairline)', paddingInline: active ? '12px' : '0 12px', textAlign: 'right', transition: 'all .2s' }}>
                    <span style={{ ...edNum, fontStyle: 'italic', fontSize: '20px', color: 'var(--ink-faint)', fontWeight: 400, direction: 'ltr', textAlign: 'left' }}>{String(i).padStart(2, '0')}</span>
                    <span style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: '26px', lineHeight: 1, color: active ? 'var(--ink)' : 'var(--ink-soft)' }}>{tab.ar}</span>
                    <span style={{ fontFamily: 'var(--f-arabic)', fontStyle: 'normal', fontSize: '15px', color: active ? 'var(--accent)' : 'var(--ink-faint)' }}>
                      {count} جامعة
                    </span>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: '18px', color: 'var(--accent)', opacity: hoveredCountry === tab.value || active ? 1 : 0, transition: 'opacity .2s', direction: 'ltr' }}>→</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Field filter */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '1px solid var(--hairline)', overflowX: 'auto' }}>
        {UNI_FIELD_TABS.map(f => (
          <button key={f.value} onClick={() => { setFieldFilter(f.value); setShowCount(12); }}
            style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: fieldFilter === f.value ? '2px solid var(--accent)' : '2px solid transparent', fontFamily: 'var(--f-arabic)', fontSize: '14px', color: fieldFilter === f.value ? 'var(--ink)' : 'var(--ink-faint)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* University list */}
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', borderTop: '1px solid var(--rule)' }}>
        {showing.map((u, i) => {
          const isExpanded = expandedUni === i;
          const mfLabels = [];
          if (u.muslimFriendly) {
            if (MF_LABELS.halal[u.muslimFriendly.halal]) mfLabels.push(MF_LABELS.halal[u.muslimFriendly.halal]);
            if (MF_LABELS.mosque[u.muslimFriendly.mosque]) mfLabels.push(MF_LABELS.mosque[u.muslimFriendly.mosque]);
            if (MF_LABELS.saudiCommunity[u.muslimFriendly.saudiCommunity]) mfLabels.push(MF_LABELS.saudiCommunity[u.muslimFriendly.saudiCommunity]);
            if (MF_LABELS.prayerRoom[u.muslimFriendly.prayerRoom]) mfLabels.push(MF_LABELS.prayerRoom[u.muslimFriendly.prayerRoom]);
          }
          return (
            <li key={i} style={{ borderBottom: '1px solid var(--hairline)', padding: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '40px 1fr' : '50px 2fr 1.2fr auto', gap: isMobile ? '12px' : '20px', alignItems: 'start' }}>
                <div style={{ ...edNum, fontStyle: 'italic', fontSize: isMobile ? '22px' : '28px', lineHeight: 1, color: 'var(--accent)', fontWeight: 400, direction: 'ltr' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--f-arabic-disp)', fontSize: isMobile ? '18px' : '22px', lineHeight: 1.2, margin: '0 0 2px', fontWeight: 400 }}>{u.nameAr}</h3>
                  <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: isMobile ? '13px' : '16px', color: 'var(--ink-soft)', direction: 'ltr', textAlign: 'right' }}>
                    {u.nameEn} · {u.city}
                  </div>
                  {/* On mobile, show tier/weather/safety inline */}
                  {isMobile && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ ...edMono, padding: '2px 6px', border: '1px solid var(--rule)', color: 'var(--ink)', fontSize: '9px', direction: 'ltr' }}>
                        {TIER_LABELS[u.tier] || `الفئة ${u.tier}`}
                      </span>
                      {WEATHER_LABELS[u.weather] && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--f-arabic)', fontSize: '11px', color: getWeatherColor(u.weather) }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getWeatherColor(u.weather) }} />
                          {WEATHER_LABELS[u.weather]}
                        </span>
                      )}
                      {SAFETY_LABELS[u.safety] && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--f-arabic)', fontSize: '11px', color: getSafetyColor(u.safety) }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getSafetyColor(u.safety) }} />
                          {SAFETY_LABELS[u.safety]}
                        </span>
                      )}
                      {mfLabels.length > 0 && (
                        <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '12px', color: 'var(--accent)', direction: 'ltr' }}>
                          {isExpanded ? '▾ أقل' : '▸ بيئة إسلامية'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Desktop: tier/weather/safety column */}
                {!isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ ...edMono, display: 'inline-block', padding: '3px 8px', border: '1px solid var(--rule)', color: 'var(--ink)', alignSelf: 'flex-start', direction: 'ltr' }}>
                      {TIER_LABELS[u.tier] || `الفئة ${u.tier}`}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {WEATHER_LABELS[u.weather] && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--f-arabic)', fontSize: '12px', color: getWeatherColor(u.weather) }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getWeatherColor(u.weather), flexShrink: 0 }} />
                          {WEATHER_LABELS[u.weather]}
                        </span>
                      )}
                      {SAFETY_LABELS[u.safety] && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--f-arabic)', fontSize: '12px', color: getSafetyColor(u.safety) }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getSafetyColor(u.safety), flexShrink: 0 }} />
                          {SAFETY_LABELS[u.safety]}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Desktop: muslim-friendly button */}
                {!isMobile && (
                  <div>
                    {mfLabels.length > 0 && (
                      <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--accent)', direction: 'ltr' }}>
                        {isExpanded ? '▾ أقل' : '▸ بيئة إسلامية'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Fields tags */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', marginInlineStart: isMobile ? '52px' : '70px', flexWrap: 'wrap' }}>
                {u.fields.filter(f => f !== 'all').slice(0, 5).map(f => (
                  <span key={f} style={{ fontFamily: 'var(--f-arabic)', fontSize: '12px', padding: '3px 9px', background: 'var(--paper-2)', color: 'var(--ink-soft)' }}>
                    {FIELD_LABELS[f] || f}
                  </span>
                ))}
              </div>
              {/* Muslim-friendly expanded */}
              {isExpanded && mfLabels.length > 0 && (
                <div style={{ marginTop: '12px', marginInlineStart: isMobile ? '52px' : '70px', padding: '14px 16px', background: 'var(--paper-2)', borderInlineStart: '2px solid var(--accent)' }}>
                  <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '8px' }}>بيئة مناسبة للمسلمين</div>
                  {mfLabels.map((label, mi) => (
                    <div key={mi} style={{ fontFamily: 'var(--f-arabic)', fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 2 }}>{label}</div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-faint)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Compass size={56} />
          <p style={{ fontFamily: 'var(--f-arabic)', fontSize: '16px', margin: 0 }}>لا توجد جامعات تطابق معايير البحث</p>
          <p style={{ ...edMono, fontSize: '10px', margin: 0 }}>جرّب تعديل المرشحات</p>
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <HardButton variant="ghost" onClick={() => setShowCount(prev => prev + 12)}>
            <span>عرض المزيد</span>
            <span style={{ fontFamily: 'var(--f-arabic)' }}>({filtered.length - showCount} أخرى)</span>
          </HardButton>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOME: CLOSING CTA + FOOTER
// ═══════════════════════════════════════════════════════════════
function ClosingCTA({ onStart, isMobile }) {
  return (
    <section style={{ maxWidth: 1280, margin: isMobile ? '64px auto 0' : '120px auto 0', padding: isMobile ? '0 16px' : '0 40px' }}>
      <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: isMobile ? '40px 0' : '72px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? '32px' : '48px', alignItems: 'center', textAlign: isMobile ? 'center' : undefined }}>
        <div>
          <div style={{ ...edMono, color: 'var(--accent)', marginBottom: '18px' }}>◆ انطلق</div>
          <h2 style={{ fontFamily: 'var(--f-arabic-disp)', fontWeight: 400, fontSize: 'clamp(56px, 8vw, 112px)', lineHeight: 0.95, margin: 0 }}>
            خذ القرار <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', color: 'var(--accent)', fontSize: '0.85em' }}>اليوم</span>.
          </h2>
          <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--ink-soft)', margin: '20px 0 0', maxWidth: '540px' }}>
            ثلاث دقائق. بلا حساب، بلا بريد، بلا مشاركة بيانات — فقط إجابات.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Compass size={120} />
          <HardButton variant="primary" size="lg" onClick={onStart}>
            <span>ابدأ الاستشارة</span>
            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '22px' }}>→</span>
          </HardButton>
        </div>
      </div>
    </section>
  );
}

function Footer({ isMobile }) {
  return (
    <footer style={{ maxWidth: 1280, margin: '48px auto 0', padding: isMobile ? '32px 16px 48px' : '32px 40px 64px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '24px' : '48px', fontFamily: 'var(--f-arabic)', fontSize: '13px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--f-display)', fontSize: '24px', fontStyle: 'italic', direction: 'ltr' }}>
          <Compass size={22} /><span>Mustashar</span>
        </div>
        <p style={{ marginTop: '12px', lineHeight: 1.9, color: 'var(--ink-soft)', maxWidth: '280px' }}>
          مشروع غير رسمي يساعد الطلاب السعوديين على الوصول للبرامج المناسبة لمستقبلهم.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ ...edMono, color: 'var(--ink-faint)', marginBottom: '6px' }}>فهرس</div>
        <a href="#method">الطريقة</a>
        <a href="#programs">البرامج</a>
        <a href="#atlas">الجامعات</a>
      </div>
      <div style={{ direction: 'ltr', textAlign: 'left', ...edMono, lineHeight: 2.2, color: 'var(--ink-faint)' }}>
        © 2026 مستشار الابتعاث<br />
        صُنع في الرياض — ليس حكومياً<br />
        المجلد الأول · العدد الأول<br />
        صنعه{' '}<a href="https://www.linkedin.com/in/sanad-al-lheani/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sanad Allheani</a>
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
                <div style={{ ...edMono, ...edNum, color: 'var(--ink-faint)', marginTop: '4px', direction: 'ltr' }}>{formatSize(cvFile.size)} · مُرفَق</div>
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
            {results.universities?.length > 0 && (
              <section style={{ marginTop: '64px' }}>
                <SectionEyebrow n="II" en="الجامعات" ar="الجامعات" />
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
                              {u.tier && <span style={{ ...edMono, padding: '2px 6px', border: '1px solid var(--rule)', direction: 'ltr', fontSize: '9px' }}>{u.tier}</span>}
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
                            {u.tier && <div style={{ ...edMono, display: 'inline-block', padding: '4px 10px', border: '1px solid var(--rule)', direction: 'ltr', marginBottom: '8px' }}>{u.tier}</div>}
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
              </section>
            )}

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
    <div style={{ direction: 'rtl', minHeight: '100vh', position: 'relative' }}>
      <Head>
        <title>مستشار الابتعاث</title>
        <meta name="description" content="مرشدك الذكي إلى الابتعاث الحكومي والجامعات العالمية" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <TopoLines />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
        <Hero onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
        <QuoteRibbon isMobile={isMobile} />
        <div id="method"><Method isMobile={isMobile} /></div>
        <ProgramBoard programFilter={programFilter} setProgramFilter={setProgramFilter} isMobile={isMobile} />
        <UniversityExplorer universities={universities} loading={uniLoading} isMobile={isMobile} />
        <ClosingCTA onStart={() => setScreen('cvUpload')} isMobile={isMobile} />
        <Footer isMobile={isMobile} />
      </div>
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
