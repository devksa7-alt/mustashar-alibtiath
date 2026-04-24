import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import crypto from 'crypto';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, '1 d'),
  analytics: true
});

const SAUDI_PROGRAMS = [
  {
    name: 'برنامج خادم الحرمين الشريفين للابتعاث الخارجي',
    description: 'أكبر برامج الابتعاث الحكومي السعودي، يموّل الدراسة في الخارج شاملاً الرسوم الدراسية والمعيشة والسفر والتأمين الصحي',
    eligibility: 'خريج من جامعة سعودية معتمدة، معدل لا يقل عن 2.75 من 4 غالباً، قبول من جامعة معتمدة خارجياً، اجتياز اختبار لغة معتمد',
    applicable: ['bachelor_graduate', 'master_graduate', 'phd_student', 'master_student'],
    link: 'https://moe.gov.sa',
    linkLabel: 'وزارة التعليم السعودية'
  },
  {
    name: 'منصة هي للابتعاث - وزارة التعليم',
    description: 'البوابة الرسمية لجميع برامج الابتعاث الحكومية في التخصصات ذات الأولوية الوطنية',
    eligibility: 'التسجيل عبر المنصة الرسمية، استيفاء شروط المعدل والتخصص المعلَن، وجود قبول من جامعة معتمدة',
    applicable: ['bachelor_graduate', 'master_graduate', 'bachelor_student', 'master_student'],
    link: 'https://he.moe.gov.sa',
    linkLabel: 'منصة هي'
  },
  {
    name: 'برنامج أرامكو السعودية للتطوير والابتعاث',
    description: 'برامج تطوير وابتعاث من أرامكو لموظفيها والمرشحين في تخصصات الهندسة والطاقة والتقنية',
    eligibility: 'يُفضَّل أن يكون موظفاً أو مرشحاً، معدل جيد، مستوى لغة عالٍ، التخصص في مجال الطاقة أو الهندسة',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_graduate'],
    link: 'https://www.aramco.com/careers',
    linkLabel: 'أرامكو - الوظائف والتطوير'
  },
  {
    name: 'برنامج الابتعاث الصحي - وزارة الصحة',
    description: 'ابتعاث للتخصصات الطبية والصحية في أفضل الجامعات والمستشفيات العالمية',
    eligibility: 'خريج طب أو تخصص صحي، رخصة مزاولة، استيفاء متطلبات الهيئة السعودية للتخصصات الصحية',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate'],
    link: 'https://www.moh.gov.sa',
    linkLabel: 'وزارة الصحة السعودية'
  },
  {
    name: 'برامج الابتعاث لأعضاء هيئة التدريس في الجامعات السعودية',
    description: 'تبتعث الجامعات السعودية خريجيها المتميزين لإكمال الدراسات العليا والعودة للعمل أكاديمياً',
    eligibility: 'معدل تراكمي ممتاز، ترشيح من الجامعة، التزام بالعمل في الجامعة بعد العودة',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate'],
    link: 'https://moe.gov.sa',
    linkLabel: 'وزارة التعليم السعودية'
  },
  {
    name: 'برنامج ابتعاث سابك وشركات الطاقة والتقنية',
    description: 'سابك وACWA Power وSTC وغيرها تقدم برامج تطوير وابتعاث لكوادرها في تخصصات هندسية وتقنية',
    eligibility: 'التقدم للعمل في الشركة أولاً، معدل جيد، التخصص ذو صلة بنشاط الشركة',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_graduate'],
    link: 'https://www.sabic.com/en/careers',
    linkLabel: 'سابك - الوظائف'
  }
];

function filterPrograms(answers) {
  return SAUDI_PROGRAMS
    .filter(p => !p.applicable || p.applicable.includes(answers.academicLevel))
    .map(p => ({
      name: p.name,
      description: p.description,
      eligibility: p.eligibility,
      fit: `يناسب مستواك الأكاديمي الحالي وتخصصك في ${answers.field}`,
      link: p.link,
      linkLabel: p.linkLabel
    }));
}

function profileKey(answers) {
  const key = `${answers.academicLevel}|${Math.floor(parseFloat(answers.gpa || 0) * 2) / 2}|${answers.gpaScale}|${answers.english}|${(answers.field || '').toLowerCase().trim().substring(0, 30)}|${answers.degreeLevel}|${(answers.countries || '').toLowerCase().trim().substring(0, 30)}|${answers.budget}|${answers.gender}`;
  return 'rec:' + crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({ error: 'لقد تجاوزت الحد اليومي للاستفسارات. حاول مرة أخرى غداً.' });
    }

    const answers = req.body;
    if (!answers || !answers.field || !answers.academicLevel) {
      return res.status(400).json({ error: 'بيانات ناقصة' });
    }

    const cacheKey = profileKey(answers);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const programs = filterPrograms(answers);

    const prompt = `أنت مستشار ابتعاث للطلاب السعوديين. بناءً على البيانات التالية، قدم تحليلاً موجزاً وترشيح جامعات عالمية.

بيانات الطالب:
- المستوى: ${answers.academicLevel}
- الجامعة الحالية: ${answers.currentInstitution}
- المعدل: ${answers.gpa} من ${answers.gpaScale}
- الإنجليزية: ${answers.english}${answers.englishScore ? ' (' + answers.englishScore + ')' : ''}
- التخصص المرغوب: ${answers.field}
- الدرجة: ${answers.degreeLevel}
- الدول: ${answers.countries}
- التمويل: ${answers.budget}
- الجنس: ${answers.gender}
- الأهداف: ${answers.goals}

مهمتك:
1. تحليل موجز لملف الطالب (فقرة واحدة).
2. ترشيح 5 جامعات عالمية مناسبة لتخصصه ومستواه مع: الاسم بالعربية والإنجليزية، الدولة، اسم البرنامج الأكاديمي، التصنيف (عالمي ممتاز/ممتاز/جيد جداً/جيد)، البريد الرسمي للقبول، رابط البرنامج، وملاحظة موجزة.

أرجع JSON صالح فقط، بدون أي نص أو markdown. ابدأ بـ { وانتهِ بـ }:
{
  "analysis": "فقرة تحليل",
  "universities": [
    {"nameAr":"","nameEn":"","country":"","program":"","tier":"","email":"","link":"","notes":""}
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    let jsonStr = text.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    const aiResult = JSON.parse(jsonStr);

    const finalResult = {
      analysis: aiResult.analysis || '',
      programs: programs,
      universities: aiResult.universities || []
    };

    await redis.set(cacheKey, JSON.stringify(finalResult), { ex: 60 * 60 * 24 * 30 });

    return res.status(200).json(finalResult);
  } catch (err) {
    console.error('Recommend error:', err);
    return res.status(500).json({ error: 'حدث خطأ في المعالجة. حاول مرة أخرى.' });
  }
}
