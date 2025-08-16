-- تطبيق الترجمات العربية على شركات التأمين
-- Apply Arabic translations to insurance companies

-- تحديث الشركات الموجودة
UPDATE insurance_companies 
SET name_ar = CASE 
    WHEN name = 'Allianz' THEN 'أليانز'
    WHEN name = 'Axa' THEN 'أكسا'
    WHEN name = 'Mapfre' THEN 'مابفري'
    WHEN name = 'Uniqa' THEN 'يونيكا'
    WHEN name = 'Groupama' THEN 'جروباما'
    WHEN name = 'Neova' THEN 'نيوفا'
    WHEN name = 'Anadolu' THEN 'أناضول'
    WHEN name = 'Gulf' THEN 'الخليج'
    WHEN name = 'Türkiye Sigorta' THEN 'تركيا للتأمين'
    WHEN name = 'Ray Sigorta' THEN 'راي للتأمين'
    WHEN name = 'Sompo Japan' THEN 'سومبو اليابان'
    WHEN name = 'HDI Sigorta' THEN 'إتش دي آي للتأمين'
    WHEN name = 'Generali' THEN 'جنرالي'
    WHEN name = 'Zurich' THEN 'زوريخ'
    WHEN name = 'Axa Sigorta' THEN 'أكسا للتأمين'
    WHEN name = 'Neova Sigorta' THEN 'نيوفا للتأمين'
    WHEN name = 'Gulf Sigorta' THEN 'الخليج للتأمين'
    WHEN name = 'Anadolu Sigorta' THEN 'أناضول للتأمين'
    WHEN name = 'Türkiye Halk Bankası' THEN 'بنك تركيا الشعبي'
    WHEN name = 'Ziraat Bankası' THEN 'بنك الزراعة'
    WHEN name = 'Garanti BBVA' THEN 'غارانتي بي بي في إيه'
    WHEN name = 'İş Bankası' THEN 'بنك الأعمال'
    WHEN name = 'Yapı Kredi' THEN 'يابي كريدي'
    WHEN name = 'Akbank' THEN 'أك بنك'
    WHEN name = 'Denizbank' THEN 'دينيز بنك'
    WHEN name = 'QNB Finansbank' THEN 'كي إن بي فينانسبنك'
    WHEN name = 'ING Bank' THEN 'آي إن جي بنك'
    WHEN name = 'HSBC' THEN 'إتش إس بي سي'
    WHEN name = 'Citibank' THEN 'سيتي بنك'
    WHEN name = 'Standard Chartered' THEN 'ستاندارد تشارترد'
    WHEN name = 'Deutsche Bank' THEN 'دويتشه بنك'
    WHEN name = 'BNP Paribas' THEN 'بي إن بي باريبا'
    WHEN name = 'Société Générale' THEN 'سوسيتيه جنرال'
    WHEN name = 'Crédit Agricole' THEN 'كريدي أجريكول'
    WHEN name = 'UniCredit' THEN 'يوني كريديت'
    WHEN name = 'Intesa Sanpaolo' THEN 'إنتيزا سان باولو'
    WHEN name = 'BBVA' THEN 'بي بي في إيه'
    WHEN name = 'Santander' THEN 'سانتاندر'
    WHEN name = 'CaixaBank' THEN 'كايكسا بنك'
    WHEN name = 'ING' THEN 'آي إن جي'
    WHEN name = 'Rabobank' THEN 'رابو بنك'
    WHEN name = 'ABN AMRO' THEN 'إيه بي إن أمرو'
    WHEN name = 'ING Group' THEN 'مجموعة آي إن جي'
    WHEN name = 'Allianz SE' THEN 'أليانز إس إي'
    WHEN name = 'Axa SA' THEN 'أكسا إس إيه'
    WHEN name = 'Generali Group' THEN 'مجموعة جنرالي'
    WHEN name = 'Zurich Insurance Group' THEN 'مجموعة زوريخ للتأمين'
    WHEN name = 'Mapfre SA' THEN 'مابفري إس إيه'
    WHEN name = 'Uniqa Insurance Group' THEN 'مجموعة يونيكا للتأمين'
    WHEN name = 'Groupama' THEN 'جروباما'
    WHEN name = 'Neova Insurance' THEN 'نيوفا للتأمين'
    WHEN name = 'Anadolu Insurance' THEN 'أناضول للتأمين'
    WHEN name = 'Gulf Insurance' THEN 'الخليج للتأمين'
    WHEN name = 'Türkiye Insurance' THEN 'تركيا للتأمين'
    WHEN name = 'Ray Insurance' THEN 'راي للتأمين'
    WHEN name = 'Sompo Japan Insurance' THEN 'سومبو اليابان للتأمين'
    WHEN name = 'HDI Insurance' THEN 'إتش دي آي للتأمين'
    ELSE name_ar
END
WHERE name_ar IS NULL OR name_ar = '';

-- إضافة شركات تأمين جديدة إذا لم تكن موجودة
INSERT INTO insurance_companies (name, name_ar, is_active) 
VALUES 
    ('Allianz', 'أليانز', true),
    ('Axa', 'أكسا', true),
    ('Mapfre', 'مابفري', true),
    ('Uniqa', 'يونيكا', true),
    ('Groupama', 'جروباما', true),
    ('Neova', 'نيوفا', true),
    ('Anadolu', 'أناضول', true),
    ('Gulf', 'الخليج', true),
    ('Türkiye Sigorta', 'تركيا للتأمين', true),
    ('Ray Sigorta', 'راي للتأمين', true),
    ('Sompo Japan', 'سومبو اليابان', true),
    ('HDI Sigorta', 'إتش دي آي للتأمين', true),
    ('Generali', 'جنرالي', true),
    ('Zurich', 'زوريخ', true)
ON CONFLICT (name) DO NOTHING;

-- عرض النتائج
SELECT name, name_ar, is_active FROM insurance_companies ORDER BY name;
