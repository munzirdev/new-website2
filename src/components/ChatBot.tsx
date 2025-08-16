import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Phone, Minimize2, Maximize2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
  sessionId: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle, isMinimized, onToggleMinimize }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sessionId) {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      console.log('New session created:', newSessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
    console.log('Messages updated, count:', messages.length);
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      console.log('Chat opened, input focused');
    }
  }, [isOpen]);

  // Ensure input is enabled when loading is false
  useEffect(() => {
    console.log('isLoading changed to:', isLoading);
    if (!isLoading && inputRef.current) {
      inputRef.current.disabled = false;
      inputRef.current.focus();
      console.log('Input enabled and focused');
    }
  }, [isLoading]);

  // Reset loading state if it gets stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading state stuck, resetting...');
        setIsLoading(false);
        setIsTyping(false);
        // Force focus on input
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Input focused after stuck reset');
        }
      }
    }, 15000); // Reset after 15 seconds

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      console.log('Scrolled to bottom');
    }
  };

  const addMessage = (content: string, sender: 'user' | 'bot' | 'admin') => {
    console.log('addMessage called with:', { content, sender, sessionId });
    const newMessage: Message = {
      id: uuidv4(),
      content,
      sender,
      timestamp: new Date(),
      sessionId
    };
    console.log('New message created:', newMessage);
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('Messages updated, new count:', updated.length);
      return updated;
    });
    return newMessage;
  };

  const saveMessageToDatabase = async (message: Message) => {
    console.log('saveMessageToDatabase called with:', message);
    try {
      // Check if supabase is connected
      if (!supabase) {
        console.warn('Supabase not available, skipping database save');
        return;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          id: message.id,
          content: message.content,
          sender: message.sender,
          session_id: message.sessionId,
          created_at: message.timestamp.toISOString()
        });

      if (error) {
        console.error('Error saving message:', error);
        // Don't throw error, just log it
      } else {
        console.log('Message saved successfully to database');
      }
    } catch (error) {
      console.error('Error saving message to database:', error);
      // Don't throw error, just log it and continue
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          language
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error; // Re-throw the error so it can be handled by the calling function
    }
  };

  // دالة لمعالجة الـ chunks وتجنب محتوى التفكير
  const processChunk = (chunk: string, insideThinkRef: { current: boolean }): string => {
    let text = chunk;

    if (insideThinkRef.current) {
      // إذا كنا داخل <think> نبحث عن نهايته
      const endIndex = text.indexOf('</think>');
      if (endIndex !== -1) {
        insideThinkRef.current = false;
        text = text.slice(endIndex + 8); // نتجاوز </think>
      } else {
        return ''; // نتجاهل chunk بالكامل لأنه داخل <think>
      }
    }

    // إذا صادفنا بداية <think>
    const startIndex = text.indexOf('<think>');
    if (startIndex !== -1) {
      insideThinkRef.current = true;
      return text.slice(0, startIndex); // نعرض ما قبل <think> فقط
    }

    return text;
  };

  const getAIResponseStream = async (userMessage: string, onChunk: (chunk: string) => void): Promise<string> => {
    try {
      console.log('Starting AI response stream...');
      console.log('Request body:', JSON.stringify({
        message: userMessage,
        sessionId,
        language
      }));
      
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          language
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let insideThink = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log('Raw chunk from server:', chunk);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('Stream completed, full response:', fullResponse);
                return fullResponse;
              }
              try {
                const parsed = JSON.parse(data);
                console.log('Parsed data:', parsed);
                
                // Check if this is an error response
                if (parsed.error) {
                  console.error('Server returned error:', parsed.error);
                  throw new Error(parsed.content || parsed.error);
                }
                
                if (parsed.content) {
                  console.log('Raw content:', parsed.content);
                  
                  // Think tag filtering - only filter if think tags are present
                  let processedContent = parsed.content;
                  const hasThinkStart = processedContent.includes('<think>');
                  const hasThinkEnd = processedContent.includes('</think>');
                  
                  if (hasThinkStart || hasThinkEnd || insideThink) {
                    console.log('Think tags detected, filtering...');
                    if (insideThink) {
                      const endIndex = processedContent.indexOf('</think>');
                      if (endIndex !== -1) {
                        insideThink = false;
                        processedContent = processedContent.slice(endIndex + 8);
                        console.log('Think tag ended, remaining content:', processedContent);
                      } else {
                        processedContent = '';
                        console.log('Still inside think tag, content filtered');
                      }
                    } else {
                      const startIndex = processedContent.indexOf('<think>');
                      if (startIndex !== -1) {
                        insideThink = true;
                        processedContent = processedContent.slice(0, startIndex);
                        console.log('Think tag started, content before think:', processedContent);
                      }
                    }
                  }
                  
                  console.log('Final processed content:', processedContent);
                  if (processedContent && processedContent.trim()) {
                    fullResponse += processedContent;
                    onChunk(processedContent);
                  } else if (!hasThinkStart && !hasThinkEnd && !insideThink) {
                    // If no think tags are present, show the content as is
                    console.log('No think tags, showing content as is');
                    fullResponse += processedContent;
                    onChunk(processedContent);
                  }
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
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error; // Re-throw the error so it can be handled by the calling function
    }
  };

  const handleSendMessage = async () => {
    console.log('handleSendMessage called');
    console.log('inputMessage:', inputMessage);
    console.log('isLoading:', isLoading);
    
    if (!inputMessage.trim()) {
      console.log('Early return - message empty');
      return;
    }
    
    if (isLoading) {
      console.log('Early return - already loading');
      return;
    }

    const userMessage = inputMessage.trim();
    console.log('userMessage:', userMessage);
    setInputMessage('');
    setIsLoading(true);
    console.log('Set loading to true');

    console.log('About to add user message...');
    // Add user message
    const userMsg = addMessage(userMessage, 'user');
    console.log('User message added:', userMsg);
    
    console.log('About to save message to database...');
    // Save message to database without blocking the chat flow
    saveMessageToDatabase(userMsg).catch(error => {
      console.error('Error saving message to database:', error);
      // Continue anyway - don't block the chat flow
    });

    // Show typing indicator
    console.log('Setting typing indicator...');
    setIsTyping(true);
    
    // Set a timeout to hide typing indicator if no response received
    let typingTimeout: NodeJS.Timeout | null = setTimeout(() => {
      console.log('Typing timeout reached, hiding typing indicator');
      setIsTyping(false);
    }, 10000); // 10 seconds timeout

    try {
      console.log('Try block started');
      // Create a temporary bot message for streaming
      const tempBotMsg = addMessage('', 'bot');
      console.log('Temporary bot message created:', tempBotMsg);
      let currentResponse = '';

      console.log('About to call getAIResponseStream...');
      // Get AI response with streaming
      let aiResponse: string;
      let firstChunkReceived = false;
      try {
        aiResponse = await Promise.race([
          getAIResponseStream(userMessage, (chunk: string) => {
            console.log('Received chunk:', chunk);
            currentResponse += chunk;
            console.log('Current response:', currentResponse);
            
            // Hide typing indicator on first chunk received
            if (!firstChunkReceived) {
              firstChunkReceived = true;
              if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
              }
              setIsTyping(false);
              console.log('First chunk received, hiding typing indicator');
            }
            
            // Update the temporary message with new content
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === tempBotMsg.id 
                  ? { ...msg, content: currentResponse }
                  : msg
              );
              console.log('Updated streaming message, content length:', currentResponse.length);
              return updated;
            });
          }),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('AI response timeout')), 30000))
        ]);
        console.log('getAIResponseStream completed, aiResponse:', aiResponse);
      } catch (error) {
        console.error('Error in getAIResponseStream:', error);
        // Clear typing timeout and hide typing indicator
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          typingTimeout = null;
        }
        setIsTyping(false);
        throw error;
      }
      
      // Update the final message
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === tempBotMsg.id 
            ? { ...msg, content: aiResponse }
            : msg
        );
        console.log('Updated final message, content length:', aiResponse.length);
        return updated;
      });

      // Save the final message to database without blocking
      const finalBotMsg = { ...tempBotMsg, content: aiResponse };
      saveMessageToDatabase(finalBotMsg).catch(error => {
        console.error('Error saving final bot message:', error);
        // Continue anyway - don't block the chat flow
      });
          } catch (error) {
        console.error('Error in chat:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        
        // Check if it's a rate limit error
        let errorMessage = language === 'ar' 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred. Please try again.';
        
        if (error instanceof Error && error.message.includes('429')) {
          errorMessage = language === 'ar'
            ? 'عذراً، النظام مشغول حالياً. يرجى المحاولة بعد قليل أو التواصل مع فريق خدمة العملاء للحصول على مساعدة فورية.'
            : 'Sorry, the system is currently busy. Please try again in a moment or contact our customer service team for immediate assistance.';
        }
        
        const errorMsg = addMessage(errorMessage, 'bot');
        saveMessageToDatabase(errorMsg).catch(error => {
          console.error('Error saving error message:', error);
          // Continue anyway - don't block the chat flow
        });
      } finally {
      console.log('Finally block executed');
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      setIsLoading(false);
      setIsTyping(false);
      console.log('Loading and typing set to false');
      
      // Ensure input is focused after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Input focused after message sent');
        }
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('handleKeyPress called, key:', e.key);
    console.log('isLoading:', isLoading);
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      console.log('Enter pressed, calling handleSendMessage');
      e.preventDefault();
      handleSendMessage();
    }
  };

  const requestHumanSupport = async () => {
    console.log('requestHumanSupport called, isLoading:', isLoading);
    if (isLoading) {
      console.log('Already loading, returning early');
      return;
    }
    
    setIsLoading(true);
    setIsTyping(true);
    console.log('Set loading and typing to true');
    
    try {
      const supportMessage = addMessage(
        language === 'ar' 
          ? 'طلب التحدث مع ممثل خدمة عملاء حقيقي'
          : 'Request to speak with a real customer service representative',
        'user'
      );
      try {
        await saveMessageToDatabase(supportMessage);
        console.log('Support message saved to database');
      } catch (error) {
        console.error('Error saving support message:', error);
        // Continue anyway - don't block the chat flow
      }

      // Send notification to Telegram
      try {
        await fetch('http://localhost:3001/api/telegram/notify-support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: supportMessage.content,
            language
          }),
        });
      } catch (error) {
        console.error('Error sending Telegram notification:', error);
      }

      const confirmationMsg = addMessage(
        language === 'ar' 
          ? 'تم إرسال طلبك إلى فريق خدمة العملاء. سيقوم ممثل بالتواصل معك قريباً.'
          : 'Your request has been sent to our customer service team. A representative will contact you soon.',
        'bot'
      );
      try {
        await saveMessageToDatabase(confirmationMsg);
        console.log('Confirmation message saved to database');
      } catch (error) {
        console.error('Error saving confirmation message:', error);
        // Continue anyway - don't block the chat flow
      }
    } catch (error) {
      console.error('Error in requestHumanSupport:', error);
      const errorMsg = addMessage(
        language === 'ar' 
          ? 'عذراً، حدث خطأ في إرسال طلبك. يرجى المحاولة مرة أخرى.'
          : 'Sorry, there was an error sending your request. Please try again.',
        'bot'
      );
      try {
        await saveMessageToDatabase(errorMsg);
        console.log('Support error message saved to database');
      } catch (error) {
        console.error('Error saving support error message:', error);
        // Continue anyway - don't block the chat flow
      }
    } finally {
      console.log('requestHumanSupport finally block executed');
      setIsLoading(false);
      setIsTyping(false);
      console.log('Set loading and typing to false');
      
      // Ensure input is focused after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Input focused after support request');
        }
      }, 100);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="bg-caribbean-600 hover:bg-caribbean-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label={language === 'ar' ? 'فتح الشات بوت' : 'Open Chat Bot'}
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:left-auto md:right-6 md:transform-none z-50 w-80 h-96 md:w-96 md:h-[500px] bg-white dark:bg-jet-800 rounded-2xl shadow-2xl border border-platinum-200 dark:border-jet-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white p-3 md:p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
          <span className="font-semibold text-sm md:text-base">
            {language === 'ar' ? 'مساعد تواصل الذكي' : 'Tevasul Chat Bot'}
          </span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={onToggleMinimize}
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3 md:w-4 md:h-4" /> : <Minimize2 className="w-3 h-3 md:w-4 md:h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            <X className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6 md:py-8">
                <MessageCircle className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-xs md:text-sm">
                  {language === 'ar' 
                    ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟'
                    : 'Hello! How can I help you today?'
                  }
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2 md:p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white'
                      : message.sender === 'admin'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-jet-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-jet-700 p-2 md:p-3 rounded-lg">
                  <div className="flex space-x-1 space-x-reverse">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 border-t border-platinum-200 dark:border-jet-700">
            <div className="flex space-x-2 space-x-reverse">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                className="flex-1 px-3 py-2 text-xs md:text-sm border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 dark:bg-jet-700 dark:text-white"
                disabled={false}
                onFocus={() => console.log('Input focused, isLoading:', isLoading)}
                onBlur={() => console.log('Input blurred, isLoading:', isLoading)}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 disabled:bg-gray-400 text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                onMouseEnter={() => console.log('Send button hover, isLoading:', isLoading)}
              >
                <Send className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
            
            {/* Support Button */}
            <button
              onClick={requestHumanSupport}
              disabled={false}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              onMouseEnter={() => console.log('Support button hover, isLoading:', isLoading)}
            >
              <Phone size={16} />
              <span>
                {language === 'ar' ? 'طلب ممثل خدمة العملاء' : 'Talk to Real Representative'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;
