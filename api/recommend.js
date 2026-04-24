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

// ============ FIELD CATEGORIZATION ============
function categorizeField(fieldText) {
  const t = (fieldText || '').toLowerCase();
  const categories = [];
  if (/eng|هندس|كهرب|ميكانيك|مدني|صناعي|بترول|نفط|كيميائ|طيران|بيئة|معمار|عمارة/.test(t)) categories.push('engineering');
  if (/med|طب|صحة|صيدل|تمريض|علاج|dental|أسنان|بصر|nurs|pharma|physiotherap|علوم صحية/.test(t)) categories.push('medical');
  if (/business|إدارة|أعمال|مال|محاسب|اقتصاد|تسويق|finance|mba|marketing|تمويل/.test(t)) categories.push('business');
  if (/comput|حاسب|برمجة|software|ذكاء اصطناعي|ai|data|بيانات|سيبراني|cyber|شبكات/.test(t)) categories.push('cs');
  if (/law|قانون|حقوق|شريعة|legal/.test(t)) categories.push('law');
  if (/education|تعليم|تربية|teach|منهج|مناهج/.test(t)) categories.push('education');
  if (/science|فيزياء|كيمياء|أحياء|رياضيات|math|physics|biology|chemistry|علوم/.test(t)) categories.push('science');
  if (/art|design|فنون|تصميم|media|إعلام|media|architecture/.test(t)) categories.push('arts');
  if (/social|اجتماع|نفس|psych|علوم سياسية|political|international relations|علاقات دولية/.test(t)) categories.push('social');
  if (categories.length === 0) categories.push('general');
  return categories;
}

// ============ SAUDI GOVERNMENT PROGRAMS ============
const SAUDI_PROGRAMS = [
  {
    name: 'مسار الرواد - برنامج خادم الحرمين الشريفين للابتعاث',
    description: 'يهدف لابتعاث الطلاب لأفضل 30 مؤسسة تعليمية في العالم لمراحل البكالوريوس والماجستير. يغطي الرسوم الدراسية والمعيشة والتأمين الصحي والسفر.',
    eligibility: 'قبول نهائي غير مشروط من إحدى أفضل 30 جامعة في قائمة البرنامج، معدل أكاديمي ممتاز، اجتياز متطلبات اللغة، سعودي الجنسية.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student'],
    fields: ['all'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-arruaad/',
    linkLabel: 'مسار الرواد'
  },
  {
    name: 'مسار التميز - برنامج خادم الحرمين الشريفين للابتعاث',
    description: 'ابتعاث إلى أفضل 50 جامعة عالمياً في التخصصات ذات الأولوية لتحقيق رؤية المملكة 2030.',
    eligibility: 'قبول من جامعة ضمن قائمة البرنامج، معدل تراكمي مرتفع، إتقان اللغة الإنجليزية، بطاقة هوية سارية وجواز سفر.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student', 'master_graduate'],
    fields: ['all'],
    link: 'https://moe.gov.sa/ar/knowledgecenter/eservices/Pages/ksp.aspx',
    linkLabel: 'التقديم على مسار التميز'
  },
  {
    name: 'مسار إمداد - برنامج خادم الحرمين الشريفين للابتعاث',
    description: 'ابتعاث في أفضل 200 جامعة ومعهد حول العالم في مجالات ذات احتياج عالٍ في سوق العمل، لمرحلتي البكالوريوس والماجستير.',
    eligibility: 'قبول نهائي غير مشروط من جامعة ضمن قائمة البرنامج. في الدول غير الناطقة بالإنجليزية يمكن أن يكون القبول مشروطاً بدراسة لغة البلد.',
    applicable: ['bachelor_student', 'bachelor_graduate', 'master_student'],
    fields: ['engineering', 'medical', 'cs', 'business', 'science'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-emdad/',
    linkLabel: 'مسار إمداد'
  },
  {
    name: 'مسار واعد - برنامج خادم الحرمين الشريفين للابتعاث',
    description: 'ابتعاث مبتدئ بالتوظيف مع شركات سعودية كبرى (مثل mbc، العبدالكريم) يضمن الوظيفة بعد التخرج.',
    eligibility: 'معدل الثانوية لا يقل عن 80٪، اجتياز معايير الشركة الراعية، الالتزام بالعمل لديها بعد التخرج.',
    applicable: ['highschool', 'bachelor_graduate'],
    fields: ['all'],
    link: 'https://sites.moe.gov.sa/scholarship-program/paths/path-waaid/',
    linkLabel: 'مسار واعد'
  },
  {
    name: 'برنامج أرامكو للابتعاث (CDPNE)',
    description: 'برنامج ابتعاث أرامكو لخريجي الثانوية للدراسة في أفضل الجامعات العالمية في تخصصات يحتاجها القطاع. يضمن التوظيف في أرامكو بعد التخرج.',
    eligibility: 'طالب سنة ثالثة ثانوية (مسار علمي/عام/حاسب وهندسة/صحي)، معدل 85٪ فأعلى، درجة قدرات 90٪ فأعلى، اجتياز اختبارات الشركة.',
    applicable: ['highschool'],
    fields: ['engineering', 'cs', 'science', 'medical', 'business'],
    link: 'https://www.aramco.com/en/careers/for-saudi-applicants/student-opportunities/college-degree-program',
    linkLabel: 'برنامج أرامكو CDPNE'
  },
  {
    name: 'برنامج منح سابك (SABIC Scholarship)',
    description: 'ابتعاث طلاب الثانوية المتفوقين لدراسة البكالوريوس في تخصصات هندسية وكيميائية تخدم قطاع سابك.',
    eligibility: 'سعودي الجنسية، العمر أقل من 20 سنة، معدل ثانوية 90٪ فأعلى، 85 فأعلى في الرياضيات والفيزياء والكيمياء والإنجليزي، قدرات 80 فأعلى.',
    applicable: ['highschool'],
    fields: ['engineering', 'cs', 'science'],
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
    name: 'برنامج الابتعاث الصحي - وزارة الصحة',
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
    name: 'ابتعاث أعضاء هيئة التدريس - الجامعات السعودية',
    description: 'تبتعث الجامعات السعودية (الملك سعود، الملك عبدالعزيز، أم القرى، غيرها) خريجيها المتميزين لإكمال الدراسات العليا والعودة للتدريس.',
    eligibility: 'معدل تراكمي ممتاز، ترشيح من الجامعة، الالتزام بالعمل فيها لعدد سنوات بعد العودة.',
    applicable: ['bachelor_graduate', 'master_student', 'master_graduate'],
    fields: ['all'],
    link: 'https://moe.gov.sa',
    linkLabel: 'وزارة التعليم'
  },
  {
    name: 'الملحقية الثقافية السعودية (SACM)',
    description: 'الجهة الرسمية التي ترعى الطلاب المبتعثين أثناء دراستهم في الخارج (خاصة الولايات المتحدة)، تقدم الضمان المالي والمتابعة الأكاديمية.',
    eligibility: 'طالب مبتعث من برنامج حكومي أو يملك قبولاً في جامعة معتمدة، تسجيل في نظام سفير.',
    applicable: ['highschool', 'bachelor_student', 'bachelor_graduate', 'master_student', 'master_graduate', 'phd_student'],
    fields: ['all'],
    link: 'https://www.sacm.org/',
    linkLabel: 'الملحقية الثقافية'
  }
];

// ============ UNIVERSITY DATABASE ============
// Tiers: 1=Elite, 2=Strong, 3=Accessible Quality
// GPA thresholds (out of 4.0): Tier 1=3.7+, Tier 2=3.3+, Tier 3=2.7+
const UNIVERSITIES = [
  // ==================== USA (26) ====================
  // Tier 1
  { nameAr: 'معهد ماساتشوستس للتكنولوجيا', nameEn: 'Massachusetts Institute of Technology (MIT)', country: 'الولايات المتحدة', city: 'Cambridge, MA', tier: 1, minGpa: 3.8, fields: ['engineering', 'cs', 'science', 'business'], email: 'admissions@mit.edu' },
  { nameAr: 'جامعة ستانفورد', nameEn: 'Stanford University', country: 'الولايات المتحدة', city: 'Stanford, CA', tier: 1, minGpa: 3.8, fields: ['engineering', 'cs', 'business', 'medical', 'law'], email: 'admission@stanford.edu' },
  { nameAr: 'جامعة هارفارد', nameEn: 'Harvard University', country: 'الولايات المتحدة', city: 'Cambridge, MA', tier: 1, minGpa: 3.8, fields: ['business', 'law', 'medical', 'social', 'science'], email: 'college@fas.harvard.edu' },
  { nameAr: 'جامعة كاليفورنيا - بيركلي', nameEn: 'University of California, Berkeley', country: 'الولايات المتحدة', city: 'Berkeley, CA', tier: 1, minGpa: 3.7, fields: ['engineering', 'cs', 'business', 'science'], email: 'admissions@berkeley.edu' },
  { nameAr: 'جامعة كارنيجي ميلون', nameEn: 'Carnegie Mellon University', country: 'الولايات المتحدة', city: 'Pittsburgh, PA', tier: 1, minGpa: 3.7, fields: ['cs', 'engineering', 'arts', 'business'], email: 'admission@andrew.cmu.edu' },
  { nameAr: 'جامعة جونز هوبكنز', nameEn: 'Johns Hopkins University', country: 'الولايات المتحدة', city: 'Baltimore, MD', tier: 1, minGpa: 3.7, fields: ['medical', 'science', 'engineering', 'social'], email: 'gotojhu@jhu.edu' },
  // Tier 2
  { nameAr: 'جامعة بيردو', nameEn: 'Purdue University', country: 'الولايات المتحدة', city: 'West Lafayette, IN', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'science', 'business'], email: 'admissions@purdue.edu' },
  { nameAr: 'جامعة واشنطن', nameEn: 'University of Washington', country: 'الولايات المتحدة', city: 'Seattle, WA', tier: 2, minGpa: 3.3, fields: ['cs', 'engineering', 'medical', 'business'], email: 'askuwadm@uw.edu' },
  { nameAr: 'جامعة بنسلفانيا ستيت', nameEn: 'Pennsylvania State University', country: 'الولايات المتحدة', city: 'University Park, PA', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'science', 'social'], email: 'admissions@psu.edu' },
  { nameAr: 'جامعة تكساس - أوستن', nameEn: 'University of Texas at Austin', country: 'الولايات المتحدة', city: 'Austin, TX', tier: 2, minGpa: 3.4, fields: ['engineering', 'cs', 'business', 'social'], email: 'admissions@utexas.edu' },
  { nameAr: 'جامعة ولاية أوهايو', nameEn: 'Ohio State University', country: 'الولايات المتحدة', city: 'Columbus, OH', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'social'], email: 'askabuckeye@osu.edu' },
  { nameAr: 'جامعة ميشيغان ستيت', nameEn: 'Michigan State University', country: 'الولايات المتحدة', city: 'East Lansing, MI', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'education', 'medical'], email: 'admissions@msu.edu' },
  { nameAr: 'جامعة فلوريدا', nameEn: 'University of Florida', country: 'الولايات المتحدة', city: 'Gainesville, FL', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'science'], email: 'admissions@ufl.edu' },
  { nameAr: 'جامعة مينيسوتا', nameEn: 'University of Minnesota', country: 'الولايات المتحدة', city: 'Minneapolis, MN', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'science'], email: 'admissions@umn.edu' },
  { nameAr: 'جامعة بوسطن', nameEn: 'Boston University', country: 'الولايات المتحدة', city: 'Boston, MA', tier: 2, minGpa: 3.4, fields: ['engineering', 'business', 'arts', 'medical'], email: 'admissions@bu.edu' },
  { nameAr: 'جامعة نورث إيسترن', nameEn: 'Northeastern University', country: 'الولايات المتحدة', city: 'Boston, MA', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'business'], email: 'admissions@northeastern.edu' },
  // Tier 3
  { nameAr: 'جامعة ولاية أريزونا', nameEn: 'Arizona State University', country: 'الولايات المتحدة', city: 'Tempe, AZ', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'cs', 'arts'], email: 'admissions@asu.edu' },
  { nameAr: 'جامعة ولاية أوريغون', nameEn: 'Oregon State University', country: 'الولايات المتحدة', city: 'Corvallis, OR', tier: 3, minGpa: 2.8, fields: ['engineering', 'science', 'business'], email: 'osuadmit@oregonstate.edu' },
  { nameAr: 'جامعة جنوب فلوريدا', nameEn: 'University of South Florida', country: 'الولايات المتحدة', city: 'Tampa, FL', tier: 3, minGpa: 2.8, fields: ['engineering', 'medical', 'business'], email: 'admissions@usf.edu' },
  { nameAr: 'جامعة وست فرجينيا', nameEn: 'West Virginia University', country: 'الولايات المتحدة', city: 'Morgantown, WV', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'medical'], email: 'go2wvu@mail.wvu.edu' },
  { nameAr: 'جامعة ولاية واشنطن', nameEn: 'Washington State University', country: 'الولايات المتحدة', city: 'Pullman, WA', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'science'], email: 'admissions@wsu.edu' },
  { nameAr: 'جامعة أركنساس', nameEn: 'University of Arkansas', country: 'الولايات المتحدة', city: 'Fayetteville, AR', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'uofa@uark.edu' },
  { nameAr: 'جامعة كنتاكي', nameEn: 'University of Kentucky', country: 'الولايات المتحدة', city: 'Lexington, KY', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'admission@uky.edu' },
  { nameAr: 'جامعة ممفيس', nameEn: 'University of Memphis', country: 'الولايات المتحدة', city: 'Memphis, TN', tier: 3, minGpa: 2.7, fields: ['business', 'engineering', 'arts'], email: 'admissions@memphis.edu' },
  { nameAr: 'جامعة ويسترن ميشيغان', nameEn: 'Western Michigan University', country: 'الولايات المتحدة', city: 'Kalamazoo, MI', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'ask-wmu@wmich.edu' },
  { nameAr: 'جامعة كولورادو ستيت', nameEn: 'Colorado State University', country: 'الولايات المتحدة', city: 'Fort Collins, CO', tier: 3, minGpa: 2.9, fields: ['engineering', 'science', 'business'], email: 'admissions@colostate.edu' },

  // ==================== UK (24) ====================
  // Tier 1
  { nameAr: 'جامعة أكسفورد', nameEn: 'University of Oxford', country: 'المملكة المتحدة', city: 'Oxford, England', tier: 1, minGpa: 3.8, fields: ['all'], email: 'undergraduate.admissions@admin.ox.ac.uk' },
  { nameAr: 'جامعة كامبريدج', nameEn: 'University of Cambridge', country: 'المملكة المتحدة', city: 'Cambridge, England', tier: 1, minGpa: 3.8, fields: ['all'], email: 'admissions@cam.ac.uk' },
  { nameAr: 'إمبريال كوليدج لندن', nameEn: 'Imperial College London', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['engineering', 'cs', 'medical', 'science', 'business'], email: 'admissions@imperial.ac.uk' },
  { nameAr: 'يونيفرستي كوليدج لندن', nameEn: 'University College London (UCL)', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['all'], email: 'admissions@ucl.ac.uk' },
  { nameAr: 'مدرسة لندن للاقتصاد', nameEn: 'London School of Economics (LSE)', country: 'المملكة المتحدة', city: 'London, England', tier: 1, minGpa: 3.7, fields: ['business', 'social', 'law'], email: 'ug-admissions@lse.ac.uk' },
  { nameAr: 'جامعة إدنبرة', nameEn: 'University of Edinburgh', country: 'المملكة المتحدة', city: 'Edinburgh, Scotland', tier: 1, minGpa: 3.6, fields: ['all'], email: 'futurestudents@ed.ac.uk' },
  // Tier 2
  { nameAr: 'جامعة مانشستر', nameEn: 'University of Manchester', country: 'المملكة المتحدة', city: 'Manchester, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'cs'], email: 'ug-admissions@manchester.ac.uk' },
  { nameAr: 'كينغز كوليدج لندن', nameEn: "King's College London", country: 'المملكة المتحدة', city: 'London, England', tier: 2, minGpa: 3.4, fields: ['medical', 'law', 'social', 'business'], email: 'ug-admissions@kcl.ac.uk' },
  { nameAr: 'جامعة بريستول', nameEn: 'University of Bristol', country: 'المملكة المتحدة', city: 'Bristol, England', tier: 2, minGpa: 3.4, fields: ['engineering', 'medical', 'science', 'social'], email: 'ug-admissions@bristol.ac.uk' },
  { nameAr: 'جامعة وارويك', nameEn: 'University of Warwick', country: 'المملكة المتحدة', city: 'Coventry, England', tier: 2, minGpa: 3.4, fields: ['business', 'engineering', 'cs', 'social'], email: 'ugadmissions@warwick.ac.uk' },
  { nameAr: 'جامعة غلاسكو', nameEn: 'University of Glasgow', country: 'المملكة المتحدة', city: 'Glasgow, Scotland', tier: 2, minGpa: 3.3, fields: ['medical', 'engineering', 'business', 'arts'], email: 'ug-admissions@glasgow.ac.uk' },
  { nameAr: 'جامعة كارديف', nameEn: 'Cardiff University', country: 'المملكة المتحدة', city: 'Cardiff, Wales', tier: 2, minGpa: 3.2, fields: ['engineering', 'medical', 'business', 'social'], email: 'admissions@cardiff.ac.uk' },
  { nameAr: 'جامعة ليدز', nameEn: 'University of Leeds', country: 'المملكة المتحدة', city: 'Leeds, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'arts'], email: 'admissions@leeds.ac.uk' },
  { nameAr: 'جامعة شيفيلد', nameEn: 'University of Sheffield', country: 'المملكة المتحدة', city: 'Sheffield, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'ug-admissions@sheffield.ac.uk' },
  { nameAr: 'جامعة نوتنغهام', nameEn: 'University of Nottingham', country: 'المملكة المتحدة', city: 'Nottingham, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'undergraduate-enquiries@nottingham.ac.uk' },
  { nameAr: 'جامعة برمنغهام', nameEn: 'University of Birmingham', country: 'المملكة المتحدة', city: 'Birmingham, England', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'social'], email: 'admissions@contacts.bham.ac.uk' },
  // Tier 3
  { nameAr: 'جامعة سوانزي', nameEn: 'Swansea University', country: 'المملكة المتحدة', city: 'Swansea, Wales', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'admissions@swansea.ac.uk' },
  { nameAr: 'جامعة أبردين', nameEn: 'University of Aberdeen', country: 'المملكة المتحدة', city: 'Aberdeen, Scotland', tier: 3, minGpa: 2.8, fields: ['engineering', 'medical', 'business'], email: 'sras@abdn.ac.uk' },
  { nameAr: 'جامعة ستيرلنغ', nameEn: 'University of Stirling', country: 'المملكة المتحدة', city: 'Stirling, Scotland', tier: 3, minGpa: 2.7, fields: ['business', 'education', 'social'], email: 'admissions@stir.ac.uk' },
  { nameAr: 'جامعة أنجيليا روسكين', nameEn: 'Anglia Ruskin University', country: 'المملكة المتحدة', city: 'Cambridge, England', tier: 3, minGpa: 2.7, fields: ['business', 'medical', 'arts'], email: 'answers@aru.ac.uk' },
  { nameAr: 'جامعة كوفنتري', nameEn: 'Coventry University', country: 'المملكة المتحدة', city: 'Coventry, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'arts'], email: 'studentenquiries@coventry.ac.uk' },
  { nameAr: 'جامعة بورتسموث', nameEn: 'University of Portsmouth', country: 'المملكة المتحدة', city: 'Portsmouth, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'social'], email: 'admissions@port.ac.uk' },
  { nameAr: 'جامعة ديربي', nameEn: 'University of Derby', country: 'المملكة المتحدة', city: 'Derby, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'askadmissions@derby.ac.uk' },
  { nameAr: 'جامعة تيسايد', nameEn: 'Teesside University', country: 'المملكة المتحدة', city: 'Middlesbrough, England', tier: 3, minGpa: 2.7, fields: ['engineering', 'cs', 'business'], email: 'registry@tees.ac.uk' },

  // ==================== CANADA (16) ====================
  // Tier 1
  { nameAr: 'جامعة تورنتو', nameEn: 'University of Toronto', country: 'كندا', city: 'Toronto, ON', tier: 1, minGpa: 3.7, fields: ['all'], email: 'ask.admissions@utoronto.ca' },
  { nameAr: 'جامعة ماكغيل', nameEn: 'McGill University', country: 'كندا', city: 'Montreal, QC', tier: 1, minGpa: 3.7, fields: ['all'], email: 'admissions@mcgill.ca' },
  { nameAr: 'جامعة بريتش كولومبيا', nameEn: 'University of British Columbia', country: 'كندا', city: 'Vancouver, BC', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international.inquiry@ubc.ca' },
  { nameAr: 'جامعة واترلو', nameEn: 'University of Waterloo', country: 'كندا', city: 'Waterloo, ON', tier: 1, minGpa: 3.6, fields: ['engineering', 'cs', 'science'], email: 'myapplication@uwaterloo.ca' },
  // Tier 2
  { nameAr: 'جامعة ألبرتا', nameEn: 'University of Alberta', country: 'كندا', city: 'Edmonton, AB', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'science'], email: 'beabear@ualberta.ca' },
  { nameAr: 'جامعة كالغاري', nameEn: 'University of Calgary', country: 'كندا', city: 'Calgary, AB', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical'], email: 'futurestudents@ucalgary.ca' },
  { nameAr: 'جامعة أوتاوا', nameEn: 'University of Ottawa', country: 'كندا', city: 'Ottawa, ON', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'law', 'business'], email: 'admission@uottawa.ca' },
  { nameAr: 'جامعة ماكماستر', nameEn: 'McMaster University', country: 'كندا', city: 'Hamilton, ON', tier: 2, minGpa: 3.4, fields: ['engineering', 'medical', 'business'], email: 'macask@mcmaster.ca' },
  { nameAr: 'جامعة كوينز', nameEn: "Queen's University", country: 'كندا', city: 'Kingston, ON', tier: 2, minGpa: 3.4, fields: ['business', 'engineering', 'medical'], email: 'admission@queensu.ca' },
  { nameAr: 'جامعة ويسترن أونتاريو', nameEn: 'Western University', country: 'كندا', city: 'London, ON', tier: 2, minGpa: 3.3, fields: ['business', 'medical', 'engineering'], email: 'welcome@uwo.ca' },
  // Tier 3
  { nameAr: 'جامعة كارلتون', nameEn: 'Carleton University', country: 'كندا', city: 'Ottawa, ON', tier: 3, minGpa: 2.8, fields: ['engineering', 'cs', 'business'], email: 'admissions@carleton.ca' },
  { nameAr: 'جامعة ريجاينا', nameEn: 'University of Regina', country: 'كندا', city: 'Regina, SK', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'admissions.office@uregina.ca' },
  { nameAr: 'جامعة ونزور', nameEn: 'University of Windsor', country: 'كندا', city: 'Windsor, ON', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'askuw@uwindsor.ca' },
  { nameAr: 'جامعة ليكهيد', nameEn: 'Lakehead University', country: 'كندا', city: 'Thunder Bay, ON', tier: 3, minGpa: 2.7, fields: ['engineering', 'business', 'education'], email: 'admissions@lakeheadu.ca' },
  { nameAr: 'جامعة برانسوك الجديدة', nameEn: 'University of New Brunswick', country: 'كندا', city: 'Fredericton, NB', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'science'], email: 'admissions@unb.ca' },
  { nameAr: 'جامعة ميموريال في نيوفاوندلاند', nameEn: 'Memorial University of Newfoundland', country: 'كندا', city: "St. John's, NL", tier: 3, minGpa: 2.7, fields: ['engineering', 'medical', 'business'], email: 'reghelp@mun.ca' },

  // ==================== AUSTRALIA (16) ====================
  // Tier 1
  { nameAr: 'جامعة ملبورن', nameEn: 'University of Melbourne', country: 'أستراليا', city: 'Melbourne, VIC', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international@unimelb.edu.au' },
  { nameAr: 'الجامعة الوطنية الأسترالية', nameEn: 'Australian National University', country: 'أستراليا', city: 'Canberra, ACT', tier: 1, minGpa: 3.6, fields: ['all'], email: 'admissions@anu.edu.au' },
  { nameAr: 'جامعة سيدني', nameEn: 'University of Sydney', country: 'أستراليا', city: 'Sydney, NSW', tier: 1, minGpa: 3.6, fields: ['all'], email: 'international.admissions@sydney.edu.au' },
  { nameAr: 'جامعة نيو ساوث ويلز', nameEn: 'University of New South Wales (UNSW)', country: 'أستراليا', city: 'Sydney, NSW', tier: 1, minGpa: 3.6, fields: ['engineering', 'business', 'medical', 'cs'], email: 'intl.admissions@unsw.edu.au' },
  // Tier 2
  { nameAr: 'جامعة كوينزلاند', nameEn: 'University of Queensland', country: 'أستراليا', city: 'Brisbane, QLD', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business', 'science'], email: 'international@uq.edu.au' },
  { nameAr: 'جامعة موناش', nameEn: 'Monash University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical', 'law'], email: 'international@monash.edu' },
  { nameAr: 'جامعة غرب أستراليا', nameEn: 'University of Western Australia', country: 'أستراليا', city: 'Perth, WA', tier: 2, minGpa: 3.3, fields: ['engineering', 'medical', 'business'], email: 'askuwa@uwa.edu.au' },
  { nameAr: 'جامعة أديلايد', nameEn: 'University of Adelaide', country: 'أستراليا', city: 'Adelaide, SA', tier: 2, minGpa: 3.2, fields: ['engineering', 'medical', 'business', 'science'], email: 'international@adelaide.edu.au' },
  { nameAr: 'جامعة تكنولوجيا كوينزلاند', nameEn: 'Queensland University of Technology', country: 'أستراليا', city: 'Brisbane, QLD', tier: 2, minGpa: 3.2, fields: ['engineering', 'business', 'cs', 'arts'], email: 'international@qut.edu.au' },
  { nameAr: 'جامعة تكنولوجيا سيدني', nameEn: 'University of Technology Sydney (UTS)', country: 'أستراليا', city: 'Sydney, NSW', tier: 2, minGpa: 3.2, fields: ['engineering', 'business', 'cs', 'arts'], email: 'international@uts.edu.au' },
  // Tier 3
  { nameAr: 'جامعة غريفيث', nameEn: 'Griffith University', country: 'أستراليا', city: 'Brisbane, QLD', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'medical', 'arts'], email: 'international@griffith.edu.au' },
  { nameAr: 'جامعة ماكواري', nameEn: 'Macquarie University', country: 'أستراليا', city: 'Sydney, NSW', tier: 3, minGpa: 2.8, fields: ['business', 'cs', 'arts', 'social'], email: 'study@mq.edu.au' },
  { nameAr: 'جامعة ديكن', nameEn: 'Deakin University', country: 'أستراليا', city: 'Melbourne, VIC', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'medical'], email: 'international@deakin.edu.au' },
  { nameAr: 'جامعة جيمس كوك', nameEn: 'James Cook University', country: 'أستراليا', city: 'Townsville, QLD', tier: 3, minGpa: 2.7, fields: ['medical', 'science', 'engineering'], email: 'international@jcu.edu.au' },
  { nameAr: 'جامعة كورتين', nameEn: 'Curtin University', country: 'أستراليا', city: 'Perth, WA', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'medical'], email: 'international@curtin.edu.au' },
  { nameAr: 'جامعة ولونغونغ', nameEn: 'University of Wollongong', country: 'أستراليا', city: 'Wollongong, NSW', tier: 3, minGpa: 2.8, fields: ['engineering', 'business', 'cs'], email: 'international@uow.edu.au' },

  // ==================== JAPAN (10) - English-taught programs ====================
  // Tier 1
  { nameAr: 'جامعة طوكيو', nameEn: 'University of Tokyo', country: 'اليابان', city: 'Tokyo', tier: 1, minGpa: 3.6, fields: ['engineering', 'science', 'social'], email: 'info.admissions@adm.u-tokyo.ac.jp', englishGradOnly: true },
  { nameAr: 'جامعة كيوتو', nameEn: 'Kyoto University', country: 'اليابان', city: 'Kyoto', tier: 1, minGpa: 3.5, fields: ['engineering', 'science', 'medical'], email: 'nyushi@mail.adm.kyoto-u.ac.jp', englishGradOnly: true },
  { nameAr: 'جامعة أوساكا', nameEn: 'Osaka University', country: 'اليابان', city: 'Osaka', tier: 1, minGpa: 3.5, fields: ['engineering', 'medical', 'science'], email: 'nyushi-section@office.osaka-u.ac.jp', englishGradOnly: true },
  // Tier 2
  { nameAr: 'جامعة طوكيو للتكنولوجيا', nameEn: 'Tokyo Institute of Technology', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['engineering', 'cs', 'science'], email: 'nyu.adm@jim.titech.ac.jp', englishGradOnly: true },
  { nameAr: 'جامعة توهوكو', nameEn: 'Tohoku University', country: 'اليابان', city: 'Sendai', tier: 2, minGpa: 3.3, fields: ['engineering', 'science', 'medical'], email: 'nyushi@grp.tohoku.ac.jp', englishGradOnly: true },
  { nameAr: 'جامعة واسيدا', nameEn: 'Waseda University', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['business', 'engineering', 'social', 'arts'], email: 'admission@list.waseda.jp' },
  { nameAr: 'جامعة كييو', nameEn: 'Keio University', country: 'اليابان', city: 'Tokyo', tier: 2, minGpa: 3.3, fields: ['business', 'medical', 'engineering', 'social'], email: 'kic-ic@adst.keio.ac.jp' },
  // Tier 3
  { nameAr: 'جامعة ريتسوميكان', nameEn: 'Ritsumeikan University', country: 'اليابان', city: 'Kyoto', tier: 3, minGpa: 2.8, fields: ['business', 'social', 'arts'], email: 'admissions-ap@st.ritsumei.ac.jp' },
  { nameAr: 'جامعة آسيا والباسفيك ريتسوميكان', nameEn: 'Ritsumeikan Asia Pacific University', country: 'اليابان', city: 'Beppu', tier: 3, minGpa: 2.8, fields: ['business', 'social'], email: 'apuadmit@apu.ac.jp' },
  { nameAr: 'جامعة صوفيا', nameEn: 'Sophia University', country: 'اليابان', city: 'Tokyo', tier: 3, minGpa: 2.9, fields: ['business', 'social', 'arts'], email: 'adm-info@sophia.ac.jp' },

  // ==================== SOUTH KOREA (10) - English-taught programs ====================
  // Tier 1
  { nameAr: 'جامعة سيول الوطنية', nameEn: 'Seoul National University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 1, minGpa: 3.6, fields: ['engineering', 'business', 'medical', 'science'], email: 'snuadmit@snu.ac.kr', englishGradOnly: true },
  { nameAr: 'كايست', nameEn: 'KAIST', country: 'كوريا الجنوبية', city: 'Daejeon', tier: 1, minGpa: 3.5, fields: ['engineering', 'cs', 'science'], email: 'admission@kaist.ac.kr' },
  { nameAr: 'جامعة يونسي', nameEn: 'Yonsei University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 1, minGpa: 3.5, fields: ['business', 'engineering', 'medical', 'social'], email: 'admission@yonsei.ac.kr' },
  // Tier 2
  { nameAr: 'جامعة كوريا', nameEn: 'Korea University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.3, fields: ['business', 'engineering', 'social', 'law'], email: 'admissions@korea.ac.kr' },
  { nameAr: 'بوستيك', nameEn: 'POSTECH', country: 'كوريا الجنوبية', city: 'Pohang', tier: 2, minGpa: 3.4, fields: ['engineering', 'science', 'cs'], email: 'admission@postech.ac.kr' },
  { nameAr: 'جامعة سونغ كيون كوان', nameEn: 'Sungkyunkwan University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'medical'], email: 'admissions@skku.edu' },
  { nameAr: 'جامعة هانيانج', nameEn: 'Hanyang University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 2, minGpa: 3.3, fields: ['engineering', 'business', 'cs'], email: 'iao@hanyang.ac.kr' },
  // Tier 3
  { nameAr: 'جامعة إيوها للنساء', nameEn: 'Ewha Womans University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.9, fields: ['business', 'social', 'arts', 'medical'], email: 'intl@ewha.ac.kr' },
  { nameAr: 'جامعة كيونغ هي', nameEn: 'Kyung Hee University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.8, fields: ['business', 'medical', 'social'], email: 'iao@khu.ac.kr' },
  { nameAr: 'جامعة تشونغ آنغ', nameEn: 'Chung-Ang University', country: 'كوريا الجنوبية', city: 'Seoul', tier: 3, minGpa: 2.8, fields: ['business', 'arts', 'social'], email: 'oia@cau.ac.kr' },

  // ==================== SPAIN (9) - English-taught programs ====================
  // Tier 1
  { nameAr: 'كلية آي إي للأعمال', nameEn: 'IE Business School', country: 'إسبانيا', city: 'Madrid', tier: 1, minGpa: 3.5, fields: ['business'], email: 'admissions@ie.edu' },
  { nameAr: 'كلية إياسي للأعمال', nameEn: 'IESE Business School', country: 'إسبانيا', city: 'Barcelona', tier: 1, minGpa: 3.5, fields: ['business'], email: 'admissions@iese.edu' },
  // Tier 2
  { nameAr: 'جامعة بومبيو فابرا', nameEn: 'Pompeu Fabra University', country: 'إسبانيا', city: 'Barcelona', tier: 2, minGpa: 3.3, fields: ['business', 'social', 'cs'], email: 'info@upf.edu', englishGradOnly: true },
  { nameAr: 'جامعة برشلونة', nameEn: 'University of Barcelona', country: 'إسبانيا', city: 'Barcelona', tier: 2, minGpa: 3.3, fields: ['medical', 'science', 'business'], email: 'info@ub.edu', englishGradOnly: true },
  { nameAr: 'جامعة كومبلوتنسي في مدريد', nameEn: 'Complutense University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 2, minGpa: 3.2, fields: ['medical', 'social', 'law'], email: 'info.internacional@ucm.es', englishGradOnly: true },
  { nameAr: 'جامعة كارلوس الثالث في مدريد', nameEn: 'Carlos III University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 2, minGpa: 3.2, fields: ['business', 'engineering', 'cs'], email: 'infocom@uc3m.es' },
  // Tier 3
  { nameAr: 'جامعة نافارا', nameEn: 'University of Navarra', country: 'إسبانيا', city: 'Pamplona', tier: 3, minGpa: 2.9, fields: ['business', 'medical', 'social'], email: 'admissions@unav.edu' },
  { nameAr: 'جامعة أوتونوما في مدريد', nameEn: 'Autonomous University of Madrid', country: 'إسبانيا', city: 'Madrid', tier: 3, minGpa: 2.8, fields: ['business', 'medical', 'science'], email: 'oficina.international@uam.es', englishGradOnly: true },
  { nameAr: 'جامعة غرناطة', nameEn: 'University of Granada', country: 'إسبانيا', city: 'Granada', tier: 3, minGpa: 2.8, fields: ['medical', 'business', 'arts'], email: 'intlwelcome@ugr.es', englishGradOnly: true },

  // ==================== NEW ZEALAND (8) ====================
  // Tier 1
  { nameAr: 'جامعة أوكلاند', nameEn: 'University of Auckland', country: 'نيوزيلندا', city: 'Auckland', tier: 1, minGpa: 3.5, fields: ['all'], email: 'international@auckland.ac.nz' },
  { nameAr: 'جامعة أوتاغو', nameEn: 'University of Otago', country: 'نيوزيلندا', city: 'Dunedin', tier: 1, minGpa: 3.4, fields: ['medical', 'business', 'social', 'science'], email: 'international@otago.ac.nz' },
  // Tier 2
  { nameAr: 'جامعة فيكتوريا في ولنغتون', nameEn: 'Victoria University of Wellington', country: 'نيوزيلندا', city: 'Wellington', tier: 2, minGpa: 3.2, fields: ['business', 'social', 'law', 'arts'], email: 'international@vuw.ac.nz' },
  { nameAr: 'جامعة كانتربري', nameEn: 'University of Canterbury', country: 'نيوزيلندا', city: 'Christchurch', tier: 2, minGpa: 3.2, fields: ['engineering', 'science', 'business'], email: 'international@canterbury.ac.nz' },
  { nameAr: 'جامعة وايكاتو', nameEn: 'University of Waikato', country: 'نيوزيلندا', city: 'Hamilton', tier: 2, minGpa: 3.1, fields: ['business', 'engineering', 'education'], email: 'international@waikato.ac.nz' },
  // Tier 3
  { nameAr: 'جامعة ماسي', nameEn: 'Massey University', country: 'نيوزيلندا', city: 'Palmerston North', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'science'], email: 'international@massey.ac.nz' },
  { nameAr: 'جامعة تكنولوجيا أوكلاند', nameEn: 'Auckland University of Technology (AUT)', country: 'نيوزيلندا', city: 'Auckland', tier: 3, minGpa: 2.8, fields: ['business', 'engineering', 'cs', 'arts'], email: 'international@aut.ac.nz' },
  { nameAr: 'جامعة لينكولن', nameEn: 'Lincoln University', country: 'نيوزيلندا', city: 'Christchurch', tier: 3, minGpa: 2.7, fields: ['business', 'science'], email: 'international@lincoln.ac.nz' }
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
  if (diff >= 0.4) return 'فرصة ممتازة - جامعة آمنة';
  if (diff >= 0.1) return 'فرصة جيدة - جامعة مناسبة';
  if (diff >= -0.2) return 'فرصة تنافسية - جامعة طموحة';
  return 'فرصة صعبة - تحتاج نقاط قوة إضافية';
}

function parseCountries(countriesText) {
  const t = (countriesText || '').toLowerCase();
  const countries = [];
  if (/usa|america|united states|أمريك|ولايات/.test(t)) countries.push('الولايات المتحدة');
  if (/uk|britain|england|scotland|wales|united kingdom|بريطان|إنجل|المملكة المتحدة|إسكتلن|ويلز/.test(t)) countries.push('المملكة المتحدة');
  if (/canada|كند/.test(t)) countries.push('كندا');
  if (/australia|أسترال/.test(t)) countries.push('أستراليا');
  if (/japan|يابان/.test(t)) countries.push('اليابان');
  if (/korea|كوري/.test(t)) countries.push('كوريا الجنوبية');
  if (/spain|إسبان|اسبان/.test(t)) countries.push('إسبانيا');
  if (/new zealand|نيوزيل/.test(t)) countries.push('نيوزيلندا');
  return countries.length > 0 ? countries : ['الولايات المتحدة', 'المملكة المتحدة', 'كندا', 'أستراليا', 'اليابان', 'كوريا الجنوبية', 'إسبانيا', 'نيوزيلندا'];
}

function filterUniversities(answers) {
  const fieldCats = categorizeField(answers.field);
  const preferredCountries = parseCountries(answers.countries);
  const studentGpa4 = normalizeGpa(answers.gpa, answers.gpaScale);
  const isUndergrad = answers.degreeLevel === 'bachelor';

  const candidates = UNIVERSITIES.filter(u => {
    if (!preferredCountries.includes(u.country)) return false;
    const hasFieldMatch = u.fields.includes('all') || fieldCats.some(fc => u.fields.includes(fc));
    if (!hasFieldMatch) return false;
    if (u.englishGradOnly && isUndergrad) return false;
    if (studentGpa4 < u.minGpa - 0.3) return false;
    return true;
  });

  // Sort by fit: prefer universities close to or above student's GPA, mix tiers
  candidates.sort((a, b) => {
    const fitA = studentGpa4 - a.minGpa;
    const fitB = studentGpa4 - b.minGpa;
    if (Math.abs(fitA - fitB) < 0.3) return a.tier - b.tier;
    return Math.abs(fitA) - Math.abs(fitB);
  });

  // Pick a diverse mix: try to include multiple tiers
  const selected = [];
  const seenTiers = new Set();
  for (const uni of candidates) {
    if (selected.length >= 12) break;
    selected.push(uni);
    seenTiers.add(uni.tier);
  }

  return selected.slice(0, 10).map(u => ({
    nameAr: u.nameAr,
    nameEn: u.nameEn,
    country: u.country,
    city: u.city,
    tier: tierLabel(u.tier),
    fitLevel: fitLabel(studentGpa4, u.minGpa),
    email: u.email,
    link: `https://www.google.com/search?q=${encodeURIComponent(u.nameEn + ' ' + (answers.field || '') + ' ' + (answers.degreeLevel === 'master' ? 'graduate' : answers.degreeLevel === 'phd' ? 'PhD' : 'admission'))}`,
    fields: u.fields,
    minGpaRequired: u.minGpa
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
      fit: '', // AI will fill this in
      link: p.link,
      linkLabel: p.linkLabel
    }));
}

function getRequirements(answers) {
  const reqs = [
    'تصديق الشهادات السابقة من وزارة التعليم في حال كانت صادرة من خارج المملكة',
    'بطاقة هوية وطنية سارية المفعول (ليست من النوع القديم بدون شريحة)',
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
      reqs.push('بعض البرامج الحكومية تشترط وجود محرم للطالبات، راجع الشروط الخاصة ببرنامج الابتعاث الذي تتقدمين له');
    } else {
      reqs.push('وجود المحرم: يجب تسجيله في طلب الابتعاث والحصول على تأشيرة مرافق له');
    }
  }
  return reqs;
}

function profileKey(answers) {
  const key = `${answers.academicLevel}|${Math.floor(parseFloat(answers.gpa || 0) * 2) / 2}|${answers.gpaScale}|${answers.english}|${(answers.field || '').toLowerCase().trim().substring(0, 30)}|${answers.degreeLevel}|${(answers.countries || '').toLowerCase().trim().substring(0, 30)}|${answers.budget}|${answers.gender}|${answers.mahram || ''}`;
  return 'rec2:' + crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

// ============ MAIN HANDLER ============
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
    const universities = filterUniversities(answers);
    const requirements = getRequirements(answers);
    const studentGpa4 = normalizeGpa(answers.gpa, answers.gpaScale);

    // Prepare a concise list of universities for the AI to choose from and annotate
    const uniForAI = universities.map((u, i) => `${i + 1}. ${u.nameEn} (${u.country} - ${u.tier}, ${u.fitLevel})`).join('\n');
    const programNames = programs.map(p => p.name).join(' | ');

    const prompt = `أنت مستشار ابتعاث خبير ومحنك للطلاب السعوديين. مهمتك تقديم تحليل حقيقي ومفيد، ليس ملخصاً لما قاله الطالب.

ملف الطالب:
- المستوى الأكاديمي: ${answers.academicLevel}
- الجامعة الحالية: ${answers.currentInstitution}
- المعدل: ${answers.gpa} من ${answers.gpaScale} (يعادل ${studentGpa4.toFixed(2)} من 4.0)
- الإنجليزية: ${answers.english}${answers.englishScore ? ' - الدرجة: ' + answers.englishScore : ''}
- التخصص المرغوب: ${answers.field}
- الدرجة المطلوبة: ${answers.degreeLevel}
- الدول المفضلة: ${answers.countries}
- خطة التمويل: ${answers.budget}
- الجنس: ${answers.gender}${answers.mahram ? ' - المحرم: ' + answers.mahram : ''}
- الشغف والإنجازات: ${answers.passions}
- الأهداف المهنية: ${answers.goals}

البرامج الحكومية المرشحة له: ${programNames}

الجامعات المرشحة له (مختارة من قاعدة بياناتنا):
${uniForAI}

مهمتك - أرجع JSON فقط بهذا الشكل:
{
  "analysis": "تحليل ذكي في فقرتين (لا تكرر المعلومات). ركز على: (1) تقييم صريح لتنافسية ملفه في الدول المختارة بناءً على معدله وشغفه، (2) أبرز نقاط القوة والضعف، (3) توقعات واقعية لفرص القبول والابتعاث. تحدث بلهجة مستشار حقيقي.",
  "programsFit": [
    {"name": "اسم البرنامج كما هو أعلاه بالضبط", "fit": "جملة أو جملتان توضح بدقة لماذا يناسب هذا الطالب تحديداً - لا عموميات"}
  ],
  "nextSteps": [
    "خطوة عملية محددة 1",
    "خطوة عملية محددة 2",
    "خطوة عملية محددة 3",
    "خطوة عملية محددة 4",
    "خطوة عملية محددة 5"
  ],
  "universityNotes": [
    {"nameEn": "الاسم كما هو أعلاه بالضبط", "note": "ملاحظة قصيرة ومخصصة لهذا الطالب عن سبب الترشيح"}
  ]
}

قواعد صارمة:
- JSON صالح بدون markdown، ابدأ بـ { وانتهِ بـ }
- الخطوات العملية محددة وقابلة للتنفيذ (مثل: سجل في منصة سفير خلال الأسبوع القادم، تقدم لاختبار IELTS في موعد X)
- لا تخترع أسماء برامج أو جامعات ليست في القائمة أعلاه
- كن صريحاً وواقعياً، لا تنفخ الأمل بلا أساس ولا تحبط بلا سبب
- الرد باللغة العربية فقط`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
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

    let aiResult;
    try {
      aiResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse failed, using fallback:', e);
      aiResult = { analysis: '', programsFit: [], nextSteps: [], universityNotes: [] };
    }

    // Merge AI fit descriptions into programs
    const programsWithFit = programs.map(p => {
      const match = (aiResult.programsFit || []).find(pf => pf.name && pf.name.includes(p.name.substring(0, 20)));
      return { ...p, fit: match?.fit || 'يتوافق مع مستواك الأكاديمي وتخصصك' };
    });

    // Merge AI notes into universities
    const universitiesWithNotes = universities.map(u => {
      const match = (aiResult.universityNotes || []).find(un => un.nameEn && un.nameEn.includes(u.nameEn.substring(0, 15)));
      return { ...u, notes: match?.note || `${u.tier} - ${u.fitLevel}` };
    });

    const finalResult = {
      analysis: aiResult.analysis || 'تم تحليل ملفك بنجاح، راجع التوصيات أدناه.',
      programs: programsWithFit,
      universities: universitiesWithNotes,
      requirements: requirements,
      nextSteps: aiResult.nextSteps || []
    };

    await redis.set(cacheKey, JSON.stringify(finalResult), { ex: 60 * 60 * 24 * 30 });

    return res.status(200).json(finalResult);
  } catch (err) {
    console.error('Recommend error:', err);
    return res.status(500).json({ error: 'حدث خطأ في المعالجة. حاول مرة أخرى.' });
  }
}
