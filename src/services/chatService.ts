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
          max_tokens: 500,
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
          max_tokens: 500,
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
