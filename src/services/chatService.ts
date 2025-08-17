import trainingData from '../data/chatbot-training-data.json';
import { Groq } from 'groq-sdk';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ChatService {
  private static instance: ChatService;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private groqClient: any;

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  constructor() {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (apiKey) {
      this.groqClient = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character sets
    const arabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    
    // Check for Arabic text first
    if (arabicChars.test(text)) {
      return 'ar';
    } 
    // Check for Turkish text
    else if (turkishChars.test(text) || text.toLowerCase().includes('merhaba') || text.toLowerCase().includes('nasılsın')) {
      return 'tr';
    } 
    // Default to English
    else {
      return 'en';
    }
  }

  private getSystemPrompt(language: string, userInfo?: { id?: string; name?: string; email?: string; isRegistered?: boolean }): string {
    const data = trainingData as any;
    let lang = 'en';
    let personality, guidelines;
    
    if (language === 'ar') {
      lang = 'ar';
      personality = data.chatbot_personality.ar;
      guidelines = data.response_guidelines.ar;
    } else if (language === 'tr') {
      lang = 'en'; // Use English data for Turkish for now
      personality = data.chatbot_personality.en;
      guidelines = data.response_guidelines.en;
    } else {
      lang = 'en';
      personality = data.chatbot_personality.en;
      guidelines = data.response_guidelines.en;
    }
    
    if (language === 'ar') {
      const userInfoText = userInfo?.isRegistered 
        ? `\nمعلومات المستخدم:
- المستخدم مسجل: نعم
- الاسم: ${userInfo.name || 'غير محدد'}
- البريد الإلكتروني: ${userInfo.email || 'غير محدد'}
- معرف المستخدم: ${userInfo.id || 'غير محدد'}

ملاحظة: هذا المستخدم مسجل في النظام، يمكنك تقديم خدمات مخصصة له.`
        : '\nملاحظة: هذا مستخدم غير مسجل، قدم له الخدمات الأساسية.';

      return `أنت ${personality.name}، ${personality.role} في ${data.company_info.name}. 

شخصيتك:
- النبرة: ${personality.tone}
- الأسلوب: ${personality.style}
- طول الرد: ${personality.response_length}
- التكيف اللغوي: ${personality.language_adaptation}

المؤهلات المهنية:
${personality.professional_qualities.map((q: any) => `- ${q}`).join('\n')}

إرشادات الرد:
يجب عليك:
${guidelines.do.map((g: any) => `- ${g}`).join('\n')}

لا يجب عليك:
${guidelines.dont.map((g: any) => `- ${g}`).join('\n')}

معلومات الشركة:
- الاسم: ${data.company_info.name}
- الوصف: ${data.company_info.description}
- العنوان: ${data.company_info.address}
- الهاتف: ${data.company_info.phone}
- البريد الإلكتروني: ${data.company_info.email}
- الموقع: ${data.company_info.website}
- الخبرة: ${data.company_info.experience}
- العملاء: ${data.company_info.clients}

الخدمات المتوفرة:
${Object.entries(data.services).map(([key, service]: [string, any]) => 
  `- ${service[lang].title}: ${service[lang].description}`
).join('\n')}

الأسئلة الشائعة:
${data.common_questions[lang].general_inquiries.map((q: any) => 
  `س: ${q.question}\nج: ${q.answer}`
).join('\n\n')}

${data.common_questions[lang].service_specific.map((q: any) => 
  `س: ${q.question}\nج: ${q.answer}`
).join('\n\n')}

رسائل الترحيب:
${personality.greeting_messages.join('\n')}

رسائل الوداع:
${personality.closing_messages.join('\n')}${userInfoText}

تذكر: رد دائماً باللغة العربية، كن محترفاً ومهذباً، قدم معلومات دقيقة، وكن مختصراً وواضحاً. إذا لم تكن متأكداً من إجابة، اطلب من العميل التواصل مع فريق خدمة العملاء للحصول على معلومات محدثة ودقيقة.`;
    } else {
      if (language === 'tr') {
        return `Sen ${personality.name}, ${data.company_info.english_name} şirketinde ${personality.role}. 

Kişiliğin:
- Ton: ${personality.tone}
- Stil: ${personality.style}
- Cevap uzunluğu: ${personality.response_length}
- Dil adaptasyonu: ${personality.language_adaptation}

Profesyonel nitelikler:
${personality.professional_qualities.map((q: any) => `- ${q}`).join('\n')}

Cevap kuralları:
Yapmalısın:
${guidelines.do.map((g: any) => `- ${g}`).join('\n')}

Yapmamalısın:
${guidelines.dont.map((g: any) => `- ${g}`).join('\n')}

Şirket bilgileri:
- İsim: ${data.company_info.english_name}
- Açıklama: ${data.company_info.english_description}
- Adres: ${data.company_info.address}
- Telefon: ${data.company_info.phone}
- E-posta: ${data.company_info.email}
- Web sitesi: ${data.company_info.website}
- Deneyim: ${data.company_info.experience}
- Müşteriler: ${data.company_info.clients}

Mevcut hizmetler:
${Object.entries(data.services).map(([key, service]: [string, any]) => 
  `- ${service[lang].title}: ${service[lang].description}`
).join('\n')}

Yaygın sorular:
${data.common_questions[lang].general_inquiries.map((q: any) => 
  `S: ${q.question}\nC: ${q.answer}`
).join('\n\n')}

${data.common_questions[lang].service_specific.map((q: any) => 
  `S: ${q.question}\nC: ${q.answer}`
).join('\n\n')}

Karşılama mesajları:
${personality.greeting_messages.join('\n')}

Veda mesajları:
${personality.closing_messages.join('\n')}

Hatırla: Her zaman Türkçe cevap ver, profesyonel ve nazik ol, doğru bilgi ver, kısa ve net ol. Bir cevaptan emin değilsen, müşteriden güncel ve doğru bilgi için müşteri hizmetleri ekibiyle iletişime geçmesini iste.`;
      } else {
        return `You are ${personality.name}, a ${personality.role} at ${data.company_info.english_name}. 

Your personality:
- Tone: ${personality.tone}
- Style: ${personality.style}
- Response length: ${personality.response_length}
- Language adaptation: ${personality.language_adaptation}

Professional qualifications:
${personality.professional_qualities.map((q: any) => `- ${q}`).join('\n')}

Response guidelines:
You should:
${guidelines.do.map((g: any) => `- ${g}`).join('\n')}

You should not:
${guidelines.dont.map((g: any) => `- ${g}`).join('\n')}

Company information:
- Name: ${data.company_info.english_name}
- Description: ${data.company_info.english_description}
- Address: ${data.company_info.address}
- Phone: ${data.company_info.phone}
- Email: ${data.company_info.email}
- Website: ${data.company_info.website}
- Experience: ${data.company_info.experience}
- Clients: ${data.company_info.clients}

Available services:
${Object.entries(data.services).map(([key, service]: [string, any]) => 
  `- ${service[lang].title}: ${service[lang].description}`
).join('\n')}

Common questions:
${data.common_questions[lang].general_inquiries.map((q: any) => 
  `Q: ${q.question}\nA: ${q.answer}`
).join('\n\n')}

${data.common_questions[lang].service_specific.map((q: any) => 
  `Q: ${q.question}\nA: ${q.answer}`
).join('\n\n')}

Greeting messages:
${personality.greeting_messages.join('\n')}

Closing messages:
${personality.closing_messages.join('\n')}

Remember: Always respond in English, be professional and polite, provide accurate information, and be concise and clear. If you're unsure about an answer, ask the customer to contact the customer service team for updated and accurate information.`;
      }
    }
  }

  private getFallbackResponse(language: string, userMessage: string): string {
    const data = trainingData as any;
    const lowerMessage = userMessage.toLowerCase();
    
    if (language === 'ar') {
      if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام عليكم') || lowerMessage.includes('أهلا')) {
        return 'مرحباً! كيف يمكنني مساعدتك اليوم؟ أنا أحمد، ممثل خدمة العملاء في مجموعة تواصل.';
      }
      if (lowerMessage.includes('خدمات') || lowerMessage.includes('ماذا تقدمون') || lowerMessage.includes('ما هي خدماتكم')) {
        return 'نقدم خدمات متعددة: التأمين الصحي، تجديد الإقامة، خدمات الترجمة، تجديد الجواز، والتصوير الفوري. كيف يمكنني مساعدتك؟';
      }
      if (lowerMessage.includes('إقامة') || lowerMessage.includes('تكلفة') || lowerMessage.includes('كم تكلفة')) {
        return 'تكلفة الإقامة 810 ليرة تركية للبطاقة، بالإضافة للتأمين والرسوم حسب الجنسية والعمر. هل تريد استشارة مجانية؟';
      }
      if (lowerMessage.includes('عنوان') || lowerMessage.includes('أين') || lowerMessage.includes('مكتب')) {
        return 'مكتبنا في: CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin مرسين - التشارشي مقابل ادارة الهجرة. الهاتف: +90 534 962 72 41';
      }
      if (lowerMessage.includes('هاتف') || lowerMessage.includes('اتصال') || lowerMessage.includes('رقم')) {
        return 'يمكنك التواصل معنا على الهاتف: +90 534 962 72 41 أو البريد الإلكتروني: info@tevasul.group';
      }
      if (lowerMessage.includes('حماية مؤقتة') || lowerMessage.includes('تحديث بيانات') || lowerMessage.includes('الحماية المؤقتة')) {
        return 'نعم، نقدم خدمة تحديث البيانات للحماية المؤقتة. نختص في جميع إجراءات تحديث البيانات والمعلومات المطلوبة للحماية المؤقتة في تركيا. يمكننا مساعدتك في المُعاملات والشكاوى اللازمة لكي تحصل على الحماية المؤقتة الجديدة بسهولة. هل هناك أي بيانات مُحددة تحتاجها؟';
      }
      return 'عذراً، حدث خطأ في الاتصال. يرجى التواصل معنا مباشرة على الهاتف: +90 534 962 72 41 أو البريد الإلكتروني: info@tevasul.group';
    } else if (language === 'tr') {
      if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('merhaba')) {
        return 'Merhaba! Size nasıl yardımcı olabilirim? Ben Tevasul Group müşteri hizmetleri temsilcisiyim.';
      }
      if (lowerMessage.includes('hizmet') || lowerMessage.includes('ne sunuyorsunuz') || lowerMessage.includes('hizmetleriniz')) {
        return 'Sağlık sigortası, ikamet yenileme, çeviri hizmetleri, pasaport yenileme ve anlık fotoğraf hizmetleri sunuyoruz. Size nasıl yardımcı olabilirim?';
      }
      if (lowerMessage.includes('ikamet') || lowerMessage.includes('maliyet') || lowerMessage.includes('fiyat')) {
        return 'İkamet maliyeti kart için 810 Türk Lirası, ayrıca sigorta ve milliyet ve yaşa göre harçlar. Ücretsiz danışmanlık ister misiniz?';
      }
      if (lowerMessage.includes('adres') || lowerMessage.includes('nerede') || lowerMessage.includes('ofis')) {
        return 'Ofisimiz: CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin - Göç İdaresi karşısı. Telefon: +90 534 962 72 41';
      }
      if (lowerMessage.includes('telefon') || lowerMessage.includes('iletişim') || lowerMessage.includes('numara')) {
        return 'Bize telefon: +90 534 962 72 41 veya e-posta: info@tevasul.group ile ulaşabilirsiniz.';
      }
      return 'Üzgünüz, bağlantı hatası oluştu. Lütfen doğrudan telefon: +90 534 962 72 41 veya e-posta: info@tevasul.group ile iletişime geçin.';
    } else {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return 'Hello! How can I help you today? I\'m a customer service representative at Tevasul Group.';
      }
      if (lowerMessage.includes('services') || lowerMessage.includes('what do you offer') || lowerMessage.includes('help')) {
        return 'We offer various services: health insurance, residence renewal, translation services, passport renewal, and instant photography. How can I assist you?';
      }
      if (lowerMessage.includes('residence') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
        return 'Residence permit cost is 810 Turkish Lira for the card, plus insurance and fees based on nationality and age. Would you like a free consultation?';
      }
      if (lowerMessage.includes('address') || lowerMessage.includes('where') || lowerMessage.includes('office')) {
        return 'Our office is at: CamiŞerif Mah. 5210 Sk. No:11A Akdeniz / Mersin - opposite Immigration Office. Phone: +90 534 962 72 41';
      }
      if (lowerMessage.includes('phone') || lowerMessage.includes('contact') || lowerMessage.includes('number')) {
        return 'You can contact us at phone: +90 534 962 72 41 or email: info@tevasul.group';
      }
      if (lowerMessage.includes('temporary protection') || lowerMessage.includes('data update') || lowerMessage.includes('protection')) {
        return 'Yes, we provide data update services for temporary protection. We specialize in all procedures for updating data and information required for temporary protection in Turkey. We can help you with the necessary transactions and complaints to obtain new temporary protection easily. Is there any specific data you need?';
      }
      return 'Sorry, there was a connection error. Please contact us directly at phone: +90 534 962 72 41 or email: info@tevasul.group';
    }
  }

  async getResponse(
    userMessage: string,
    sessionId: string,
    language?: string,
    userInfo?: { id?: string; name?: string; email?: string; isRegistered?: boolean }
  ): Promise<string> {
    // Auto-detect language if not provided
    const detectedLanguage = language || this.detectLanguage(userMessage);
    try {
      // Get conversation history for this session
      let conversation = this.conversationHistory.get(sessionId) || [];
      
      // Add system message if this is the first message
      if (conversation.length === 0) {
        const systemPrompt = this.getSystemPrompt(detectedLanguage, userInfo);
        conversation.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add user message
      conversation.push({
        role: 'user',
        content: userMessage
      });

      // Keep only last 10 messages to manage context length
      if (conversation.length > 11) { // system + 10 messages
        conversation = [
          conversation[0], // Keep system message
          ...conversation.slice(-10) // Keep last 10 messages
        ];
      }

      // Use Groq with compound-beta-oss model
      if (!this.groqClient) {
        throw new Error('Groq client not initialized');
      }

      const completion = await this.groqClient.chat.completions.create({
        model: "llama3-70b-8192",
        messages: conversation,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      });

      const assistantResponse = completion.choices[0]?.message?.content || '';

      // Add assistant response to conversation
      conversation.push({
        role: 'assistant',
        content: assistantResponse
      });

      // Update conversation history
      this.conversationHistory.set(sessionId, conversation);

      return assistantResponse;
    } catch (error) {
      console.error('Error getting AI response:', error);
      console.log('🔄 Using fallback response...');
      
      // Use fallback response instead of generic error
      return this.getFallbackResponse(detectedLanguage, userMessage);
    }
  }

  async getResponseStream(
    userMessage: string,
    sessionId: string,
    language?: string,
    onChunk: (chunk: string) => void,
    userInfo?: { id?: string; name?: string; email?: string; isRegistered?: boolean }
  ): Promise<string> {
    // Auto-detect language if not provided
    const detectedLanguage = language || this.detectLanguage(userMessage);
    try {
      // Get conversation history for this session
      let conversation = this.conversationHistory.get(sessionId) || [];
      
      // Add system message if this is the first message
      if (conversation.length === 0) {
        const systemPrompt = this.getSystemPrompt(detectedLanguage, userInfo);
        conversation.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add user message
      conversation.push({
        role: 'user',
        content: userMessage
      });

      // Keep only last 10 messages to manage context length
      if (conversation.length > 11) { // system + 10 messages
        conversation = [
          conversation[0], // Keep system message
          ...conversation.slice(-10) // Keep last 10 messages
        ];
      }

      // Use Groq with compound-beta-oss model
      if (!this.groqClient) {
        throw new Error('Groq client not initialized');
      }

      const completion = await this.groqClient.chat.completions.create({
        model: "llama3-70b-8192",
        messages: conversation,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null
      });

      let fullResponse = '';

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      // Add assistant response to conversation
      conversation.push({
        role: 'assistant',
        content: fullResponse
      });

      // Update conversation history
      this.conversationHistory.set(sessionId, conversation);
      
      return fullResponse;
    } catch (error) {
      console.error('Error getting AI response stream:', error);
      console.log('🔄 Using fallback response for stream...');
      
      // Use fallback response instead of generic error
      const fallbackResponse = this.getFallbackResponse(detectedLanguage, userMessage);
      
      // Simulate streaming by calling onChunk with the full response
      onChunk(fallbackResponse);
      
      return fallbackResponse;
    }
  }

  clearConversation(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  getConversationHistory(sessionId: string): ChatMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}

export default ChatService.getInstance();
