import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Printer, RotateCcw, GraduationCap, Globe, Mail, ExternalLink, Award, Sparkles } from 'lucide-react';
import Head from 'next/head';

export default function Home() {
  const [screen, setScreen] = useState('landing');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    academicLevel: '', currentInstitution: '', gpa: '', gpaScale: '4',
    english: '', englishScore: '', field: '', degreeLevel: '',
    countries: '', budget: '', gender: '', goals: ''
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

  const questions = [
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
    { key: 'english', label: 'ما مستوى إتقانك للغة الإنجليزية؟', hint: 'إذا كان لديك شهادة رسمية، اختر نوعها', type: 'english' },
    { key: 'field', label: 'ما هو التخصص الذي ترغب بدراسته؟', hint: 'كن محدداً قدر الإمكان', type: 'text', placeholder: 'اكتب التخصص هنا' },
    { key: 'degreeLevel', label: 'ما هي الدرجة العلمية التي تسعى إليها؟', hint: 'اختر المرحلة القادمة', type: 'select',
      options: [
        { value: 'bachelor', label: 'بكالوريوس' },
        { value: 'master', label: 'ماجستير' },
        { value: 'phd', label: 'دكتوراه' },
        { value: 'diploma', label: 'دبلوم أو شهادة مهنية' }
      ]
    },
    { key: 'countries', label: 'ما هي الدول أو المناطق المفضلة لديك؟', hint: 'يمكنك ذكر أكثر من دولة', type: 'text', placeholder: 'مثال: الولايات المتحدة، المملكة المتحدة، كندا' },
    { key: 'budget', label: 'ما هي خطتك للتمويل؟', hint: 'هذا يساعدنا في ترشيح البرامج المناسبة', type: 'select',
      options: [
        { value: 'scholarship_only', label: 'أبحث عن ابتعاث حكومي فقط' },
        { value: 'scholarship_preferred', label: 'أفضل الابتعاث لكن مستعد للتمويل الذاتي' },
        { value: 'self_funded', label: 'تمويل ذاتي' },
        { value: 'undecided', label: 'لم أحدد بعد' }
      ]
    },
    { key: 'gender', label: 'الجنس', hint: 'بعض البرامج الحكومية لها شروط مرتبطة بالجنس', type: 'select',
      options: [
        { value: 'male', label: 'ذكر' },
        { value: 'female', label: 'أنثى' }
      ]
    },
    { key: 'goals', label: 'ما هي أهدافك المهنية بعد التخرج؟', hint: 'صف باختصار', type: 'textarea', placeholder: 'اكتب أهدافك هنا' }
  ];

  const currentQ = questions[step];
  const totalSteps = questions.length;

  const isStepValid = () => {
    if (currentQ.key === 'gpa') return answers.gpa && parseFloat(answers.gpa) > 0;
    if (currentQ.key === 'english') return answers.english !== '';
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

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
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
      countries: '', budget: '', gender: '', goals: ''
    });
    setResults(null);
    setError(null);
  };

  const handlePrint = () => window.print();

  const baseStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
    direction: 'rtl', minHeight: '100vh', background: '#fafafa', color: '#1a1a1a'
  };

  return (
    <>
      <Head>
        <title>مستشار الابتعاث</title>
        <meta name="description" content="رفيقك الذكي في رحلة الدراسة خارج المملكة" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {screen === 'landing' && (
        <div style={baseStyle}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: '#f0f0f0', borderRadius: '999px', marginBottom: '48px', fontSize: '13px', color: '#555' }}>
              <Sparkles size={14} />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
            <h1 style={{ fontSize: '56px', fontWeight: '300', letterSpacing: '-1px', marginBottom: '24px', lineHeight: '1.2', color: '#111' }}>مستشار الابتعاث</h1>
            <p style={{ fontSize: '19px', color: '#555', lineHeight: '2', marginBottom: '16px', fontWeight: '300' }}>رفيقك الذكي في رحلة الدراسة خارج المملكة</p>
            <p style={{ fontSize: '16px', color: '#777', lineHeight: '2', marginBottom: '64px', fontWeight: '300', maxWidth: '520px', margin: '0 auto 64px' }}>
              أجب عن بضعة أسئلة بسيطة، وسنرشح لك البرامج الحكومية السعودية المناسبة والجامعات العالمية التي تتوافق مع تخصصك وطموحاتك
            </p>
            <button onClick={() => setScreen('questionnaire')} style={{ background: '#111', color: '#fff', border: 'none', padding: '18px 48px', fontSize: '16px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>ابدأ الآن</button>
          </div>
        </div>
      )}

      {screen === 'questionnaire' && (() => {
        const progress = ((step + 1) / totalSteps) * 100;
        return (
          <div style={baseStyle}>
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 32px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '64px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: '#999' }}>
                  <span>السؤال {step + 1} من {totalSteps}</span>
                  <span>{Math.round(progress)}٪</span>
                </div>
                <div style={{ height: '2px', background: '#eaeaea', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: '#111', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '32px', fontWeight: '400', lineHeight: '1.4', marginBottom: '12px', color: '#111' }}>{currentQ.label}</h2>
                <p style={{ fontSize: '15px', color: '#888', marginBottom: '40px', fontWeight: '300' }}>{currentQ.hint}</p>

                {currentQ.type === 'select' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentQ.options.map((opt) => (
                      <button key={opt.value} onClick={() => setAnswers({ ...answers, [currentQ.key]: opt.value })}
                        style={{ textAlign: 'right', padding: '20px 24px', background: answers[currentQ.key] === opt.value ? '#111' : '#fff', color: answers[currentQ.key] === opt.value ? '#fff' : '#333', border: `1px solid ${answers[currentQ.key] === opt.value ? '#111' : '#e5e5e5'}`, borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'text' && (
                  <input type="text" value={answers[currentQ.key]} onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })} placeholder={currentQ.placeholder}
                    style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '17px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
                )}

                {currentQ.type === 'textarea' && (
                  <textarea value={answers[currentQ.key]} onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })} placeholder={currentQ.placeholder} rows={5}
                    style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', color: '#111', outline: 'none', resize: 'vertical', lineHeight: '1.8', boxSizing: 'border-box' }} />
                )}

                {currentQ.type === 'gpa' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['4', '5', '100'].map((scale) => (
                        <button key={scale} onClick={() => setAnswers({ ...answers, gpaScale: scale })}
                          style={{ flex: 1, padding: '14px', background: answers.gpaScale === scale ? '#111' : '#fff', color: answers.gpaScale === scale ? '#fff' : '#555', border: `1px solid ${answers.gpaScale === scale ? '#111' : '#e5e5e5'}`, borderRadius: '12px', fontSize: '15px', fontFamily: 'inherit', cursor: 'pointer' }}>من {scale}</button>
                      ))}
                    </div>
                    <input type="number" step="0.01" value={answers.gpa} onChange={(e) => setAnswers({ ...answers, gpa: e.target.value })} placeholder={`أدخل المعدل من ${answers.gpaScale}`}
                      style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '17px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}

                {currentQ.type === 'english' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { value: 'ielts', label: 'آيلتس (IELTS)' },
                      { value: 'toefl', label: 'توفل (TOEFL)' },
                      { value: 'step', label: 'اختبار ستيب (STEP)' },
                      { value: 'duolingo', label: 'دولينجو (Duolingo)' },
                      { value: 'intermediate', label: 'متوسط، لا يوجد شهادة' },
                      { value: 'beginner', label: 'مبتدئ' }
                    ].map((opt) => (
                      <button key={opt.value} onClick={() => setAnswers({ ...answers, english: opt.value })}
                        style={{ textAlign: 'right', padding: '20px 24px', background: answers.english === opt.value ? '#111' : '#fff', color: answers.english === opt.value ? '#fff' : '#333', border: `1px solid ${answers.english === opt.value ? '#111' : '#e5e5e5'}`, borderRadius: '14px', fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer' }}>{opt.label}</button>
                    ))}
                    {(answers.english === 'ielts' || answers.english === 'toefl' || answers.english === 'duolingo' || answers.english === 'step') && (
                      <input type="text" value={answers.englishScore} onChange={(e) => setAnswers({ ...answers, englishScore: e.target.value })} placeholder="أدخل درجتك"
                        style={{ width: '100%', padding: '20px 24px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', fontSize: '17px', fontFamily: 'inherit', color: '#111', outline: 'none', boxSizing: 'border-box', marginTop: '8px' }} />
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #eaeaea' }}>
                <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '15px', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowRight size={16} /><span>السابق</span>
                </button>
                <button onClick={handleNext} disabled={!isStepValid()} style={{ background: isStepValid() ? '#111' : '#d0d0d0', color: '#fff', border: 'none', padding: '16px 36px', fontSize: '15px', fontFamily: 'inherit', borderRadius: '999px', cursor: isStepValid() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{step === totalSteps - 1 ? 'احصل على التوصيات' : 'التالي'}</span>
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {screen === 'results' && (
        <div style={baseStyle}>
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '120px 0' }}>
                <div style={{ width: '48px', height: '48px', border: '2px solid #eaeaea', borderTop: '2px solid #111', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 32px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#111', marginBottom: '12px' }}>نحلل ملفك الآن</h2>
                <p style={{ fontSize: '15px', color: '#888', fontWeight: '300' }}>نختار لك أنسب البرامج الحكومية والجامعات العالمية</p>
              </div>
            )}

            {error && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '17px', color: '#b00', marginBottom: '32px' }}>{error}</p>
                <button onClick={generateRecommendations} style={{ background: '#111', color: '#fff', border: 'none', padding: '14px 32px', fontSize: '15px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>حاول مرة أخرى</button>
              </div>
            )}

            {results && !loading && (
              <>
                <div style={{ marginBottom: '56px', textAlign: 'center' }}>
                  <h1 style={{ fontSize: '40px', fontWeight: '300', marginBottom: '16px', color: '#111' }}>توصياتك الشخصية</h1>
                  <p style={{ fontSize: '15px', color: '#888', fontWeight: '300' }}>بناءً على ملفك الأكاديمي وأهدافك</p>
                </div>

                {results.analysis && (
                  <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '20px', padding: '32px', marginBottom: '48px', lineHeight: '2', fontSize: '15px', color: '#333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#666', fontSize: '13px' }}>
                      <Sparkles size={14} /><span>تحليل ملفك</span>
                    </div>
                    {results.analysis}
                  </div>
                )}

                <section style={{ marginBottom: '64px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #eaeaea' }}>
                    <Award size={22} strokeWidth={1.5} color="#111" />
                    <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#111', margin: 0 }}>البرامج الحكومية المناسبة لك</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {results.programs && results.programs.map((p, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '18px', padding: '28px' }}>
                        <h3 style={{ fontSize: '19px', fontWeight: '500', color: '#111', marginBottom: '12px', marginTop: 0 }}>{p.name}</h3>
                        <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.9', marginBottom: '16px', fontWeight: '300' }}>{p.description}</p>
                        {p.eligibility && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '6px' }}>شروط الأهلية</span>
                            <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.8', margin: 0, fontWeight: '300' }}>{p.eligibility}</p>
                          </div>
                        )}
                        {p.fit && (
                          <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#f7f7f7', borderRadius: '10px' }}>
                            <span style={{ fontSize: '12px', color: '#777', display: 'block', marginBottom: '4px' }}>لماذا يناسبك</span>
                            <p style={{ fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.8' }}>{p.fit}</p>
                          </div>
                        )}
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#111', fontSize: '14px', fontWeight: '500', padding: '10px 18px', border: '1px solid #111', borderRadius: '999px' }}>
                            <span>{p.linkLabel || 'زيارة الموقع الرسمي'}</span><ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section style={{ marginBottom: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #eaeaea' }}>
                    <GraduationCap size={22} strokeWidth={1.5} color="#111" />
                    <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#111', margin: 0 }}>الجامعات الموصى بها</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {results.universities && results.universities.map((u, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '18px', padding: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ fontSize: '19px', fontWeight: '500', color: '#111', marginBottom: '4px', marginTop: 0 }}>{u.nameAr}</h3>
                            <p style={{ fontSize: '13px', color: '#888', margin: 0, direction: 'ltr', textAlign: 'right', fontWeight: '300' }}>{u.nameEn}</p>
                          </div>
                          {u.tier && <span style={{ fontSize: '11px', padding: '6px 12px', background: '#111', color: '#fff', borderRadius: '999px' }}>{u.tier}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', flexWrap: 'wrap', color: '#666', fontSize: '13px' }}>
                          {u.country && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={13} /><span>{u.country}</span></div>}
                        </div>
                        {u.program && (
                          <div style={{ marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>البرنامج الأكاديمي</span>
                            <p style={{ fontSize: '15px', color: '#222', margin: 0 }}>{u.program}</p>
                          </div>
                        )}
                        {u.notes && <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', marginBottom: '20px' }}>{u.notes}</p>}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {u.link && (
                            <a href={u.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fff', background: '#111', fontSize: '13px', padding: '10px 18px', borderRadius: '999px' }}>
                              <span>صفحة البرنامج</span><ExternalLink size={12} />
                            </a>
                          )}
                          {u.email && (
                            <a href={`mailto:${u.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#111', background: '#fff', fontSize: '13px', padding: '10px 18px', border: '1px solid #e5e5e5', borderRadius: '999px', direction: 'ltr' }}>
                              <Mail size={12} /><span>{u.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '32px', borderTop: '1px solid #eaeaea' }}>
                  <button onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#111', color: '#fff', border: 'none', padding: '14px 28px', fontSize: '14px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>
                    <Printer size={14} /><span>طباعة النتائج</span>
                  </button>
                  <button onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#111', border: '1px solid #e5e5e5', padding: '14px 28px', fontSize: '14px', fontFamily: 'inherit', borderRadius: '999px', cursor: 'pointer' }}>
                    <RotateCcw size={14} /><span>ابدأ من جديد</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
        </div>
      )}
    </>
  );
}
