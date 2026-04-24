import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Printer, RotateCcw, GraduationCap, Globe, Mail, ExternalLink, Award, Sparkles, ListChecks, FileText } from 'lucide-react';
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

export default function Home() {
  const [screen, setScreen] = useState('landing');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    academicLevel: '', currentInstitution: '', gpa: '', gpaScale: '4',
    english: '', englishScore: '', field: '', degreeLevel: '',
    countries: [], budget: '', gender: '', mahram: '',
    passions: '', goals: ''
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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
    { key: 'passions', label: 'ما هي إنجازاتك وما الذي استمتعت به أكثر في دراستك؟', hint: 'حدثنا عن المشاريع أو المواد أو الأنشطة التي أحببتها', type: 'textarea', placeholder: 'مثال: شاركت في مسابقة روبوتات، أحببت مادة الدوائر الكهربائية...' },
    { key: 'goals', label: 'ما هي أهدافك المهنية بعد التخرج؟', hint: 'صف باختصار ما تطمح إليه', type: 'textarea', placeholder: 'اكتب أهدافك هنا' }
  ];

  const questions = baseQuestions.filter(q => !q.showIf || q.showIf(answers));
  const currentQ = questions[step];
  const totalSteps = questions.length;

  const isStepValid = () => {
    if (!currentQ) return false;
    if (currentQ.key === 'gpa') return answers.gpa && parseFloat(answers.gpa) > 0;
    if (currentQ.key === 'english') return answers.english !== '';
    if (currentQ.key === 'countries') return answers.countries && answers.countries.length > 0;
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

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, countriesText: selectedCountryLabels })
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
      countries: [], budget: '', gender: '', mahram: '',
      passions: '', goals: ''
    });
    setResults(null);
    setError(null);
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

  if (screen === 'landing') return (
    <div style={base}>
      <Head>
        <title>مستشار الابتعاث</title>
        <meta name="description" content="رفيقك الذكي في رحلة الدراسة خارج المملكة" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: '#f0f0f0', borderRadius: '999px', marginBottom: '48px', fontSize: '13px', color: '#555' }}>
          <Sparkles size={14} /><span>مدعوم بالذكاء الاصطناعي</span>
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '300', letterSpacing: '-1px', marginBottom: '24px', lineHeight: '1.2', color: '#111' }}>مستشار الابتعاث</h1>
        <p style={{ fontSize: '18px', color: '#555', lineHeight: '2', marginBottom: '16px', fontWeight: '300' }}>رفيقك الذكي في رحلة الدراسة خارج المملكة</p>
        <p style={{ fontSize: '15px', color: '#777', lineHeight: '2', marginBottom: '64px', fontWeight: '300', maxWidth: '500px', margin: '0 auto 64px' }}>
          أجب عن بضعة أسئلة، وسنرشح لك البرامج الحكومية السعودية المناسبة والجامعات العالمية التي تتوافق مع تخصصك وطموحاتك
        </p>
        <button onClick={() => setScreen('questionnaire')} style={{ background: '#111', color: '#fff', border: 'none', padding: '18px 48px', fontSize: '16px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>ابدأ الآن</button>
      </div>
    </div>
  );

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

            {currentQ.type === 'text' && (
              <input type="text" value={answers[currentQ.key]} onChange={e => setAnswers({ ...answers, [currentQ.key]: e.target.value })} placeholder={currentQ.placeholder}
                style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
            )}

            {currentQ.type === 'textarea' && (
              <textarea value={answers[currentQ.key]} onChange={e => setAnswers({ ...answers, [currentQ.key]: e.target.value })} placeholder={currentQ.placeholder} rows={5}
                style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '15px', fontFamily: 'inherit', color: '#111', outline: 'none', resize: 'vertical', lineHeight: '1.8', boxSizing: 'border-box' }} />
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

            {results.analysis && (
              <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '20px', padding: '28px', marginBottom: '40px', lineHeight: '2', fontSize: '15px', color: '#333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#666', fontSize: '13px' }}>
                  <Sparkles size={14} /><span>تحليل ملفك</span>
                </div>
                {results.analysis}
              </div>
            )}

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
                      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#111', fontSize: '13px', fontWeight: '500', padding: '9px 16px', border: '1px solid #111', borderRadius: '999px' }}><span>{p.linkLabel || 'زيارة الموقع الرسمي'}</span><ExternalLink size={12} /></a>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {results.universities?.length > 0 && (
              <section style={{ marginBottom: '56px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '14px', borderBottom: '1px solid #eaeaea' }}>
                  <GraduationCap size={20} strokeWidth={1.5} /><h2 style={{ fontSize: '22px', fontWeight: '400', color: '#111', margin: 0 }}>الجامعات الموصى بها</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {results.universities.map((u, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '16px', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '17px', fontWeight: '500', color: '#111', marginBottom: '3px', marginTop: 0 }}>{u.nameAr}</h3>
                          <p style={{ fontSize: '12px', color: '#888', margin: 0, direction: 'ltr', textAlign: 'right' }}>{u.nameEn}</p>
                        </div>
                        {u.tier && <span style={{ fontSize: '11px', padding: '5px 10px', background: '#111', color: '#fff', borderRadius: '999px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{u.tier}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', color: '#666', fontSize: '13px', flexWrap: 'wrap' }}>
                        {u.country && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={12} /><span>{u.country}{u.city ? ` — ${u.city}` : ''}</span></div>}
                      </div>
                      {u.fitLevel && <div style={{ marginBottom: '10px', padding: '8px 12px', background: '#f7f7f7', borderRadius: '8px', fontSize: '12px', color: '#444' }}>{u.fitLevel}</div>}
                      {u.notes && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', marginBottom: '16px' }}>{u.notes}</p>}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {u.link && <a href={u.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', background: '#111', fontSize: '12px', padding: '9px 16px', borderRadius: '999px' }}><span>البحث عن البرنامج</span><ExternalLink size={11} /></a>}
                        {u.email && <a href={`mailto:${u.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#111', background: '#fff', fontSize: '12px', padding: '9px 16px', border: '1px solid #e5e5e5', borderRadius: '999px', direction: 'ltr' }}><Mail size={11} /><span>{u.email}</span></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
