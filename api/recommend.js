import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import crypto from 'crypto';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(6, '1 d'),
  analytics: true
});

// ============ FIELD CATEGORIZATION ============
function categorizeField(fieldText) {
  const t = (fieldText || '').toLowerCase();
  const categories = [];
  if (/eng|هندس|كهرب|ميكانيك|مدني|صناعي|بترول|نفط|كيميائ|طيران|بيئة|معمار|عمارة/.test(t)) categories.push('engineering');
  if (/med|طب|صحة|صيدل|تمريض|علاج|dental|أسنان|بصر|nurs|pharma|physiotherap|علوم صحية/.test(t)) categories.push('medical');
  if (/business|إدارة|أعمال|مال|محاسب|اقتصاد|تسويق|finance|mba|marketing|تمويل|موارد بشرية/.test(t)) categories.push('business');
  if (/comput|حاسب|برمجة|software|ذكاء اصطناعي|ai|data|بيانات|سيبراني|cyber|شبكات|تقنية معلومات|information tech/.test(t)) categories.push('cs');
  if (/law|قانون|حقوق|شريعة|legal/.test(t)) categories.push('law');
  if (/education|تعليم|تربية|teach|منهج|مناهج/.test(t)) categories.push('education');
  if (/science|فيزياء|كيمياء|أحياء|رياضيات|math|physics|biology|chemistry|علوم/.test(t)) categories.push('science');
  if (/art|design|فنون|تصميم|media|إعلام|architecture/.test(t)) categories.push('arts');
  if (/social|اجتماع|نفس|psych|علوم سياسية|political|international relations|علاقات دولية/.test(t)) categories.push('social');
  if (categories.length === 0) categories.push('general');
  return categories;
}

// ============ SAUDI GOVERNMENT PROGRAMS ============
const SAUDI_PROGRAMS = [
  {
    name: 'مسار الرواد',
    description: 'يهدف لابتعاث الطلاب لأفضل 30 مؤسسة تعليمية في العالم لمراحل البكالوريوس والماجستير. يغطي الرسوم الدراسية والمعيشة والتأمين الصحي والسفر.',
    eligibility: 'قبول نهائي غير مشروط من إحدى أفضل 30 جامعة في قائمة البرنامج، معدل أكاديمي ممتاز، اجتياز متطلبات اللغة، سعودي الجنسية.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student'],
    fields: ['all'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-arruaad/',
    linkLabel: 'مسار الرواد'
  },
  {
    name: 'مسار التميز',
    description: 'ابتعاث إلى أفضل 50 جامعة عالمياً في التخصصات ذات الأولوية لتحقيق رؤية المملكة 2030.',
    eligibility: 'قبول من جامعة ضمن قائمة البرنامج، معدل تراكمي مرتفع، إتقان اللغة الإنجليزية، بطاقة هوية سارية وجواز سفر.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student', 'master_graduate'],
    fields: ['all'],
    link: 'https://moe.gov.sa/ar/knowledgecenter/eservices/Pages/ksp.aspx',
    linkLabel: 'التقديم على مسار التميز'
  },
  {
    name: 'مسار إمداد',
    description: 'ابتعاث في أفضل 200 جامعة ومعهد حول العالم في مجالات ذات احتياج عالٍ في سوق العمل، لمرحلتي البكالوريوس والماجستير.',
    eligibility: 'قبول نهائي غير مشروط من جامعة ضمن قائمة البرنامج. في الدول غير الناطقة بالإنجليزية يمكن أن يكون القبول مشروطاً بدراسة لغة البلد.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student'],
    fields: ['engineering', 'medical', 'cs', 'business', 'science'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-emdad/',
    linkLabel: 'مسار إمداد'
  },
  {
    name: 'مسار واعد',
    description: 'ابتعاث مبتدئ بالتوظيف مع شركات سعودية كبرى يضمن الوظيفة بعد التخرج.',
    eligibility: 'معدل الثانوية لا يقل عن 80٪، اجتياز معايير الشركة الراعية، الالتزام بالعمل لديها بعد التخرج.',
    applicable: ['highschool'],
    fields: ['all'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-waaid/',
    linkLabel: 'مسار واعد'
  },
  {
    name: 'برنامج أرامكو للابتعاث (CDPNE)',
    description: 'برنامج ابتعاث أرامكو لخريجي الثانوية للدراسة في أفضل الجامعات العالمية في تخصصات يحتاجها القطاع. يضمن التوظيف في أرامكو بعد التخرج.',
    eligibility: 'طالب سنة ثالثة ثانوية (مسار علمي/عام/حاسب وهندسة/صحي)، معدل 85٪ فأعلى، درجة قدرات 90٪ فأعلى، اجتياز اختبارات الشركة.',
    applicable: ['highschool'],
    fields: ['engineering', 'cs', 'science'],
    link: 'https://www.aramco.com/en/careers/for-saudi-applicants/student-opportunities/college-degree-program',
    linkLabel: 'برنامج أرامكو CDPNE'
  },
  {
    name: 'برنامج منح سابك (SABIC)',
    description: 'ابتعاث طلاب الثانوية المتفوقين لدراسة البكالوريوس في تخصصات هندسية وكيميائية تخدم قطاع سابك.',
    eligibility: 'سعودي الجنسية، العمر أقل من 20 سنة، معدل ثانوية 90٪ فأعلى، 85 فأعلى في الرياضيات والفيزياء والكيمياء والإنجليزي، قدرات 80 فأعلى.',
    applicable: ['highschool'],
    fields: ['engineering', 'science'],
    link: 'https://www.sabic.com/en/careers/middle-east-africa/students-and-fresh-graduates',
    linkLabel: 'منح سابك'
  },
  {
    name: 'برنامج كاوست للطلاب الموهوبين (KGSP)',
    description: 'ابتعاث لدراسة البكالوريوس في تخصصات STEM في أفضل الجامعات الأمريكية، مع إكمال الماجستير لاحقاً في كاوست.',
    eligibility: 'ترشيح من موهبة، درجات قدرات وتحصيلي عالية، درجة SAT جيدة، اجتياز المقابلات، اهتمام بالعلوم والتقنية.',
    applicable: ['highschool'],
    fields: ['engineering', 'cs', 'science'],
    link: 'https://kgsp.kaust.edu.sa/',
    linkLabel: 'برنامج كاوست'
  },
  {
    name: 'برنامج الابتعاث الصحي',
    description: 'ابتعاث للتخصصات الصحية والطبية والزمالات في أفضل المستشفيات والجامعات العالمية.',
    eligibility: 'خريج طب أو تخصص صحي، رخصة مزاولة، استيفاء متطلبات الهيئة السعودية للتخصصات الصحية.',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate'],
    fields: ['medical'],
    link: 'https://www.moh.gov.sa',
    linkLabel: 'وزارة الصحة'
  },
  {
    name: 'زمالة مسك (Misk Fellowship)',
    description: 'برنامج تطوير القيادات الشابة السعودية لمدة 6 أشهر في جامعات عالمية، مع تأهيل ريادي وقيادي.',
    eligibility: 'خريج جامعي شاب، إتقان الإنجليزية، دافع قيادي قوي، اجتياز عملية اختيار تنافسية.',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate'],
    fields: ['all'],
    link: 'https://misk.org.sa',
    linkLabel: 'مؤسسة مسك'
  },
  {
    name: 'ابتعاث أعضاء هيئة التدريس',
    description: 'تبتعث الجامعات السعودية خريجيها المتميزين لإكمال الدراسات العليا والعودة للتدريس.',
    eligibility: 'معدل تراكمي ممتاز، ترشيح من الجامعة، الالتزام بالعمل فيها لعدد سنوات بعد العودة.',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate', 'phd_student'],
    fields: ['all'],
    link: 'https://moe.gov.sa',
    linkLabel: 'وزارة التعليم'
  },
  {
    name: 'الملحقية الثقافية السعودية (SACM)',
    description: 'الجهة الرسمية التي ترعى الطلاب المبتعثين أثناء دراستهم في الخارج، تقدم الضمان المالي والمتابعة الأكاديمية.',
    eligibility: 'طالب مبتعث من برنامج حكومي أو يملك قبولاً في جامعة معتمدة، تسجيل في نظام سفير.',
    applicable: ['highschool', 'bachelor_student', 'bachelor_graduate', 'master_student', 'master_graduate', 'phd_student'],
    fields: ['all'],
    link: 'https://www.sacm.org/',
    linkLabel: 'الملحقية الثقافية'
  }
];

// ============ UNIVERSITY DATABASE ============
// Tiers: 1=Elite (GPA 3.7+), 2=Strong (GPA 3.3+), 3=Accessible (GPA 2.7+)
// Weather: 'hot', 'moderate', 'cold', 'mixed'
// Safety: 'very_safe', 'safe', 'moderate'
// Muslim-friendly: halal (easy/moderate/limited), mosque (on_campus/nearby/limited), saudiCommunity (large/medium/small), prayerRoom (yes/no/unknown)
const UNIVERSITIES = [
  // ==================== USA (32) ====================
  // Tier 1 (8)
  { nameAr: 'معهد ماساتشوستس للتكنولوجيا', nameEn: 'Massachusetts Institute of Technology (MIT)', country: 'الولايات المتحدة', city: 'Cambridge, MA', tier: 1, minGpa: 3.8, fields: ['engineering', 'cs', 'science', 'business'], email: 'admissions@mit.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ستانفورد', nameEn: 'Stanford University', country: 'الولايات المتحدة', city: 'Stanford, CA', tier: 1, minGpa: 3.8, fields: ['engineering', 'cs', 'business', 'medical', 'law'], email: 'admission@stanford.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة هارفارد', nameEn: 'Harvard University', country: 'الولايات المتحدة', city: 'Cambridge, MA', tier: 1, minGpa: 3.8, fields: ['business', 'law', 'medical', 'social', 'science'], email: 'college@fas.harvard.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كاليفورنيا بيركلي', nameEn: 'University of California, Berkeley', country: 'الولايات المتحدة', city: 'Berkeley, CA', tier: 1, minGpa: 3.7, fields: ['engineering', 'cs', 'business', 'science'], email: 'admissions@berkeley.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كارنيجي ميلون', nameEn: 'Carnegie Mellon University', country: 'الولايات المتحدة', city: 'Pittsburgh, PA', tier: 1, minGpa: 3.7, fields: ['cs', 'engineering', 'arts', 'business'], email: 'admission@andrew.cmu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة جونز هوبكنز', nameEn: 'Johns Hopkins University', country: 'الولايات المتحدة', city: 'Baltimore, MD', tier: 1, minGpa: 3.7, fields: ['medical', 'science', 'engineering', 'social'], email: 'gotojhu@jhu.edu', weather: 'mixed', safety: 'moderate', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كولومبيا', nameEn: 'Columbia University', country: 'الولايات المتحدة', city: 'New York, NY', tier: 1, minGpa: 3.8, fields: ['business', 'law', 'engineering', 'social', 'arts'], email: 'ugrad-ask@columbia.edu', weather: 'mixed', safety: 'moderate', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'معهد كاليفورنيا للتكنولوجيا', nameEn: 'California Institute of Technology (Caltech)', country: 'الولايات المتحدة', city: 'Pasadena, CA', tier: 1, minGpa: 3.9, fields: ['engineering', 'science', 'cs'], email: 'admissions@caltech.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  // Tier 2 (12)
  { nameAr: 'جامعة بيردو', nameEn: 'Purdue University', country: 'الولايات المتحدة', city: 'West Lafayette, IN', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'science', 'business'], email: 'admissions@purdue.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة واشنطن', nameEn: 'University of Washington', country: 'الولايات المتحدة', city: 'Seattle, WA', tier: 2, minGpa: 3.3, fields: ['cs', 'engineering', 'medical', 'business'], email: 'askuwadm@uw.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة بنسلفانيا ستيت', nameEn: 'Pennsylvania State University', country: 'الولايات المتحدة', city: 'University Park, PA', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'science', 'social'], email: 'admissions@psu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تكساس أوستن', nameEn: 'University of Texas at Austin', country: 'الولايات المتحدة', city: 'Austin, TX', tier: 2, minGpa: 3.4, fields: ['engineering', 'cs', 'business', 'social'], email: 'admissions@utexas.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ولاية أوهايو', nameEn: 'Ohio State University', country: 'الولايات المتحدة', city: 'Columbus, OH', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'social'], email: 'askabuckeye@osu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ميشيغان ستيت', nameEn: 'Michigan State University', country: 'الولايات المتحدة', city: 'East Lansing, MI', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'education', 'medical'], email: 'admissions@msu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة فلوريدا', nameEn: 'University of Florida', country: 'الولايات المتحدة', city: 'Gainesville, FL', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'science'], email: 'admissions@ufl.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة مينيسوتا', nameEn: 'University of Minnesota', country: 'الولايات المتحدة', city: 'Minneapolis, MN', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'science'], email: 'admissions@umn.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة بوسطن', nameEn: 'Boston University', country: 'الولايات المتحدة', city: 'Boston, MA', tier: 2, minGpa: 3.4, fields: ['engineering', 'business', 'arts', 'medical'], email: 'admissions@bu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة نورث إيسترن', nameEn: 'Northeastern University', country: 'الولايات المتحدة', city: 'Boston, MA', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'business'], email: 'admissions@northeastern.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تكساس إي أند أم', nameEn: 'Texas A&M University', country: 'الولايات المتحدة', city: 'College Station, TX', tier: 2, minGpa: 3.3, fields: ['engineering', 'science', 'business', 'cs'], email: 'admissions@tamu.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة فرجينيا تك', nameEn: 'Virginia Tech', country: 'الولايات المتحدة', city: 'Blacksburg, VA', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'science', 'business'], email: 'admissions@vt.edu', weather: 'mixed', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  // Tier 3 (12)
  { nameAr: 'جامعة ولاية أريزونا', nameEn: 'Arizona State University', country: 'الولايات المتحدة', city: 'Tempe, AZ', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'cs', 'arts'], email: 'admissions@asu.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ولاية أوريغون', nameEn: 'Oregon State University', country: 'الولايات المتحدة', city: 'Corvallis, OR', tier: 3, minGpa: 2.8, fields: ['engineering', 'science', 'business'], email: 'osuadmit@oregonstate.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة جنوب فلوريدا', nameEn: 'University of South Florida', country: 'الولايات المتحدة', city: 'Tampa, FL', tier: 3, minGpa: 2.8, fields: ['engineering', 'medical', 'business'], email: 'admissions@usf.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة وست فرجينيا', nameEn: 'West Virginia University', country: 'الولايات المتحدة', city: 'Morgantown, WV', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'medical'], email: 'go2wvu@mail.wvu.edu', weather: 'mixed', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة ولاية واشنطن', nameEn: 'Washington State University', country: 'الولايات المتحدة', city: 'Pullman, WA', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'science'], email: 'admissions@wsu.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أركنساس', nameEn: 'University of Arkansas', country: 'الولايات المتحدة', city: 'Fayetteville, AR', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'uofa@uark.edu', weather: 'mixed', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة كنتاكي', nameEn: 'University of Kentucky', country: 'الولايات المتحدة', city: 'Lexington, KY', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'admission@uky.edu', weather: 'mixed', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كولورادو ستيت', nameEn: 'Colorado State University', country: 'الولايات المتحدة', city: 'Fort Collins, CO', tier: 3, minGpa: 2.9, fields: ['engineering', 'science', 'business'], email: 'admissions@colostate.edu', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سنترال فلوريدا', nameEn: 'University of Central Florida', country: 'الولايات المتحدة', city: 'Orlando, FL', tier: 3, minGpa: 2.8, fields: ['engineering', 'cs', 'business', 'arts'], email: 'admission@ucf.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة هيوستن', nameEn: 'University of Houston', country: 'الولايات المتحدة', city: 'Houston, TX', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'cs', 'medical'], email: 'admissions@uh.edu', weather: 'hot', safety: 'moderate', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سان دييغو ستيت', nameEn: 'San Diego State University', country: 'الولايات المتحدة', city: 'San Diego, CA', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'arts', 'social'], email: 'admissions@sdsu.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة جورج ميسون', nameEn: 'George Mason University', country: 'الولايات المتحدة', city: 'Fairfax, VA', tier: 3, minGpa: 2.8, fields: ['cs', 'business', 'engineering', 'social'], email: 'admissions@gmu.edu', weather: 'mixed', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },

  // ==================== UK (30) ====================
  // Tier 1 (8)
  { nameAr: 'جامعة أكسفورد', nameEn: 'University of Oxford', country: 'المملكة المتحدة', city: 'Oxford, England', tier: 1, minGpa: 3.8, fields: ['all'], email: 'undergraduate.admissions@admin.ox.ac.uk', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كامبريدج', nameEn: 'University of Cambridge', country: 'المملكة المتحدة', city: 'Cambridge, England', tier: 1, minGpa: 3.8, fields: ['all'], email: 'admissions@cam.ac.uk', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'إمبريال كوليدج لندن', nameEn: 'Imperial College London', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['engineering', 'cs', 'medical', 'science', 'business'], email: 'admissions@imperial.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'يونيفرستي كوليدج لندن', nameEn: 'University College London (UCL)', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['all'], email: 'admissions@ucl.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'مدرسة لندن للاقتصاد', nameEn: 'London School of Economics (LSE)', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['business', 'social', 'law'], email: 'ug-admissions@lse.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة إدنبرة', nameEn: 'University of Edinburgh', country: 'المملكة المتحدة', city: 'Edinburgh, Scotland', tier: 1, minGpa: 3.6, fields: ['all'], email: 'futurestudents@ed.ac.uk', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سانت أندروز', nameEn: 'University of St Andrews', country: 'المملكة المتحدة', city: 'St Andrews, Scotland', tier: 1, minGpa: 3.7, fields: ['science', 'social', 'arts', 'business'], email: 'admissions@st-andrews.ac.uk', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة دورهام', nameEn: 'Durham University', country: 'المملكة المتحدة', city: 'Durham, England', tier: 1, minGpa: 3.6, fields: ['business', 'science', 'social', 'law'], email: 'admissions@durham.ac.uk', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 2 (12)
  { nameAr: 'جامعة مانشستر', nameEn: 'University of Manchester', country: 'المملكة المتحدة', city: 'Manchester, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'cs'], email: 'ug-admissions@manchester.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'كينغز كوليدج لندن', nameEn: "King's College London", country: 'المملكة المتحدة', city: 'London, England', tier: 2, minGpa: 3.4, fields: ['medical', 'law', 'social', 'business'], email: 'ug-admissions@kcl.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة بريستول', nameEn: 'University of Bristol', country: 'المملكة المتحدة', city: 'Bristol, England', tier: 2, minGpa: 3.4, fields: ['engineering', 'medical', 'science', 'social'], email: 'ug-admissions@bristol.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة وارويك', nameEn: 'University of Warwick', country: 'المملكة المتحدة', city: 'Coventry, England', tier: 2, minGpa: 3.4, fields: ['business', 'engineering', 'cs', 'social'], email: 'ugadmissions@warwick.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة غلاسكو', nameEn: 'University of Glasgow', country: 'المملكة المتحدة', city: 'Glasgow, Scotland', tier: 2, minGpa: 3.3, fields: ['medical', 'engineering', 'business', 'arts'], email: 'ug-admissions@glasgow.ac.uk', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كارديف', nameEn: 'Cardiff University', country: 'المملكة المتحدة', city: 'Cardiff, Wales', tier: 2, minGpa: 3.2, fields: ['engineering', 'medical', 'business', 'social'], email: 'admissions@cardiff.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ليدز', nameEn: 'University of Leeds', country: 'المملكة المتحدة', city: 'Leeds, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'arts'], email: 'admissions@leeds.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة شيفيلد', nameEn: 'University of Sheffield', country: 'المملكة المتحدة', city: 'Sheffield, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'ug-admissions@sheffield.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة نوتنغهام', nameEn: 'University of Nottingham', country: 'المملكة المتحدة', city: 'Nottingham, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'undergraduate-enquiries@nottingham.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة برمنغهام', nameEn: 'University of Birmingham', country: 'المملكة المتحدة', city: 'Birmingham, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'social'], email: 'admissions@contacts.bham.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة إكستر', nameEn: 'University of Exeter', country: 'المملكة المتحدة', city: 'Exeter, England', tier: 2, minGpa: 3.3, fields: ['business', 'science', 'social', 'engineering'], email: 'admissions@exeter.ac.uk', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة باث', nameEn: 'University of Bath', country: 'المملكة المتحدة', city: 'Bath, England', tier: 2, minGpa: 3.4, fields: ['engineering', 'business', 'science', 'social'], email: 'admissions@bath.ac.uk', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 3 (10)
  { nameAr: 'جامعة سوانزي', nameEn: 'Swansea University', country: 'المملكة المتحدة', city: 'Swansea, Wales', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'admissions@swansea.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أبردين', nameEn: 'University of Aberdeen', country: 'المملكة المتحدة', city: 'Aberdeen, Scotland', tier: 3, minGpa: 2.8, fields: ['engineering', 'medical', 'business'], email: 'sras@abdn.ac.uk', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كوفنتري', nameEn: 'Coventry University', country: 'المملكة المتحدة', city: 'Coventry, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'arts'], email: 'studentenquiries@coventry.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة بورتسموث', nameEn: 'University of Portsmouth', country: 'المملكة المتحدة', city: 'Portsmouth, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'social'], email: 'admissions@port.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كوينز بلفاست', nameEn: "Queen's University Belfast", country: 'المملكة المتحدة', city: 'Belfast, Northern Ireland', tier: 3, minGpa: 2.8, fields: ['engineering', 'medical', 'business', 'law'], email: 'admissions@qub.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة دندي', nameEn: 'University of Dundee', country: 'المملكة المتحدة', city: 'Dundee, Scotland', tier: 3, minGpa: 2.7, fields: ['medical', 'science', 'business', 'arts'], email: 'contactus@dundee.ac.uk', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة نورثمبريا', nameEn: 'Northumbria University', country: 'المملكة المتحدة', city: 'Newcastle, England', tier: 3, minGpa: 2.7, fields: ['business', 'engineering', 'arts', 'cs'], email: 'admissions@northumbria.ac.uk', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة هدرسفيلد', nameEn: 'University of Huddersfield', country: 'المملكة المتحدة', city: 'Huddersfield, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education', 'science'], email: 'admissions@hud.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تيسايد', nameEn: 'Teesside University', country: 'المملكة المتحدة', city: 'Middlesbrough, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'cs', 'business'], email: 'registry@tees.ac.uk', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ديربي', nameEn: 'University of Derby', country: 'المملكة المتحدة', city: 'Derby, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'askadmissions@derby.ac.uk', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },

  // ==================== CANADA (21) ====================
  // Tier 1 (5)
  { nameAr: 'جامعة تورنتو', nameEn: 'University of Toronto', country: 'كندا', city: 'Toronto, ON', tier: 1, minGpa: 3.7, fields: ['all'], email: 'ask.admissions@utoronto.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ماكغيل', nameEn: 'McGill University', country: 'كندا', city: 'Montreal, QC', tier: 1, minGpa: 3.7, fields: ['all'], email: 'admissions@mcgill.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة بريتش كولومبيا', nameEn: 'University of British Columbia', country: 'كندا', city: 'Vancouver, BC', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international.inquiry@ubc.ca', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة واترلو', nameEn: 'University of Waterloo', country: 'كندا', city: 'Waterloo, ON', tier: 1, minGpa: 3.6, fields: ['engineering', 'cs', 'science'], email: 'myapplication@uwaterloo.ca', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ألبرتا', nameEn: 'University of Alberta', country: 'كندا', city: 'Edmonton, AB', tier: 1, minGpa: 3.5, fields: ['engineering', 'medical', 'business', 'science'], email: 'beabear@ualberta.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  // Tier 2 (8)
  { nameAr: 'جامعة كالغاري', nameEn: 'University of Calgary', country: 'كندا', city: 'Calgary, AB', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical'], email: 'futurestudents@ucalgary.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أوتاوا', nameEn: 'University of Ottawa', country: 'كندا', city: 'Ottawa, ON', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'law', 'business'], email: 'admission@uottawa.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ماكماستر', nameEn: 'McMaster University', country: 'كندا', city: 'Hamilton, ON', tier: 2, minGpa: 3.4, fields: ['engineering', 'medical', 'business'], email: 'macask@mcmaster.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كوينز', nameEn: "Queen's University", country: 'كندا', city: 'Kingston, ON', tier: 2, minGpa: 3.4, fields: ['business', 'engineering', 'medical'], email: 'admission@queensu.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ويسترن أونتاريو', nameEn: 'Western University', country: 'كندا', city: 'London, ON', tier: 2, minGpa: 3.3, fields: ['business', 'medical', 'engineering'], email: 'welcome@uwo.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سايمون فريزر', nameEn: 'Simon Fraser University', country: 'كندا', city: 'Burnaby, BC', tier: 2, minGpa: 3.3, fields: ['cs', 'business', 'engineering', 'social'], email: 'international@sfu.ca', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة يورك', nameEn: 'York University', country: 'كندا', city: 'Toronto, ON', tier: 2, minGpa: 3.2, fields: ['business', 'social', 'arts', 'cs'], email: 'international@yorku.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة مانيتوبا', nameEn: 'University of Manitoba', country: 'كندا', city: 'Winnipeg, MB', tier: 2, minGpa: 3.2, fields: ['engineering', 'business', 'medical', 'science'], email: 'international@umanitoba.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 3 (8)
  { nameAr: 'جامعة كارلتون', nameEn: 'Carleton University', country: 'كندا', city: 'Ottawa, ON', tier: 3, minGpa: 2.8, fields: ['engineering', 'cs', 'business'], email: 'admissions@carleton.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كونكورديا', nameEn: 'Concordia University', country: 'كندا', city: 'Montreal, QC', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'arts', 'cs'], email: 'international@concordia.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة فيكتوريا', nameEn: 'University of Victoria', country: 'كندا', city: 'Victoria, BC', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'science', 'social'], email: 'international@uvic.ca', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ريجاينا', nameEn: 'University of Regina', country: 'كندا', city: 'Regina, SK', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'admissions.office@uregina.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ونزور', nameEn: 'University of Windsor', country: 'كندا', city: 'Windsor, ON', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'askuw@uwindsor.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ليكهيد', nameEn: 'Lakehead University', country: 'كندا', city: 'Thunder Bay, ON', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'admissions@lakeheadu.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة برانسوك الجديدة', nameEn: 'University of New Brunswick', country: 'كندا', city: 'Fredericton, NB', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'science'], email: 'admissions@unb.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ميموريال في نيوفاوندلاند', nameEn: 'Memorial University of Newfoundland', country: 'كندا', city: "St. John's, NL", tier: 3, minGpa: 2.7, fields: ['engineering', 'medical', 'business'], email: 'reghelp@mun.ca', weather: 'cold', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },

  // ==================== AUSTRALIA (21) ====================
  // Tier 1 (5)
  { nameAr: 'جامعة ملبورن', nameEn: 'University of Melbourne', country: 'أستراليا', city: 'Melbourne, VIC', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international@unimelb.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'الجامعة الوطنية الأسترالية', nameEn: 'Australian National University', country: 'أستراليا', city: 'Canberra, ACT', tier: 1, minGpa: 3.6, fields: ['all'], email: 'admissions@anu.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سيدني', nameEn: 'University of Sydney', country: 'أستراليا', city: 'Sydney, NSW', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international.admissions@sydney.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة نيو ساوث ويلز', nameEn: 'University of New South Wales (UNSW)', country: 'أستراليا', city: 'Sydney, NSW', tier: 1, minGpa: 3.6, fields: ['engineering', 'business', 'medical', 'cs'], email: 'intl.admissions@unsw.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة موناش', nameEn: 'Monash University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 1, minGpa: 3.5, fields: ['engineering', 'business', 'medical', 'law'], email: 'international@monash.edu', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  // Tier 2 (8)
  { nameAr: 'جامعة كوينزلاند', nameEn: 'University of Queensland', country: 'أستراليا', city: 'Brisbane, QLD', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'science'], email: 'international@uq.edu.au', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة غرب أستراليا', nameEn: 'University of Western Australia', country: 'أستراليا', city: 'Perth, WA', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'askuwa@uwa.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أديلايد', nameEn: 'University of Adelaide', country: 'أستراليا', city: 'Adelaide, SA', tier: 2, minGpa: 3.2, fields: ['engineering', 'medical', 'business', 'science'], email: 'international@adelaide.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تكنولوجيا كوينزلاند', nameEn: 'Queensland University of Technology', country: 'أستراليا', city: 'Brisbane, QLD', tier: 2, minGpa: 3.2, fields: ['engineering', 'business', 'cs', 'arts'], email: 'international@qut.edu.au', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تكنولوجيا سيدني', nameEn: 'University of Technology Sydney (UTS)', country: 'أستراليا', city: 'Sydney, NSW', tier: 2, minGpa: 3.2, fields: ['engineering', 'business', 'cs', 'arts'], email: 'international@uts.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة آر إم آي تي', nameEn: 'RMIT University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 2, minGpa: 3.1, fields: ['engineering', 'cs', 'business', 'arts'], email: 'international@rmit.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ماكواري', nameEn: 'Macquarie University', country: 'أستراليا', city: 'Sydney, NSW', tier: 2, minGpa: 3.1, fields: ['business', 'cs', 'arts', 'social'], email: 'study@mq.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة لا تروب', nameEn: 'La Trobe University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 2, minGpa: 3.0, fields: ['business', 'medical', 'science', 'social'], email: 'international@latrobe.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  // Tier 3 (8)
  { nameAr: 'جامعة غريفيث', nameEn: 'Griffith University', country: 'أستراليا', city: 'Brisbane, QLD', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'medical', 'arts'], email: 'international@griffith.edu.au', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ديكن', nameEn: 'Deakin University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'medical'], email: 'international@deakin.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة جيمس كوك', nameEn: 'James Cook University', country: 'أستراليا', city: 'Townsville, QLD', tier: 3, minGpa: 2.7, fields: ['medical', 'science', 'engineering'], email: 'international@jcu.edu.au', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة كورتين', nameEn: 'Curtin University', country: 'أستراليا', city: 'Perth, WA', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'international@curtin.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ولونغونغ', nameEn: 'University of Wollongong', country: 'أستراليا', city: 'Wollongong, NSW', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'cs'], email: 'international@uow.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تسمانيا', nameEn: 'University of Tasmania', country: 'أستراليا', city: 'Hobart, TAS', tier: 3, minGpa: 2.7, fields: ['science', 'engineering', 'business', 'medical'], email: 'international@utas.edu.au', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة فلندرز', nameEn: 'Flinders University', country: 'أستراليا', city: 'Adelaide, SA', tier: 3, minGpa: 2.7, fields: ['medical', 'science', 'business', 'education'], email: 'international@flinders.edu.au', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة غرب سيدني', nameEn: 'Western Sydney University', country: 'أستراليا', city: 'Sydney, NSW', tier: 3, minGpa: 2.7, fields: ['business', 'engineering', 'medical', 'social'], email: 'international@westernsydney.edu.au', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'easy', mosque: 'nearby', saudiCommunity: 'large', prayerRoom: 'yes' } },

  // ==================== JAPAN (13) ====================
  // Tier 1 (4)
  { nameAr: 'جامعة طوكيو', nameEn: 'University of Tokyo', country: 'اليابان', city: 'Tokyo', tier: 1, minGpa: 3.6, fields: ['engineering', 'science', 'social'], email: 'info.admissions@adm.u-tokyo.ac.jp', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كيوتو', nameEn: 'Kyoto University', country: 'اليابان', city: 'Kyoto', tier: 1, minGpa: 3.5, fields: ['engineering', 'science', 'medical'], email: 'nyushi@mail.adm.kyoto-u.ac.jp', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أوساكا', nameEn: 'Osaka University', country: 'اليابان', city: 'Osaka', tier: 1, minGpa: 3.5, fields: ['engineering', 'medical', 'science'], email: 'nyushi-section@office.osaka-u.ac.jp', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة توهوكو', nameEn: 'Tohoku University', country: 'اليابان', city: 'Sendai', tier: 1, minGpa: 3.4, fields: ['engineering', 'science', 'medical'], email: 'nyushi@grp.tohoku.ac.jp', englishGradOnly: true, weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 2 (5)
  { nameAr: 'جامعة طوكيو للتكنولوجيا', nameEn: 'Tokyo Institute of Technology', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'science'], email: 'nyu.adm@jim.titech.ac.jp', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة واسيدا', nameEn: 'Waseda University', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['business', 'engineering', 'social', 'arts'], email: 'admission@list.waseda.jp', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كييو', nameEn: 'Keio University', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['business', 'medical', 'engineering', 'social'], email: 'kic-ic@adst.keio.ac.jp', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ناغويا', nameEn: 'Nagoya University', country: 'اليابان', city: 'Nagoya', tier: 2, minGpa: 3.3, fields: ['engineering', 'science', 'medical'], email: 'nupace@adm.nagoya-u.ac.jp', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كيوشو', nameEn: 'Kyushu University', country: 'اليابان', city: 'Fukuoka', tier: 2, minGpa: 3.2, fields: ['engineering', 'science', 'social'], email: 'intl-admission@jimu.kyushu-u.ac.jp', englishGradOnly: true, weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 3 (4)
  { nameAr: 'جامعة ريتسوميكان', nameEn: 'Ritsumeikan University', country: 'اليابان', city: 'Kyoto', tier: 3, minGpa: 2.8, fields: ['business', 'social', 'arts'], email: 'admissions-ap@st.ritsumei.ac.jp', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة آسيا والباسفيك ريتسوميكان', nameEn: 'Ritsumeikan Asia Pacific University', country: 'اليابان', city: 'Beppu', tier: 3, minGpa: 2.8, fields: ['business', 'social'], email: 'apuadmit@apu.ac.jp', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة صوفيا', nameEn: 'Sophia University', country: 'اليابان', city: 'Tokyo', tier: 3, minGpa: 2.9, fields: ['business', 'social', 'arts'], email: 'adm-info@sophia.ac.jp', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'الجامعة الدولية في اليابان', nameEn: 'International University of Japan', country: 'اليابان', city: 'Niigata', tier: 3, minGpa: 2.8, fields: ['business', 'social'], email: 'admission@iuj.ac.jp', englishGradOnly: true, weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },

  // ==================== SOUTH KOREA (13) ====================
  // Tier 1 (4)
  { nameAr: 'جامعة سيول الوطنية', nameEn: 'Seoul National University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 1, minGpa: 3.6, fields: ['engineering', 'business', 'medical', 'science'], email: 'snuadmit@snu.ac.kr', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'كايست', nameEn: 'KAIST', country: 'كوريا الجنوبية', city: 'Daejeon', tier: 1, minGpa: 3.5, fields: ['engineering', 'cs', 'science'], email: 'admission@kaist.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة يونسي', nameEn: 'Yonsei University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 1, minGpa: 3.5, fields: ['business', 'engineering', 'medical', 'social'], email: 'admission@yonsei.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كوريا', nameEn: 'Korea University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 1, minGpa: 3.4, fields: ['business', 'engineering', 'social', 'law'], email: 'admissions@korea.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 2 (5)
  { nameAr: 'بوستيك', nameEn: 'POSTECH', country: 'كوريا الجنوبية', city: 'Pohang', tier: 2, minGpa: 3.4, fields: ['engineering', 'science', 'cs'], email: 'admission@postech.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة سونغ كيون كوان', nameEn: 'Sungkyunkwan University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical'], email: 'admissions@skku.edu', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة هانيانج', nameEn: 'Hanyang University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'cs'], email: 'iao@hanyang.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة سوقانق', nameEn: 'Sogang University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.2, fields: ['business', 'social', 'engineering'], email: 'intl@sogang.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة إنها', nameEn: 'Inha University', country: 'كوريا الجنوبية', city: 'Incheon', tier: 2, minGpa: 3.1, fields: ['engineering', 'cs', 'business'], email: 'intl@inha.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  // Tier 3 (4)
  { nameAr: 'جامعة إيوها للنساء', nameEn: 'Ewha Womans University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.9, fields: ['business', 'social', 'arts', 'medical'], email: 'intl@ewha.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة كيونغ هي', nameEn: 'Kyung Hee University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.8, fields: ['business', 'medical', 'social'], email: 'iao@khu.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تشونغ آنغ', nameEn: 'Chung-Ang University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.8, fields: ['business', 'arts', 'social'], email: 'oia@cau.ac.kr', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة دونغوك', nameEn: 'Dongguk University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.8, fields: ['business', 'arts', 'cs', 'social'], email: 'intl@dongguk.edu', weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },

  // ==================== SPAIN (12) ====================
  // Tier 1 (3)
  { nameAr: 'كلية آي إي للأعمال', nameEn: 'IE Business School', country: 'إسبانيا', city: 'Madrid', tier: 1, minGpa: 3.5, fields: ['business'], email: 'admissions@ie.edu', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'كلية إياسي للأعمال', nameEn: 'IESE Business School', country: 'إسبانيا', city: 'Barcelona', tier: 1, minGpa: 3.5, fields: ['business'], email: 'admissions@iese.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'كلية إسادي للأعمال', nameEn: 'Esade Business School', country: 'إسبانيا', city: 'Barcelona', tier: 1, minGpa: 3.4, fields: ['business'], email: 'admissions@esade.edu', weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  // Tier 2 (5)
  { nameAr: 'جامعة بومبيو فابرا', nameEn: 'Pompeu Fabra University', country: 'إسبانيا', city: 'Barcelona', tier: 2, minGpa: 3.3, fields: ['business', 'social', 'cs'], email: 'info@upf.edu', englishGradOnly: true, weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة برشلونة', nameEn: 'University of Barcelona', country: 'إسبانيا', city: 'Barcelona', tier: 2, minGpa: 3.3, fields: ['medical', 'science', 'business'], email: 'info@ub.edu', englishGradOnly: true, weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة كومبلوتنسي في مدريد', nameEn: 'Complutense University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 2, minGpa: 3.2, fields: ['medical', 'social', 'law'], email: 'info.internacional@ucm.es', englishGradOnly: true, weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة كارلوس الثالث في مدريد', nameEn: 'Carlos III University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 2, minGpa: 3.2, fields: ['business', 'engineering', 'cs'], email: 'infocom@uc3m.es', weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة سلمنقة', nameEn: 'University of Salamanca', country: 'إسبانيا', city: 'Salamanca', tier: 2, minGpa: 3.1, fields: ['social', 'law', 'arts', 'science'], email: 'relaciones.internacionales@usal.es', englishGradOnly: true, weather: 'mixed', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  // Tier 3 (4)
  { nameAr: 'جامعة نافارا', nameEn: 'University of Navarra', country: 'إسبانيا', city: 'Pamplona', tier: 3, minGpa: 2.9, fields: ['business', 'medical', 'social'], email: 'admissions@unav.edu', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة أوتونوما في مدريد', nameEn: 'Autonomous University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 3, minGpa: 2.8, fields: ['business', 'medical', 'science'], email: 'oficina.international@uam.es', englishGradOnly: true, weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'medium', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة غرناطة', nameEn: 'University of Granada', country: 'إسبانيا', city: 'Granada', tier: 3, minGpa: 2.8, fields: ['medical', 'business', 'arts'], email: 'intlwelcome@ugr.es', englishGradOnly: true, weather: 'hot', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة فالنسيا التقنية', nameEn: 'Polytechnic University of Valencia', country: 'إسبانيا', city: 'Valencia', tier: 3, minGpa: 2.8, fields: ['engineering', 'cs', 'arts'], email: 'international@upv.es', englishGradOnly: true, weather: 'moderate', safety: 'safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },

  // ==================== NEW ZEALAND (10) ====================
  // Tier 1 (3)
  { nameAr: 'جامعة أوكلاند', nameEn: 'University of Auckland', country: 'نيوزيلندا', city: 'Auckland', tier: 1, minGpa: 3.5, fields: ['all'], email: 'international@auckland.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة أوتاغو', nameEn: 'University of Otago', country: 'نيوزيلندا', city: 'Dunedin', tier: 1, minGpa: 3.4, fields: ['medical', 'business', 'social', 'science'], email: 'international@otago.ac.nz', weather: 'cold', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة فيكتوريا في ولنغتون', nameEn: 'Victoria University of Wellington', country: 'نيوزيلندا', city: 'Wellington', tier: 1, minGpa: 3.3, fields: ['business', 'social', 'law', 'arts'], email: 'international@vuw.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 2 (4)
  { nameAr: 'جامعة كانتربري', nameEn: 'University of Canterbury', country: 'نيوزيلندا', city: 'Christchurch', tier: 2, minGpa: 3.2, fields: ['engineering', 'science', 'business'], email: 'international@canterbury.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة وايكاتو', nameEn: 'University of Waikato', country: 'نيوزيلندا', city: 'Hamilton', tier: 2, minGpa: 3.1, fields: ['business', 'engineering', 'education'], email: 'international@waikato.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة ماسي', nameEn: 'Massey University', country: 'نيوزيلندا', city: 'Palmerston North', tier: 2, minGpa: 3.0, fields: ['business', 'engineering', 'science'], email: 'international@massey.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'yes' } },
  { nameAr: 'جامعة تكنولوجيا أوكلاند', nameEn: 'Auckland University of Technology (AUT)', country: 'نيوزيلندا', city: 'Auckland', tier: 2, minGpa: 3.0, fields: ['business', 'engineering', 'cs', 'arts'], email: 'international@aut.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'yes' } },
  // Tier 3 (3)
  { nameAr: 'جامعة لينكولن', nameEn: 'Lincoln University', country: 'نيوزيلندا', city: 'Christchurch', tier: 3, minGpa: 2.7, fields: ['business', 'science'], email: 'international@lincoln.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'يونيتك', nameEn: 'Unitec Institute of Technology', country: 'نيوزيلندا', city: 'Auckland', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'cs'], email: 'international@unitec.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'moderate', mosque: 'nearby', saudiCommunity: 'small', prayerRoom: 'unknown' } },
  { nameAr: 'جامعة أوكلاند للتكنولوجيا ماناواتو', nameEn: 'Universal College of Learning (UCOL)', country: 'نيوزيلندا', city: 'Palmerston North', tier: 3, minGpa: 2.7, fields: ['business', 'engineering'], email: 'international@ucol.ac.nz', weather: 'moderate', safety: 'very_safe', muslimFriendly: { halal: 'limited', mosque: 'limited', saudiCommunity: 'small', prayerRoom: 'unknown' } }
];

// ============ HELPER FUNCTIONS ============
function normalizeGpa(gpa, scale) {
  const g = parseFloat(gpa);
  const s = parseFloat(scale || '4');
  if (isNaN(g)) return 0;
  if (s === 4) return g;
  if (s === 5) return (g / 5) * 4;
  if (s === 100) return (g / 100) * 4;
  return g;
}

function tierLabel(tier) {
  if (tier === 1) return 'نخبة عالمية';
  if (tier === 2) return 'متميزة';
  return 'متاحة وذات جودة';
}

function fitLabel(studentGpa4, uniMinGpa) {
  const diff = studentGpa4 - uniMinGpa;
  if (diff >= 0.4) return 'فرصة ممتازة';
  if (diff >= 0.1) return 'فرصة جيدة';
  if (diff >= -0.2) return 'فرصة تنافسية';
  return 'فرصة طموحة';
}

function weatherLabel(w) {
  if (w === 'hot') return '☀️ حار ومشمس';
  if (w === 'moderate') return '🌤️ معتدل';
  if (w === 'cold') return '❄️ بارد';
  if (w === 'mixed') return '🌦️ متقلب';
  return '';
}

function safetyLabel(s) {
  if (s === 'very_safe') return '🛡️ آمنة جداً';
  if (s === 'safe') return '🛡️ آمنة';
  if (s === 'moderate') return '🛡️ مقبولة';
  return '';
}

function muslimFriendlyLabels(mf) {
  if (!mf) return [];
  const labels = [];
  if (mf.halal === 'easy') labels.push('🍖 حلال متوفر بسهولة');
  else if (mf.halal === 'moderate') labels.push('🍖 حلال متوفر');
  else labels.push('🍖 حلال محدود');
  if (mf.mosque === 'on_campus') labels.push('🕌 مسجد في الحرم الجامعي');
  else if (mf.mosque === 'nearby') labels.push('🕌 مسجد قريب');
  else labels.push('🕌 مساجد محدودة');
  if (mf.saudiCommunity === 'large') labels.push('👥 مجتمع سعودي كبير');
  else if (mf.saudiCommunity === 'medium') labels.push('👥 مجتمع سعودي متوسط');
  else labels.push('👥 مجتمع سعودي صغير');
  if (mf.prayerRoom === 'yes') labels.push('🤲 مصلى في الحرم الجامعي');
  return labels;
}

function parseCountries(countriesInput) {
  const t = (Array.isArray(countriesInput) ? countriesInput.join(' ') : (countriesInput || '')).toLowerCase();
  const countries = [];
  if (/usa|america|united states|أمريك|ولايات|الولايات المتحدة/.test(t)) countries.push('الولايات المتحدة');
  if (/uk|britain|england|scotland|wales|united kingdom|بريطان|إنجل|المملكة المتحدة|إسكتلن|ويلز/.test(t)) countries.push('المملكة المتحدة');
  if (/canada|كند/.test(t)) countries.push('كندا');
  if (/australia|أسترال/.test(t)) countries.push('أستراليا');
  if (/japan|يابان/.test(t)) countries.push('اليابان');
  if (/korea|كوري|southkorea/.test(t)) countries.push('كوريا الجنوبية');
  if (/spain|إسبان|اسبان/.test(t)) countries.push('إسبانيا');
  if (/new zealand|نيوزيل|newzealand/.test(t)) countries.push('نيوزيلندا');
  return countries.length > 0 ? countries : ['الولايات المتحدة', 'المملكة المتحدة', 'كندا', 'أستراليا'];
}

function filterUniversities(answers) {
  const fieldCats = categorizeField(answers.field);
  const preferredCountries = parseCountries(answers.countries);
  const studentGpa4 = normalizeGpa(answers.gpa, answers.gpaScale);
  const isUndergrad = answers.degreeLevel === 'bachelor';
  const weatherPref = answers.weatherPreference || 'no_preference';

  const candidates = UNIVERSITIES.filter(u => {
    if (!preferredCountries.includes(u.country)) return false;
    if (fieldCats.includes('general')) return true;
    const hasFieldMatch = u.fields.includes('all') || fieldCats.some(fc => u.fields.includes(fc));
    if (!hasFieldMatch) return false;
    if (u.englishGradOnly && isUndergrad) return false;
    if (studentGpa4 < u.minGpa - 0.3) return false;
    return true;
  });

  const weatherMap = { hot: 'hot', moderate: 'moderate', cold: 'cold' };
  const prefWeather = weatherMap[weatherPref];

  candidates.forEach(u => {
    let score = 0;
    const fieldMatchCount = fieldCats.filter(fc => u.fields.includes(fc)).length;
    score += fieldMatchCount * 10;
    if (u.fields.includes('all')) score += 5;

    const gpaDiff = studentGpa4 - u.minGpa;
    if (gpaDiff >= 0.4) score += 8;
    else if (gpaDiff >= 0.1) score += 12;
    else if (gpaDiff >= -0.2) score += 6;
    else score += 2;

    if (prefWeather && u.weather === prefWeather) score += 4;

    score += (Math.random() * 3);
    u._score = score;
  });

  candidates.sort((a, b) => b._score - a._score);

  const selected = [];
  const countryCount = {};
  const tierCount = { 1: 0, 2: 0, 3: 0 };

  for (const uni of candidates) {
    if (selected.length >= 10) break;
    const cc = countryCount[uni.country] || 0;
    if (cc >= 4 && preferredCountries.length > 1) continue;
    selected.push(uni);
    countryCount[uni.country] = cc + 1;
    tierCount[uni.tier] = (tierCount[uni.tier] || 0) + 1;
  }

  if (tierCount[1] === 0 && selected.length >= 10) {
    const reach = candidates.find(u => u.tier === 1 && !selected.includes(u));
    if (reach) { selected.pop(); selected.unshift(reach); }
  }
  if (tierCount[3] === 0 && selected.length >= 10) {
    const safety = candidates.find(u => u.tier === 3 && !selected.includes(u));
    if (safety) { selected.pop(); selected.push(safety); }
  }

  return selected.map(u => ({
    nameAr: u.nameAr,
    nameEn: u.nameEn,
    country: u.country,
    city: u.city,
    tier: tierLabel(u.tier),
    tierNum: u.tier,
    fitLevel: fitLabel(studentGpa4, u.minGpa),
    link: `https://www.google.com/search?q=${encodeURIComponent(u.nameEn + ' ' + (answers.field || '') + ' ' + (answers.degreeLevel === 'master' ? 'graduate' : answers.degreeLevel === 'phd' ? 'PhD' : 'admission'))}`,
    fields: u.fields,
    minGpaRequired: u.minGpa,
    weather: weatherLabel(u.weather),
    safety: safetyLabel(u.safety),
    muslimFriendly: muslimFriendlyLabels(u.muslimFriendly),
    englishGradOnly: u.englishGradOnly || false
  }));
}

function filterPrograms(answers) {
  const fieldCats = categorizeField(answers.field);
  return SAUDI_PROGRAMS
    .filter(p => p.applicable.includes(answers.academicLevel))
    .filter(p => p.fields.includes('all') || fieldCats.some(fc => p.fields.includes(fc)))
    .map(p => ({
      name: p.name,
      description: p.description,
      eligibility: p.eligibility,
      fit: '',
      link: p.link,
      linkLabel: p.linkLabel
    }));
}

function getRequirements(answers) {
  const reqs = [
    'تصديق الشهادات السابقة من وزارة التعليم في حال كانت صادرة من خارج المملكة',
    'بطاقة هوية وطنية سارية المفعول',
    'جواز سفر ساري المفعول لمدة سنة على الأقل',
    'شهادة حسن سيرة وسلوك',
    'تقرير طبي يثبت اللياقة الصحية',
    'اجتياز اختبار اللغة الإنجليزية المطلوب (IELTS / TOEFL / STEP) حسب متطلبات الجامعة والبرنامج',
    'التسجيل في منصة سفير إذا كان التقديم على برنامج حكومي',
    'الحصول على قبول رسمي من الجامعة قبل إجراءات التأشيرة',
    'عدم الجمع بين الوظيفة والابتعاث',
    'إكمال إجراءات التأشيرة الطلابية في سفارة الدولة المختارة'
  ];
  if (answers.gender === 'female') {
    if (answers.mahram === 'no' || answers.mahram === 'unsure') {
      reqs.push('بعض البرامج الحكومية تشترط وجود محرم للطالبات، راجعي الشروط الخاصة ببرنامج الابتعاث الذي تتقدمين له');
    } else {
      reqs.push('وجود المحرم: يجب تسجيله في طلب الابتعاث والحصول على تأشيرة مرافق له');
    }
  }
  return reqs;
}

function profileKey(answers) {
  const countriesStr = Array.isArray(answers.countries) ? answers.countries.sort().join(',') : (answers.countries || '');
  const passionsStr = Array.isArray(answers.passions) ? answers.passions.sort().join(',') : (answers.passions || '');
  const goalsStr = Array.isArray(answers.goals) ? answers.goals.sort().join(',') : (answers.goals || '');
  const key = `${answers.academicLevel}|${Math.floor(parseFloat(answers.gpa || 0) * 2) / 2}|${answers.gpaScale}|${answers.english}|${(answers.field || '').toLowerCase().trim().substring(0, 30)}|${answers.degreeLevel}|${countriesStr.substring(0, 50)}|${answers.budget}|${answers.gender}|${answers.mahram || ''}|${answers.weatherPreference || ''}|${passionsStr.substring(0, 60)}|${goalsStr.substring(0, 60)}`;
  return 'rec4:' + crypto.createHash('sha256').update(key).digest('hex');
}

// ============ AI PROMPTS ============
function buildProfileAnalysisPrompt(answers, programs, studentGpa4) {
  const programNames = programs.map(p => p.name).join(' | ');
  const passionsText = Array.isArray(answers.passions) ? answers.passions.join('، ') : answers.passions;
  const goalsText = Array.isArray(answers.goals) ? answers.goals.join('، ') : answers.goals;

  return `أنت مستشار ابتعاث خبير وداعم للطلاب السعوديين. تتحدث كأخ أكبر مر بتجربة الابتعاث ويريد مساعدة من يأتي بعده.

ملف الطالب:
- المستوى الأكاديمي: ${answers.academicLevel}
- الجامعة الحالية: ${wrapUserInput('institution', answers.currentInstitution)}
- المعدل: ${answers.gpa} من ${answers.gpaScale} (يعادل ${studentGpa4.toFixed(2)} من 4.0)
- الإنجليزية: ${answers.english}${answers.englishScore ? ' - الدرجة: ' + sanitizeText(answers.englishScore, 20) : ''}
- التخصص المرغوب: ${wrapUserInput('field', answers.field)}
- الدرجة المطلوبة: ${answers.degreeLevel}
- الدول المفضلة: ${answers.countriesText || (Array.isArray(answers.countries) ? answers.countries.join(', ') : answers.countries)}
- خطة التمويل: ${answers.budget}
- الجنس: ${answers.gender}${answers.mahram ? ' - المحرم: ' + answers.mahram : ''}
- ما استمتع به: ${passionsText || 'غير محدد'}
- الأهداف المهنية: ${goalsText || 'غير محدد'}

البرامج الحكومية المرشحة: ${programNames || 'لا توجد برامج مطابقة'}

أرجع JSON فقط بهذا الشكل:
{
  "analysis": "فقرتان: الأولى تبدأ بجملة إيجابية عن نقاط قوة الطالب وما يميز ملفه، ثم تقييم واقعي لفرصه. الثانية توضح التحديات بأسلوب بنّاء مع حلول عملية. استخدم عبارات مثل: ملفك يفتح لك أبواباً كثيرة، تخصصك مطلوب، خبرتك تعوض. لا تستخدم لهجة واعظ أو محاضر.",
  "programsFit": [
    {"name": "اسم البرنامج بالضبط", "fit": "جملة أو جملتان توضح لماذا يناسب هذا الطالب تحديداً ولماذا يستحق التقديم عليه"}
  ]
}

قواعد:
- JSON صالح بدون markdown
- النبرة: مستشار داعم وصادق، ليس قاضياً أو واعظاً
- لا تكرر معلومات الطالب، قدم تحليلاً حقيقياً
- ابدأ بالإيجابي ثم التحديات مع الحلول
- اختم بجملة تحفيزية واقعية
- لا تخترع أسماء برامج ليست في القائمة
- الرد باللغة العربية فقط
- لا تستخدم الشرطة (-)  أبداً في النص`;
}

function buildUniversityNotesPrompt(answers, universities, studentGpa4) {
  const uniList = universities.map((u, i) => `${i + 1}. ${u.nameEn} (${u.country} - ${u.tier}, ${u.fitLevel})`).join('\n');
  const passionsText = Array.isArray(answers.passions) ? answers.passions.join('، ') : answers.passions;
  const goalsText = Array.isArray(answers.goals) ? answers.goals.join('، ') : answers.goals;

  return `أنت مستشار ابتعاث تكتب ملاحظات مخصصة عن الجامعات لطالب سعودي.

ملف الطالب المختصر:
- التخصص: ${wrapUserInput('field', answers.field)}
- المعدل: ${studentGpa4.toFixed(2)} من 4.0
- الدرجة المطلوبة: ${answers.degreeLevel}
- ما استمتع به: ${passionsText || 'غير محدد'}
- الأهداف: ${goalsText || 'غير محدد'}

الجامعات المرشحة:
${uniList}

أرجع JSON فقط:
{
  "universityNotes": [
    {"nameEn": "الاسم بالضبط كما أعلاه", "note": "ملاحظة قصيرة ومخصصة لهذا الطالب: لماذا هذه الجامعة مناسبة له، ما الذي يميزها في تخصصه، وما النصيحة العملية"}
  ]
}

قواعد:
- JSON صالح بدون markdown
- كل ملاحظة جملتان كحد أقصى
- خصص الملاحظة لهذا الطالب، لا تكتب وصفاً عاماً عن الجامعة
- اذكر نقطة قوة محددة في تخصص الطالب
- الرد بالعربية فقط
- لا تستخدم الشرطة (-) أبداً في النص`;
}

function buildActionPlanPrompt(answers, programs, universities, studentGpa4) {
  const programNames = programs.map(p => p.name).join('، ');
  const uniNames = universities.slice(0, 5).map(u => u.nameEn).join('، ');

  return `أنت مستشار ابتعاث تكتب خطة عمل عملية ومحددة لطالب سعودي.

ملف الطالب:
- المستوى: ${answers.academicLevel}
- التخصص: ${wrapUserInput('field', answers.field)}
- المعدل: ${studentGpa4.toFixed(2)} من 4.0
- الإنجليزية: ${answers.english}${answers.englishScore ? ' (' + sanitizeText(answers.englishScore, 20) + ')' : ''}
- الدرجة: ${answers.degreeLevel}
- التمويل: ${answers.budget}

البرامج المرشحة: ${programNames || 'لا يوجد'}
أبرز الجامعات: ${uniNames}

أرجع JSON فقط:
{
  "nextSteps": [
    "خطوة 1 محددة وقابلة للتنفيذ مع إطار زمني",
    "خطوة 2",
    "خطوة 3",
    "خطوة 4",
    "خطوة 5",
    "خطوة 6"
  ]
}

قواعد:
- JSON صالح بدون markdown
- 5 إلى 7 خطوات عملية ومحددة
- كل خطوة تبدأ بفعل أمر واضح (سجل، تقدم، جهز، تواصل)
- اذكر أسماء المنصات والمواقع الحقيقية (سفير، IELTS، إلخ)
- حدد إطاراً زمنياً واقعياً (هذا الأسبوع، خلال شهر، قبل الموعد النهائي)
- الرد بالعربية فقط
- لا تستخدم الشرطة (-) أبداً في النص`;
}

async function callAI(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
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
  return JSON.parse(jsonStr);
}

// ============ INPUT SANITIZATION ============
function sanitizeText(str, maxLen = 300) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, maxLen);
}

function wrapUserInput(tag, value) {
  const clean = sanitizeText(value);
  return clean ? `<${tag}>${clean}</${tag}>` : 'غير محدد';
}

// ============ CORS ============
const ALLOWED_ORIGIN = 'https://mustashar-alibtiath.vercel.app';

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ============ MAIN HANDLER ============
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // GET: return university database for the explorer
  if (req.method === 'GET') {
    const list = UNIVERSITIES.map(u => ({
      nameAr: u.nameAr, nameEn: u.nameEn, country: u.country, city: u.city,
      tier: u.tier, fields: u.fields, weather: u.weather, safety: u.safety,
      muslimFriendly: u.muslimFriendly
    }));
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({ universities: list });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',').pop()?.trim() || 'unknown';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({ error: 'لقد تجاوزت الحد اليومي للاستفسارات. حاول مرة أخرى غداً.' });
    }

    const answers = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'بيانات ناقصة' });
    }
    if (Array.isArray(answers.countries)) {
      answers.countriesText = answers.countriesText || answers.countries.join('، ');
    }
    if (!answers.field || !answers.academicLevel) {
      return res.status(400).json({ error: 'بيانات ناقصة' });
    }

    // Enforce max length on free-text fields
    if ((answers.field && answers.field.length > 300) || (answers.currentInstitution && answers.currentInstitution.length > 300)) {
      return res.status(400).json({ error: 'النص طويل جداً. الحد الأقصى 300 حرف.' });
    }

    // Sanitize free-text inputs
    answers.field = sanitizeText(answers.field);
    answers.currentInstitution = sanitizeText(answers.currentInstitution);
    if (answers.passionsExtra) answers.passionsExtra = sanitizeText(answers.passionsExtra);
    if (answers.goalsExtra) answers.goalsExtra = sanitizeText(answers.goalsExtra);
    if (answers.englishScore) answers.englishScore = sanitizeText(answers.englishScore, 20);

    const cacheKey = profileKey(answers);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(typeof cached === 'string' ? JSON.parse(cached) : cached);
    }

    const programs = filterPrograms(answers);
    const universities = filterUniversities(answers);
    const requirements = getRequirements(answers);
    const studentGpa4 = normalizeGpa(answers.gpa, answers.gpaScale);

    let aiAnalysis = { analysis: '', programsFit: [] };
    let aiUniNotes = { universityNotes: [] };
    let aiPlan = { nextSteps: [] };

    try {
      aiAnalysis = await callAI(buildProfileAnalysisPrompt(answers, programs, studentGpa4));
    } catch (e) {
      console.error('AI Call 1 (analysis) failed:', e);
      aiAnalysis = { analysis: 'ملفك يحمل إمكانيات جيدة. راجع التوصيات أدناه للخطوات التالية.', programsFit: [] };
    }

    try {
      aiUniNotes = await callAI(buildUniversityNotesPrompt(answers, universities, studentGpa4));
    } catch (e) {
      console.error('AI Call 2 (university notes) failed:', e);
      aiUniNotes = { universityNotes: [] };
    }

    try {
      aiPlan = await callAI(buildActionPlanPrompt(answers, programs, universities, studentGpa4));
    } catch (e) {
      console.error('AI Call 3 (action plan) failed:', e);
      aiPlan = { nextSteps: ['سجل في منصة سفير', 'جهز مستنداتك الأكاديمية', 'تقدم لاختبار اللغة الإنجليزية', 'تواصل مع الجامعات المرشحة', 'قدم على البرامج الحكومية المناسبة'] };
    }

    const programsWithFit = programs.map(p => {
      const match = (aiAnalysis.programsFit || []).find(pf => pf.name && p.name.includes(pf.name.substring(0, 10)));
      return { ...p, fit: match?.fit || 'يتوافق مع مستواك الأكاديمي وتخصصك' };
    });

    const universitiesWithNotes = universities.map(u => {
      const match = (aiUniNotes.universityNotes || []).find(un => un.nameEn && un.nameEn.includes(u.nameEn.substring(0, 15)));
      return { ...u, notes: match?.note || '' };
    });

    const hasJapanSpainKorea = universities.some(u =>
      ['اليابان', 'كوريا الجنوبية', 'إسبانيا'].includes(u.country) && u.englishGradOnly
    );
    let languageWarning = null;
    if (hasJapanSpainKorea && answers.degreeLevel === 'bachelor') {
      languageWarning = 'تنبيه: بعض الجامعات في اليابان وكوريا الجنوبية وإسبانيا تقدم برامجها باللغة الإنجليزية في مرحلة الدراسات العليا فقط. قد تحتاج لدراسة لغة البلد للمرحلة الجامعية.';
    }

    const finalResult = {
      analysis: aiAnalysis.analysis || 'ملفك يحمل إمكانيات جيدة. راجع التوصيات أدناه للخطوات التالية.',
      programs: programsWithFit,
      universities: universitiesWithNotes,
      requirements,
      nextSteps: aiPlan.nextSteps || [],
      languageWarning
    };

    await redis.set(cacheKey, JSON.stringify(finalResult), { ex: 60 * 60 * 24 * 7 });

    return res.status(200).json(finalResult);
  } catch (err) {
    console.error('Recommend error:', err);
    return res.status(500).json({ error: 'حدث خطأ في المعالجة. حاول مرة أخرى.' });
  }
}
