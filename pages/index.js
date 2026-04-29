import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Printer, RotateCcw, GraduationCap, Globe, Mail, ExternalLink, Award, Sparkles, ListChecks, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import Head from 'next/head';

const COUNTRIES = [
  { value: 'USA', label: '🇺🇸 الولايات المتحدة' },
  { value: 'UK', label: '🇬🇧 المملكة المتحدة' },
  { value: 'Canada', label: '🇨🇦 كندا' },
  { value: 'Australia', label: '🇦🇺 أستراليا' },
  { value: 'Japan', label: '🇯🇵 اليابان' },
  { value: 'SouthKorea', label: '🇰🇷 كوريا الجنوبية' },
  { value: 'Spain', label: '🇪🇸 إسبانيا' },
  { value: 'NewZealand', label: '🇳🇿 نيوزيلندا' },
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

// ============ PROGRAM SCHEDULE DATA ============
// Months: 1=Jan ... 12=Dec. crossYear=true when window spans year boundary.
const PROGRAM_SCHEDULE = [
  {
    id: 'rawwad',
    name: 'مسار الرواد',
    description: 'أفضل 30 جامعة عالمياً • يغطي الرسوم والإقامة والتأمين والسفر',
    levels: ['bachelor', 'master'],
    openMonth: 2, closeMonth: 4,
    openLabel: 'فبراير', closeLabel: 'أبريل',
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-arruaad/',
  },
  {
    id: 'tamayoz',
    name: 'مسار التميز',
    description: 'أفضل 50 جامعة عالمياً • تخصصات ذات أولوية لرؤية 2030',
    levels: ['bachelor', 'master'],
    openMonth: 2, closeMonth: 4,
    openLabel: 'فبراير', closeLabel: 'أبريل',
    link: 'https://moe.gov.sa/ar/knowledgecenter/eservices/Pages/ksp.aspx',
  },
  {
    id: 'imdad',
    name: 'مسار إمداد',
    description: 'أفضل 200 جامعة • مجالات هندسة وطب وأعمال وتقنية وعلوم',
    levels: ['bachelor', 'master'],
    openMonth: 2, closeMonth: 4,
    openLabel: 'فبراير', closeLabel: 'أبريل',
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-emdad/',
  },
  {
    id: 'waed',
    name: 'مسار واعد',
    description: 'مع شركات سعودية كبرى • يضمن التوظيف بعد التخرج',
    levels: ['highschool'],
    openMonth: 1, closeMonth: 3,
    openLabel: 'يناير', closeLabel: 'مارس',
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-waaid/',
  },
  {
    id: 'aramco',
    name: 'برنامج أرامكو CDPNE',
    description: 'لطلاب الثانوية العلمية • يضمن التوظيف في أرامكو',
    levels: ['highschool'],
    openMonth: 9, closeMonth: 11,
    openLabel: 'سبتمبر', closeLabel: 'نوفمبر',
    link: 'https://www.aramco.com/en/careers/for-saudi-applicants/student-opportunities/college-degree-program',
  },
  {
    id: 'sabic',
    name: 'منح سابك',
    description: 'للتخصصات الهندسية والكيميائية • معدل 90% فأعلى',
    levels: ['highschool'],
    openMonth: 10, closeMonth: 12,
    openLabel: 'أكتوبر', closeLabel: 'ديسمبر',
    link: 'https://www.sabic.com/en/careers/middle-east-africa/students-and-fresh-graduates',
  },
  {
    id: 'kgsp',
    name: 'برنامج كاوست KGSP',
    description: 'تخصصات STEM عبر موهبة • مع الماجستير في كاوست لاحقاً',
    levels: ['highschool'],
    openMonth: 10, closeMonth: 1,
    crossYear: true,
    openLabel: 'أكتوبر', closeLabel: 'يناير',
    link: 'https://kgsp.kaust.edu.sa/',
  },
  {
    id: 'health',
    name: 'الابتعاث الصحي',
    description: 'وزارة الصحة • للتخصصات الطبية والصحية فقط',
    levels: ['bachelor', 'master', 'phd'],
    openMonth: 1, closeMonth: 3,
    openLabel: 'يناير', closeLabel: 'مارس',
    link: 'https://www.moh.gov.sa',
  },
  {
    id: 'misk',
    name: 'زمالة مسك',
    description: 'برنامج قيادي لمدة 6 أشهر • تطوير ريادي وقيادي',
    levels: ['bachelor', 'master'],
    openMonth: 4, closeMonth: 6,
    openLabel: 'أبريل', closeLabel: 'يونيو',
    link: 'https://misk.org.sa',
  },
  {
    id: 'faculty',
    name: 'ابتعاث هيئة التدريس',
    description: 'بترشيح من الجامعة السعودية • للعودة للتدريس فيها',
    levels: ['master', 'phd'],
    varies: true,
    openLabel: 'يتفاوت حسب الجامعة',
    link: 'https://moe.gov.sa',
  },
  {
    id: 'sacm',
    name: 'الملحقية الثقافية SACM',
    description: 'تسجيل مستمر • رعاية جميع المبتعثين السعوديين في الخارج',
    levels: ['all'],
    ongoing: true,
    openLabel: 'مفتوح على مدار السنة',
    link: 'https://www.sacm.org/',
  },
];

const MONTH_NAMES = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getProgramStatus(prog) {
  if (prog.ongoing) return 'ongoing';
  if (prog.varies) return 'varies';
  const m = new Date().getMonth() + 1;
  const { openMonth, closeMonth, crossYear } = prog;
  let isOpen;
  if (crossYear) {
    isOpen = m >= openMonth || m <= closeMonth;
  } else {
    isOpen = m >= openMonth && m <= closeMonth;
  }
  if (!isOpen) return 'closed';
  return m === closeMonth ? 'closing' : 'open';
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
    case 'open':    return { label: 'مفتوح الآن', color: '#166534', bg: '#dcfce7', dot: '#16a34a' };
    case 'closing': return { label: 'ينتهي هذا الشهر', color: '#92400e', bg: '#fef3c7', dot: '#d97706' };
    case 'closed':  return { label: 'مغلق', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
    case 'varies':  return { label: 'يتفاوت', color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' };
    case 'ongoing': return { label: 'مستمر', color: '#166534', bg: '#dcfce7', dot: '#16a34a' };
    default:        return { label: '', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
  }
}

const LEVEL_FILTERS = [
  { value: 'all',        label: 'الكل' },
  { value: 'highschool', label: 'ثانوية' },
  { value: 'bachelor',   label: 'بكالوريوس' },
  { value: 'master',     label: 'ماجستير' },
  { value: 'phd',        label: 'دكتوراه وأخرى' },
];

const LEVEL_DISPLAY = {
  highschool: 'ثانوية',
  bachelor:   'بكالوريوس',
  master:     'ماجستير',
  phd:        'دكتوراه',
  all:        'جميع المراحل',
};

export default function Home() {
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
  const [expandedUni, setExpandedUni] = useState(null);
  const [programFilter, setProgramFilter] = useState('all');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const toggleCountry = (val) => {
    setAnswers(prev => ({
      ...prev,
      countries: prev.countries.includes(val)
        ? prev.countries.filter(c => c !== val)
        : [...prev.countries, val]
    }));
  };

  const toggleMulti = (key, val) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key].includes(val)
        ? prev[key].filter(v => v !== val)
        : [...prev[key], val]
    }));
  };

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
        { value: 'hot', label: '☀️ حار ومشمس' },
        { value: 'moderate', label: '🌤️ معتدل ومتوسط' },
        { value: 'cold', label: '❄️ بارد وثلجي' },
        { value: 'no_preference', label: '🌍 لا يهمني المناخ' }
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
      options: [
        { value: 'male', label: 'ذكر' },
        { value: 'female', label: 'أنثى' }
      ]
    },
    { key: 'mahram', label: 'هل سيرافقك محرم أثناء الدراسة؟', hint: 'يؤثر على اشتراطات بعض البرامج والدول', type: 'select',
      options: [
        { value: 'yes', label: 'نعم، سيرافقني محرم' },
        { value: 'no', label: 'لا' },
        { value: 'unsure', label: 'لم أقرر بعد' }
      ],
      showIf: (a) => a.gender === 'female'
    },
    { key: 'passions', label: 'ما الذي استمتعت به أكثر في دراستك أو حياتك؟', hint: 'اختر كل ما ينطبق عليك', type: 'multiselect', options: PASSIONS_OPTIONS, extraKey: 'passionsExtra', extraPlaceholder: 'أخبرنا أكثر إن أحببت' },
    { key: 'goals', label: 'ما هي أهدافك المهنية بعد التخرج؟', hint: 'اختر كل ما ينطبق عليك', type: 'multiselect', options: GOALS_OPTIONS, extraKey: 'goalsExtra', extraPlaceholder: 'أخبرنا أكثر إن أحببت' }
  ];

  const questions = baseQuestions.filter(q => !q.showIf || q.showIf(answers));
  const currentQ = questions[step];
  const totalSteps = questions.length;

  const isStepValid = () => {
    if (!currentQ) return false;
    if (currentQ.key === 'gpa') return answers.gpa && parseFloat(answers.gpa) > 0;
    if (currentQ.key === 'english') return answers.english !== '';
    if (currentQ.key === 'countries') return answers.countries && answers.countries.length > 0;
    if (currentQ.type === 'multiselect') return answers[currentQ.key] && answers[currentQ.key].length > 0;
    return answers[currentQ.key] && answers[currentQ.key].toString().trim() !== '';
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else generateRecommendations();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else setScreen('landing');
  };

  const generateRecommendations = async () => {
    setScreen('results');
    setLoading(true);
    setError(null);

    const selectedCountryLabels = answers.countries
      .map(v => COUNTRIES.find(c => c.value === v)?.label.replace(/🇺🇸|🇬🇧|🇨🇦|🇦🇺|🇯🇵|🇰🇷|🇪🇸|🇳🇿/g, '').trim())
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
          goals: goalsLabels.concat(answers.goalsExtra ? [answers.goalsExtra] : [])
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
    setExpandedUni(null);
  };

  const handlePrint = () => window.print();

  const base = {
    fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
    direction: 'rtl', minHeight: '100vh', background: '#fafafa', color: '#1a1a1a'
  };

  const btnStyle = (active) => ({
    textAlign: 'right', padding: '18px 22px',
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#333',
    border: `1px solid ${active ? '#111' : '#e5e5e5'}`,
    borderRadius: '14px', fontSize: '16px',
    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s'
  });

  // ============ LANDING SCREEN ============
  const filteredPrograms = PROGRAM_SCHEDULE.filter(p => {
    if (programFilter === 'all') return true;
    if (programFilter === 'phd') return p.levels.includes('phd') || p.levels.includes('all');
    return p.levels.includes(programFilter) || p.levels.includes('all');
  });

  if (screen === 'landing') return (
    <div style={base}>
      <Head>
        <title>مستشار الابتعاث</title>
        <meta name="description" content="رفيقك الذكي في رحلة الدراسة خارج المملكة" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Hero */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 32px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: '#f0f0f0', borderRadius: '999px', marginBottom: '40px', fontSize: '13px', color: '#555' }}>
          <Sparkles size={14} /><span>مدعوم بالذكاء الاصطناعي</span>
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '300', letterSpacing: '-1px', marginBottom: '20px', lineHeight: '1.2', color: '#111' }}>مستشار الابتعاث</h1>
        <p style={{ fontSize: '18px', color: '#555', lineHeight: '2', marginBottom: '12px', fontWeight: '300' }}>رفيقك الذكي في رحلة الدراسة خارج المملكة</p>
        <p style={{ fontSize: '15px', color: '#777', lineHeight: '2', marginBottom: '40px', fontWeight: '300', maxWidth: '500px', margin: '0 auto 40px' }}>
          أجب عن بضعة أسئلة، وسنرشح لك البرامج الحكومية السعودية المناسبة والجامعات العالمية التي تتوافق مع تخصصك وطموحاتك
        </p>
        <button onClick={() => setScreen('questionnaire')} style={{ background: '#111', color: '#fff', border: 'none', padding: '18px 48px', fontSize: '16px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>ابدأ الآن</button>
      </div>

      {/* Program Status Section */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ borderTop: '1px solid #eaeaea', paddingTop: '56px' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '400', color: '#111', marginBottom: '8px' }}>حالة برامج الابتعاث</h2>
            <p style={{ fontSize: '13px', color: '#999', fontWeight: '300' }}>التواريخ تقريبية استناداً لدورات الأعوام السابقة • تحقق من المواقع الرسمية للتأكيد</p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            {LEVEL_FILTERS.map(f => (
              <button key={f.value} onClick={() => setProgramFilter(f.value)}
                style={{ padding: '9px 20px', borderRadius: '999px', border: `1px solid ${programFilter === f.value ? '#111' : '#e5e5e5'}`, background: programFilter === f.value ? '#111' : '#fff', color: programFilter === f.value ? '#fff' : '#555', fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Program cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '14px' }}>
            {filteredPrograms.map(prog => {
              const status = getProgramStatus(prog);
              const style = getStatusStyle(status);
              const nextOpen = status === 'closed' ? getNextOpenText(prog) : null;
              return (
                <div key={prog.id} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Top row: name + status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#111', margin: 0, lineHeight: '1.4' }}>{prog.name}</h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: style.bg, color: style.color, borderRadius: '999px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, display: 'inline-block' }} />
                      {style.label}
                    </span>
                  </div>

                  {/* Level tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(prog.levels.includes('all') ? ['all'] : prog.levels).map(lv => (
                      <span key={lv} style={{ fontSize: '11px', padding: '3px 9px', background: '#f7f7f7', color: '#555', borderRadius: '999px' }}>
                        {LEVEL_DISPLAY[lv] || lv}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: '1.8', fontWeight: '300' }}>{prog.description}</p>

                  {/* Date info */}
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {!prog.ongoing && !prog.varies && (
                      <span>🗓 يفتح الباب: {prog.openLabel} • يُغلق: {prog.closeLabel}</span>
                    )}
                    {prog.varies && <span>🗓 {prog.openLabel}</span>}
                    {prog.ongoing && <span>🗓 {prog.openLabel}</span>}
                    {nextOpen && (
                      <span style={{ color: '#111', fontWeight: '500' }}>التالي: يفتح {nextOpen} تقريباً</span>
                    )}
                  </div>

                  {/* Link */}
                  <a href={prog.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#111', fontSize: '12px', fontWeight: '500', padding: '8px 14px', border: '1px solid #e5e5e5', borderRadius: '999px', textDecoration: 'none', alignSelf: 'flex-start', marginTop: 'auto' }}>
                    <span>الموقع الرسمي</span><ExternalLink size={11} />
                  </a>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );

  // ============ QUESTIONNAIRE SCREEN ============
  if (screen === 'questionnaire' && currentQ) {
    const progress = ((step + 1) / totalSteps) * 100;
    return (
      <div style={base}>
        <Head><title>مستشار الابتعاث</title></Head>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 32px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '56px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13px', color: '#999' }}>
              <span>السؤال {step + 1} من {totalSteps}</span>
              <span>{Math.round(progress)}٪</span>
            </div>
            <div style={{ height: '2px', background: '#eaeaea', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#111', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '28px', fontWeight: '400', lineHeight: '1.5', marginBottom: '10px', color: '#111' }}>{currentQ.label}</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '36px', fontWeight: '300' }}>{currentQ.hint}</p>

            {currentQ.type === 'select' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQ.options.map(opt => (
                  <button key={opt.value} onClick={() => setAnswers({ ...answers, [currentQ.key]: opt.value })} style={btnStyle(answers[currentQ.key] === opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'countries' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {COUNTRIES.map(c => {
                  const active = answers.countries.includes(c.value);
                  return (
                    <button key={c.value} onClick={() => toggleCountry(c.value)}
                      style={{ ...btnStyle(active), textAlign: 'center', padding: '16px 12px', fontSize: '15px' }}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'multiselect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQ.options.map(opt => {
                  const active = answers[currentQ.key].includes(opt.value);
                  return (
                    <button key={opt.value} onClick={() => toggleMulti(currentQ.key, opt.value)}
                      style={{
                        ...btnStyle(active),
                        display: 'flex', alignItems: 'center', gap: '12px'
                      }}>
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                        border: active ? 'none' : '2px solid #d0d0d0',
                        background: active ? '#111' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px', fontWeight: '700'
                      }}>{active ? '✓' : ''}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
                {currentQ.extraKey && (
                  <input
                    type="text"
                    value={answers[currentQ.extraKey]}
                    onChange={e => setAnswers({ ...answers, [currentQ.extraKey]: e.target.value })}
                    placeholder={currentQ.extraPlaceholder}
                    style={{ width: '100%', padding: '18px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '15px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
                  />
                )}
              </div>
            )}

            {currentQ.type === 'text' && (
              <input type="text" value={answers[currentQ.key]} onChange={e => setAnswers({ ...answers, [currentQ.key]: e.target.value })} placeholder={currentQ.placeholder}
                style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
            )}

            {currentQ.type === 'gpa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['4', '5', '100'].map(scale => (
                    <button key={scale} onClick={() => setAnswers({ ...answers, gpaScale: scale })}
                      style={{ flex: 1, padding: '14px', background: answers.gpaScale === scale ? '#111' : '#fff', color: answers.gpaScale === scale ? '#fff' : '#555', border: `1px solid ${answers.gpaScale === scale ? '#111' : '#e5e5e5'}`, borderRadius: '12px', fontSize: '15px', fontFamily: 'inherit', cursor: 'pointer' }}>
                      من {scale}
                    </button>
                  ))}
                </div>
                <input type="number" step="0.01" value={answers.gpa} onChange={e => setAnswers({ ...answers, gpa: e.target.value })} placeholder={`أدخل معدلك من ${answers.gpaScale}`}
                  style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '17px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            {currentQ.type === 'english' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { value: 'ielts', label: 'آيلتس (IELTS)' },
                  { value: 'toefl', label: 'توفل (TOEFL)' },
                  { value: 'step', label: 'اختبار ستيب (STEP)' },
                  { value: 'duolingo', label: 'دولينجو (Duolingo)' },
                  { value: 'intermediate', label: 'متوسط، لا يوجد شهادة' },
                  { value: 'beginner', label: 'مبتدئ' }
                ].map(opt => (
                  <button key={opt.value} onClick={() => setAnswers({ ...answers, english: opt.value })} style={btnStyle(answers.english === opt.value)}>{opt.label}</button>
                ))}
                {['ielts', 'toefl', 'duolingo', 'step'].includes(answers.english) && (
                  <input type="text" value={answers.englishScore} onChange={e => setAnswers({ ...answers, englishScore: e.target.value })} placeholder="أدخل درجتك"
                    style={{ width: '100%', padding: '18px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }} />
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '56px', paddingTop: '28px', borderTop: '1px solid #eaeaea' }}>
            <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '15px', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRight size={16} /><span>السابق</span>
            </button>
            <button onClick={handleNext} disabled={!isStepValid()} style={{ background: isStepValid() ? '#111' : '#d0d0d0', color: '#fff', border: 'none', padding: '15px 32px', fontSize: '15px', fontFamily: 'inherit', borderRadius: '999px', cursor: isStepValid() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{step === totalSteps - 1 ? 'احصل على التوصيات' : 'التالي'}</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULTS SCREEN ============
  if (screen === 'results') return (
    <div style={base}>
      <Head><title>مستشار الابتعاث - توصياتك</title></Head>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <div style={{ width: '48px', height: '48px', border: '2px solid #eaeaea', borderTop: '2px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 32px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', marginBottom: '10px' }}>نحلل ملفك الآن</h2>
            <p style={{ fontSize: '14px', color: '#888', fontWeight: '300' }}>نختار لك أنسب البرامج والجامعات</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '16px', color: '#b00', marginBottom: '28px' }}>{error}</p>
            <button onClick={generateRecommendations} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', fontSize: '15px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>حاول مرة أخرى</button>
          </div>
        )}

        {results && !loading && (
          <>
            <div style={{ marginBottom: '48px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '36px', fontWeight: '300', marginBottom: '12px', color: '#111' }}>توصياتك الشخصية</h1>
              <p style={{ fontSize: '14px', color: '#888', fontWeight: '300' }}>بناءً على ملفك الأكاديمي وأهدافك</p>
            </div>

            {/* Language Warning */}
            {results.languageWarning && (
              <div style={{ background: '#fffbeb', border: '1px solid #f5e6b8', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '14px', color: '#92700c', lineHeight: '1.9' }}>{results.languageWarning}</p>
              </div>
            )}

            {/* Analysis */}
            {results.analysis && (
              <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '20px', padding: '28px', marginBottom: '40px', lineHeight: '2', fontSize: '15px', color: '#333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#666', fontSize: '13px' }}>
                  <Sparkles size={14} /><span>تحليل ملفك</span>
                </div>
                {results.analysis}
              </div>
            )}

            {/* Government Programs */}
            {results.programs?.length > 0 && (
              <section style={{ marginBottom: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid #eaeaea' }}>
                  <Award size={20} strokeWidth={1.5} /><h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', margin: 0 }}>البرامج الحكومية المناسبة لك</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {results.programs.map((p, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '500', color: '#111', marginBottom: '10px', marginTop: 0 }}>{p.name}</h3>
                      <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.9', marginBottom: '12px', fontWeight: '300' }}>{p.description}</p>
                      {p.eligibility && <div style={{ marginBottom: '10px' }}><span style={{ fontSize: '11px', color: '#999', display: 'block', marginBottom: '4px' }}>شروط الأهلية</span><p style={{ fontSize: '13px', color: '#444', lineHeight: '1.8', margin: 0 }}>{p.eligibility}</p></div>}
                      {p.fit && <div style={{ marginBottom: '16px', padding: '12px 14px', background: '#f7f7f7', borderRadius: '10px' }}><span style={{ fontSize: '11px', color: '#777', display: 'block', marginBottom: '3px' }}>لماذا يناسبك</span><p style={{ fontSize: '13px', color: '#333', margin: 0, lineHeight: '1.8' }}>{p.fit}</p></div>}
                      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#111', fontSize: '13px', fontWeight: '500', padding: '9px 16px', border: '1px solid #111', borderRadius: '999px', textDecoration: 'none' }}><span>{p.linkLabel || 'زيارة الموقع الرسمي'}</span><ExternalLink size={12} /></a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Universities */}
            {results.universities?.length > 0 && (
              <section style={{ marginBottom: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid #eaeaea' }}>
                  <GraduationCap size={20} strokeWidth={1.5} /><h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', margin: 0 }}>الجامعات الموصى بها</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {results.universities.map((u, i) => {
                    const isExpanded = expandedUni === i;
                    return (
                      <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '17px', fontWeight: '500', color: '#111', marginBottom: '3px', marginTop: 0 }}>{u.nameAr}</h3>
                            <p style={{ fontSize: '12px', color: '#888', margin: 0, direction: 'ltr', textAlign: 'right' }}>{u.nameEn}</p>
                          </div>
                          {u.tier && <span style={{ fontSize: '11px', padding: '5px 10px', background: '#111', color: '#fff', borderRadius: '999px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{u.tier}</span>}
                        </div>

                        {/* Location + Fit + Tags */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: '#666', fontSize: '13px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {u.country && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={12} /><span>{u.country}{u.city ? ` • ${u.city}` : ''}</span></div>}
                        </div>

                        {/* Weather, Safety, Fit tags */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          {u.fitLevel && <span style={{ fontSize: '11px', padding: '4px 10px', background: '#f7f7f7', borderRadius: '999px', color: '#444' }}>{u.fitLevel}</span>}
                          {u.weather && <span style={{ fontSize: '11px', padding: '4px 10px', background: '#f7f7f7', borderRadius: '999px', color: '#444' }}>{u.weather}</span>}
                          {u.safety && <span style={{ fontSize: '11px', padding: '4px 10px', background: '#f7f7f7', borderRadius: '999px', color: '#444' }}>{u.safety}</span>}
                        </div>

                        {/* AI Notes */}
                        {u.notes && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', marginBottom: '14px' }}>{u.notes}</p>}

                        {/* Muslim-friendly expandable */}
                        {u.muslimFriendly?.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <button onClick={() => setExpandedUni(isExpanded ? null : i)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                              <span>معلومات للمسلمين</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {isExpanded && (
                              <div style={{ marginTop: '8px', padding: '12px 14px', background: '#f9f9f9', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {u.muslimFriendly.map((mf, mi) => (
                                  <span key={mi} style={{ fontSize: '12px', color: '#555' }}>{mf}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {u.link && <a href={u.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', background: '#111', fontSize: '12px', padding: '9px 16px', borderRadius: '999px', textDecoration: 'none' }}><span>البحث عن البرنامج</span><ExternalLink size={11} /></a>}
                          {u.email && <a href={`mailto:${u.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#111', background: '#fff', fontSize: '12px', padding: '9px 16px', border: '1px solid #e5e5e5', borderRadius: '999px', direction: 'ltr', textDecoration: 'none' }}><Mail size={11} /><span>{u.email}</span></a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Requirements */}
            {results.requirements?.length > 0 && (
              <section style={{ marginBottom: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid #eaeaea' }}>
                  <FileText size={20} strokeWidth={1.5} /><h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', margin: 0 }}>المتطلبات الرسمية للدراسة بالخارج</h2>
                </div>
                <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px' }}>
                  <ul style={{ margin: 0, paddingInlineStart: '20px', lineHeight: '2.2', fontSize: '14px', color: '#444' }}>
                    {results.requirements.map((r, i) => <li key={i} style={{ marginBottom: '6px' }}>{r}</li>)}
                  </ul>
                </div>
              </section>
            )}

            {/* Next Steps */}
            {results.nextSteps?.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid #eaeaea' }}>
                  <ListChecks size={20} strokeWidth={1.5} /><h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', margin: 0 }}>خطوات عملية للأسابيع القادمة</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {results.nextSteps.map((s, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '14px', padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>{i + 1}</div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.9' }}>{s}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action Buttons */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '28px', borderTop: '1px solid #eaeaea' }}>
              <button onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', color: '#fff', border: 'none', padding: '13px 26px', fontSize: '14px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>
                <Printer size={13} /><span>طباعة النتائج</span>
              </button>
              <button onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#111', border: '1px solid #e5e5e5', padding: '13px 26px', fontSize: '14px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>
                <RotateCcw size={13} /><span>ابدأ من جديد</span>
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
    </div>
  );

  return null;
}
