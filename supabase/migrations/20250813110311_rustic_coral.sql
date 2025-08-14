/*
  # إنشاء جدول الأسئلة المتكررة

  1. الجداول الجديدة
    - `faqs`
      - `id` (uuid, primary key)
      - `question` (text, required)
      - `answer` (text, required)
      - `category` (text, default 'عام')
      - `order_index` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `faqs`
    - سياسة للجميع لقراءة الأسئلة النشطة
    - سياسة للأدمن لإدارة الأسئلة

  3. البيانات التجريبية
    - 6 أسئلة متكررة جاهزة للاستخدام
*/

-- إنشاء جدول الأسئلة المتكررة
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'عام'::text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- سياسات الأسئلة المتكررة
CREATE POLICY "Anyone can read active FAQs"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
  ON faqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(order_index);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

-- إدراج بعض الأسئلة المتكررة كأمثلة
INSERT INTO faqs (question, answer, category, order_index) VALUES
('كيف يمكنني طلب خدمة الترجمة المحلفة؟', 'يمكنك طلب خدمة الترجمة المحلفة من خلال تسجيل الدخول إلى حسابك، ثم اختيار "خدمات الترجمة المحلفة" من قائمة الخدمات، وملء النموذج المطلوب. سيتم التواصل معك خلال 24 ساعة لتأكيد التفاصيل.', 'الترجمة', 1),
('ما هي مدة إنجاز خدمة الترجمة؟', 'تختلف مدة الإنجاز حسب نوع الوثيقة وحجمها. عادة ما تستغرق الترجمة المحلفة من 1-3 أيام عمل للوثائق العادية، و3-5 أيام للوثائق المعقدة أو الكبيرة.', 'الترجمة', 2),
('هل الترجمة معتمدة رسمياً؟', 'نعم، جميع ترجماتنا معتمدة ومحلفة من قبل مترجمين معتمدين لدى الجهات الرسمية التركية، ومقبولة في جميع المؤسسات الحكومية والخاصة.', 'الترجمة', 3),
('كيف يمكنني تتبع حالة طلبي؟', 'يمكنك تتبع حالة طلبك من خلال تسجيل الدخول إلى حسابك والذهاب إلى قسم "معاملاتي". ستجد هناك جميع طلباتك مع حالتها الحالية وأي ملاحظات من فريقنا.', 'عام', 4),
('ما هي طرق الدفع المتاحة؟', 'نقبل الدفع نقداً عند التسليم، أو التحويل البنكي، أو الدفع الإلكتروني. سيتم إعلامك بتفاصيل الدفع عند تأكيد طلبك.', 'عام', 5),
('هل تقدمون خدمات في مدن أخرى غير مرسين؟', 'نعم، نقدم خدماتنا في جميع أنحاء تركيا. قد تختلف أوقات التسليم حسب المدينة، وسيتم إعلامك بالتفاصيل عند طلب الخدمة.', 'عام', 6);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_faqs_updated_at();
