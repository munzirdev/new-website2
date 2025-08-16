import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
});

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
    if (language === 'ar') {
      return `أنت مساعد ذكي لشركة تواصل، وهي شركة خدمات متكاملة في تركيا. مهمتك مساعدة العملاء في:

1. معلومات عن الخدمات المقدمة (الإقامة، الجنسية، الاستثمار، التأمين الصحي، إلخ)
2. إرشادات حول الإجراءات والمستندات المطلوبة
3. أسعار الخدمات والتوضيحات
4. المساعدة في حل المشاكل والاستفسارات
5. توجيه العملاء لطلب خدمة عملاء حقيقي عند الحاجة

يجب أن تكون إجاباتك:
- دقيقة ومفيدة
- باللغة العربية
- مهذبة ومهنية
- تشجع على التواصل مع الشركة للحصول على خدمات مخصصة

إذا لم تكن متأكداً من إجابة، اطلب من العميل التواصل مع فريق خدمة العملاء للحصول على معلومات محدثة ودقيقة.`;
    } else {
      return `You are an intelligent assistant for Tevasul Group, a comprehensive services company in Turkey. Your role is to help customers with:

1. Information about services offered (residence, citizenship, investment, health insurance, etc.)
2. Guidance on procedures and required documents
3. Service pricing and clarifications
4. Help with problems and inquiries
5. Directing customers to request real customer service when needed

Your responses should be:
- Accurate and helpful
- In English
- Polite and professional
- Encourage contact with the company for personalized services

If you're unsure about an answer, ask the customer to contact the customer service team for updated and accurate information.`;
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

      const completion = await groq.chat.completions.create({
        model: 'qwen3-110b-instruct',
        messages: conversation,
        max_tokens: 500,
        temperature: 0.7,
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
