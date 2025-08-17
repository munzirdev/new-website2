import trainingData from '../data/chatbot-training-data.json';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ChatService {
  private static instance: ChatService;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private getSystemPrompt(language: string): string {
    const data = trainingData as any;
    const lang = language === 'ar' ? 'ar' : 'en';
    const personality = data.chatbot_personality[lang];
    const guidelines = data.response_guidelines[lang];
    
    if (language === 'ar') {
      return `أنت ${personality.name}، ${personality.role} في ${data.company_info.name}. 

شخصيتك:
- النبرة: ${personality.tone}
- الأسلوب: ${personality.style}
- طول الرد: ${personality.response_length}
- التكيف اللغوي: ${personality.language_adaptation}

المؤهلات المهنية:
${personality.professional_qualities.map(q => `- ${q}`).join('\n')}

إرشادات الرد:
يجب عليك:
${guidelines.do.map(g => `- ${g}`).join('\n')}

لا يجب عليك:
${guidelines.dont.map(g => `- ${g}`).join('\n')}

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
${personality.closing_messages.join('\n')}

تذكر: رد دائماً باللغة العربية، كن محترفاً ومهذباً، قدم معلومات دقيقة، وكن مختصراً وواضحاً. إذا لم تكن متأكداً من إجابة، اطلب من العميل التواصل مع فريق خدمة العملاء للحصول على معلومات محدثة ودقيقة.`;
    } else {
      return `You are ${personality.name}, a ${personality.role} at ${data.company_info.english_name}. 

Your personality:
- Tone: ${personality.tone}
- Style: ${personality.style}
- Response length: ${personality.response_length}
- Language adaptation: ${personality.language_adaptation}

Professional qualifications:
${personality.professional_qualities.map(q => `- ${q}`).join('\n')}

Response guidelines:
You should:
${guidelines.do.map(g => `- ${g}`).join('\n')}

You should not:
${guidelines.dont.map(g => `- ${g}`).join('\n')}

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

  async getResponse(
    userMessage: string,
    sessionId: string,
    language: string = 'ar'
  ): Promise<string> {
    try {
      // Get conversation history for this session
      let conversation = this.conversationHistory.get(sessionId) || [];
      
      // Add system message if this is the first message
      if (conversation.length === 0) {
        conversation.push({
          role: 'system',
          content: this.getSystemPrompt(language)
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

      // Get API key from environment
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Tevasul Chat Bot'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: conversation,
          max_tokens: 300,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices[0]?.message?.content || '';

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
      
      if (language === 'ar') {
        return 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى أو التواصل مع فريق خدمة العملاء للحصول على المساعدة.';
      } else {
        return 'Sorry, there was an error processing your request. Please try again or contact our customer service team for assistance.';
      }
    }
  }

  async getResponseStream(
    userMessage: string,
    sessionId: string,
    language: string = 'ar',
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      // Get conversation history for this session
      let conversation = this.conversationHistory.get(sessionId) || [];
      
      // Add system message if this is the first message
      if (conversation.length === 0) {
        conversation.push({
          role: 'system',
          content: this.getSystemPrompt(language)
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

      // Get API key from environment
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Tevasul Chat Bot'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: conversation,
          max_tokens: 300,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Add assistant response to conversation
                conversation.push({
                  role: 'assistant',
                  content: fullResponse
                });

                // Update conversation history
                this.conversationHistory.set(sessionId, conversation);
                
                return fullResponse;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error getting AI response stream:', error);
      
      if (language === 'ar') {
        return 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى أو التواصل مع فريق خدمة العملاء للحصول على المساعدة.';
      } else {
        return 'Sorry, there was an error processing your request. Please try again or contact our customer service team for assistance.';
      }
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
