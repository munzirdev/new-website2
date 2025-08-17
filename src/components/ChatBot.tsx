import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Phone, Minimize2, Maximize2, Link, ExternalLink, MessageSquare, MapPin, Shield } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { webhookService } from '../services/webhookService';
import chatService from '../services/chatService';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  links?: Array<{
    url: string;
    text: string;
    type: 'internal' | 'external';
  }>;
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle, isMinimized, onToggleMinimize }) => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSessionClaimed, setIsSessionClaimed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session management and user identification
  useEffect(() => {
    const initializeSession = async () => {
      if (!sessionId) {
        // Try to get existing session from localStorage
        const savedSessionId = localStorage.getItem('chatbot_session_id');
        const savedUserId = localStorage.getItem('chatbot_user_id');
        
        if (savedSessionId && savedUserId === (user?.id || 'anonymous')) {
          // Restore existing session for the same user
          setSessionId(savedSessionId);
          console.log('Restored existing session:', savedSessionId);
          
          // Load conversation history
          await loadConversationHistory(savedSessionId);
        } else {
          // Create new session
          const newSessionId = uuidv4();
          setSessionId(newSessionId);
          localStorage.setItem('chatbot_session_id', newSessionId);
          localStorage.setItem('chatbot_user_id', user?.id || 'anonymous');
          console.log('New session created:', newSessionId);
        }
      } else {
        // Update user ID if user changed
        const currentUserId = user?.id || 'anonymous';
        const savedUserId = localStorage.getItem('chatbot_user_id');
        
        if (savedUserId !== currentUserId) {
          localStorage.setItem('chatbot_user_id', currentUserId);
          console.log('User changed, updated session user ID');
        }
      }
    };

    initializeSession();
  }, [sessionId, user?.id]);

  // Real-time message subscription
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for session:', sessionId);

    const channel = supabase
      .channel(`chat_messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New message received via real-time:', payload.new);
          const newMessage = payload.new as any;
          
          // Add new message to the chat
          const formattedMessage: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender: newMessage.sender,
            timestamp: new Date(newMessage.created_at),
            sessionId: newMessage.session_id,
            userId: newMessage.user_id,
            links: extractLinksFromMessage(newMessage.content)
          };
          
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === formattedMessage.id)) {
              console.log('Message already exists, skipping:', formattedMessage.id);
              return prev;
            }
            console.log('Adding new message to chat:', formattedMessage);
            return [...prev, formattedMessage];
          });
          
          // Check if this is a claim message
          if (newMessage.sender === 'admin' && newMessage.content.includes('تم استلام المحادثة')) {
            console.log('Claim message detected, setting session as claimed');
            setIsSessionClaimed(true);
          }
          
          // Auto scroll to bottom immediately
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 50);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription for session:', sessionId);
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Periodic check for new messages (fallback)
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const { data: newMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .gt('created_at', new Date(Date.now() - 10000).toISOString()) // Last 10 seconds
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error checking for new messages:', error);
          return;
        }

        if (newMessages && newMessages.length > 0) {
          console.log('Found new messages via periodic check:', newMessages.length);
          
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.id));
            const messagesToAdd = newMessages
              .filter(msg => !existingIds.has(msg.id))
              .map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.created_at),
                sessionId: msg.session_id,
                userId: msg.user_id,
                links: extractLinksFromMessage(msg.content)
              }));

            if (messagesToAdd.length > 0) {
              console.log('Adding messages via periodic check:', messagesToAdd.length);
              
              // Check for claim messages
              messagesToAdd.forEach(msg => {
                if (msg.sender === 'admin' && msg.content.includes('تم استلام المحادثة')) {
                  console.log('Claim message found via periodic check');
                  setIsSessionClaimed(true);
                }
              });
              
              return [...prev, ...messagesToAdd];
            }
            
            return prev;
          });
        }
      } catch (error) {
        console.error('Error in periodic message check:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  // Load conversation history from database
  const loadConversationHistory = async (sessionId: string) => {
    if (!sessionId) return;
    
    setIsLoadingHistory(true);
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation history:', error);
        return;
      }

      if (messages && messages.length > 0) {
        const formattedMessages: Message[] = messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
          sessionId: msg.session_id,
          userId: msg.user_id,
          links: extractLinksFromMessage(msg.content)
        }));
        
        setMessages(formattedMessages);
        console.log('Loaded conversation history:', formattedMessages.length, 'messages');
        
        // Check if session is claimed by admin
        const isClaimed = messages.some(msg => 
          msg.sender === 'admin' && 
          msg.content.includes('تم استلام المحادثة')
        );
        
        setIsSessionClaimed(isClaimed);
        if (isClaimed) {
          console.log('Session is claimed by admin, bot is disabled');
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Extract links from message content
  const extractLinksFromMessage = (content: string): Array<{url: string, text: string, type: 'internal' | 'external'}> => {
    const links: Array<{url: string, text: string, type: 'internal' | 'external'}> = [];
    
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);
    
    if (matches) {
      matches.forEach(url => {
        const isInternal = url.includes(window.location.origin) || url.includes('tevasul.group');
        links.push({
          url,
          text: url,
          type: isInternal ? 'internal' : 'external'
        });
      });
    }
    
    return links;
  };

  useEffect(() => {
    // Force scroll to bottom whenever messages change
    const timeoutId = setTimeout(() => {
      scrollToBottom();
      console.log('Messages updated, count:', messages.length);
    }, 50);
    
    return () => clearTimeout(timeoutId);
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
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        console.log('Scrolled to bottom');
      }
    }, 100);
  };

  // Render message content with clickable links and WhatsApp button
  const renderMessageContent = (content: string, links?: Array<{url: string, text: string, type: 'internal' | 'external'}>) => {
    // Check if this is a WhatsApp button message
    if (content === '__WHATSAPP_BUTTON__' && links && links.length > 0) {
      const whatsappLink = links[0];
      return (
        <div className="mt-2">
          <button
            onClick={() => {
              window.open(whatsappLink.url, '_blank', 'noopener,noreferrer');
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <MessageSquare size={16} />
            <span className="font-medium">
              {whatsappLink.text}
            </span>
          </button>
        </div>
      );
    }

    // Check if this is a Maps button message
    if (content === '__MAPS_BUTTON__' && links && links.length > 0) {
      const mapsLink = links[0];
      return (
        <div className="mt-2">
          <button
            onClick={() => {
              window.open(mapsLink.url, '_blank', 'noopener,noreferrer');
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <MapPin size={16} />
            <span className="font-medium">
              {mapsLink.text}
            </span>
          </button>
        </div>
      );
    }

    // Extract URLs from content if no links provided
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatches = content.match(urlRegex);
    
    if (!urlMatches || urlMatches.length === 0) {
      return <span>{content}</span>;
    }

    let renderedContent = content;
    const extractedLinks: Array<{url: string, text: string, type: 'internal' | 'external'}> = [];
    
    urlMatches.forEach((url, index) => {
      const isInternal = url.includes(window.location.origin) || url.includes('tevasul.group');
      extractedLinks.push({
        url,
        text: url,
        type: isInternal ? 'internal' : 'external'
      });
      
      // Replace URL with placeholder
      renderedContent = renderedContent.replace(url, `__LINK_${index}__`);
    });

    // Split content and replace placeholders with actual links
    const parts = renderedContent.split(/(__LINK_\d+__)/);
    return (
      <>
        {parts.map((part, index) => {
          const linkMatch = part.match(/__LINK_(\d+)__/);
          if (linkMatch) {
            const linkIndex = parseInt(linkMatch[1]);
            const link = extractedLinks[linkIndex];
            if (link) {
              return (
                <a
                  key={index}
                  href={link.url}
                  target={link.type === 'external' ? '_blank' : '_self'}
                  rel={link.type === 'external' ? 'noopener noreferrer' : ''}
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 break-all"
                  onClick={(e) => {
                    if (link.type === 'external') {
                      e.preventDefault();
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  {link.text}
                  {link.type === 'external' && <ExternalLink size={12} />}
                </a>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  // Add WhatsApp button after phone number requests
  const addWhatsAppButton = (phoneNumber: string) => {
    // Remove all non-digits and the + sign for WhatsApp URL
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    const whatsappMessage = language === 'ar' 
      ? `💬 يمكنك التواصل معنا مباشرة عبر واتساب:`
      : `💬 You can contact us directly via WhatsApp:`;
    
    // Add WhatsApp message
    const whatsappMsg = addMessage(whatsappMessage, 'bot');
    saveMessageToDatabase(whatsappMsg).catch(error => {
      console.error('Error saving WhatsApp message:', error);
    });
    
    // Add WhatsApp button message
    setTimeout(() => {
      const buttonMessage = addMessage('__WHATSAPP_BUTTON__', 'bot');
      
      // Update the message with WhatsApp button
      setMessages(prev => prev.map(msg => 
        msg.id === buttonMessage.id 
          ? { 
              ...msg, 
              content: '__WHATSAPP_BUTTON__',
              links: [{ 
                url: whatsappUrl, 
                text: language === 'ar' ? '💬 فتح واتساب' : '💬 Open WhatsApp',
                type: 'external' as const 
              }] 
            }
          : msg
      ));
      
      // Save the button message to database
      const updatedButtonMessage = { 
        ...buttonMessage, 
        content: '__WHATSAPP_BUTTON__',
        links: [{ 
          url: whatsappUrl, 
          text: language === 'ar' ? '💬 فتح واتساب' : '💬 Open WhatsApp',
          type: 'external' as const 
        }] 
      };
      saveMessageToDatabase(updatedButtonMessage).catch(error => {
        console.error('Error saving WhatsApp button message:', error);
      });
    }, 500);
  };

  // Add Maps button after location requests
  const addMapsButton = () => {
    const mapsUrl = 'https://maps.app.goo.gl/39YFtk8fcES8p1JA8?g_st=awb';
    const mapsMessage = language === 'ar' 
      ? `📍 يمكنك العثور على مكتبنا على الخرائط:`
      : `📍 You can find our office on the map:`;
    
    // Add Maps message
    const mapsMsg = addMessage(mapsMessage, 'bot');
    saveMessageToDatabase(mapsMsg).catch(error => {
      console.error('Error saving Maps message:', error);
    });
    
    // Add Maps button message
    setTimeout(() => {
      const buttonMessage = addMessage('__MAPS_BUTTON__', 'bot');
      
      // Update the message with Maps button
      setMessages(prev => prev.map(msg => 
        msg.id === buttonMessage.id 
          ? { 
              ...msg, 
              content: '__MAPS_BUTTON__',
              links: [{ 
                url: mapsUrl, 
                text: language === 'ar' ? '🗺️ فتح الخرائط' : '🗺️ Open Maps',
                type: 'external' as const 
              }] 
            }
          : msg
      ));
      
      // Save the button message to database
      const updatedButtonMessage = { 
        ...buttonMessage, 
        content: '__MAPS_BUTTON__',
        links: [{ 
          url: mapsUrl, 
          text: language === 'ar' ? '🗺️ فتح الخرائط' : '🗺️ Open Maps',
          type: 'external' as const 
        }] 
      };
      saveMessageToDatabase(updatedButtonMessage).catch(error => {
        console.error('Error saving Maps button message:', error);
      });
    }, 500);
  };

  const addMessage = (content: string, sender: 'user' | 'bot' | 'admin') => {
    console.log('addMessage called with:', { content, sender, sessionId });
    const newMessage: Message = {
      id: uuidv4(),
      content,
      sender,
      timestamp: new Date(),
      sessionId,
      userId: user?.id || 'anonymous',
      links: extractLinksFromMessage(content)
    };
    console.log('New message created:', newMessage);
    
    // Force immediate update and scroll
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('Messages updated, new count:', updated.length);
      
      // Force scroll to bottom immediately
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      
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
      // Prepare user info for chatService
      const userInfo = user ? {
        id: user.id,
        name: profile?.full_name || user.email,
        email: user.email,
        isRegistered: true
      } : undefined;

      // Let chatService auto-detect language from user message
      return await chatService.getResponse(userMessage, sessionId, undefined, userInfo);
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
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
      
      // Prepare user info for chatService
      const userInfo = user ? {
        id: user.id,
        name: profile?.full_name || user.email,
        email: user.email,
        isRegistered: true
      } : undefined;

      // Let chatService auto-detect language from user message
      return await chatService.getResponseStream(userMessage, sessionId, undefined, onChunk, userInfo);
    } catch (error) {
      console.error('Error getting AI response stream:', error);
      throw error;
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

    // Check if user is asking for phone number
    const isPhoneRequest = /رقم|هاتف|اتصال|تواصل|phone|call|contact/i.test(userMessage);
    
    // Check if user is asking for location/maps
    const isLocationRequest = /موقع|عنوان|خرائط|مكتب|location|address|map|office/i.test(userMessage);

    console.log('About to add user message...');
    // Add user message immediately and force re-render
    const userMsg = addMessage(userMessage, 'user');
    console.log('User message added:', userMsg);
    
    // Force immediate scroll to show the new message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    console.log('About to save message to database...');
    // Save message to database without blocking the chat flow
    saveMessageToDatabase(userMsg).catch(error => {
      console.error('Error saving message to database:', error);
      // Continue anyway - don't block the chat flow
    });

    // Check if session is claimed by admin (only for bot responses, not user messages)
    try {
      const { data: adminMessages } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('session_id', sessionId)
        .eq('sender', 'admin')
        .ilike('content', '%تم استلام المحادثة%')
        .limit(1);

      if (adminMessages && adminMessages.length > 0) {
        console.log('Session is claimed by admin, bot will not respond');
        setIsSessionClaimed(true);
        // Don't return here - allow user to send messages but bot won't respond
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }

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
      
      // Check if session is claimed by admin before bot responds
      if (isSessionClaimed) {
        console.log('Session is claimed by admin, bot will not respond to user message');
        setIsLoading(false);
        setIsTyping(false);
        return;
      }
      
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
              
              // Force scroll to bottom after each update
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }, 50);
              
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
        
        // Force scroll to bottom after final update
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
        return updated;
      });

      // Save the final message to database without blocking
      const finalBotMsg = { ...tempBotMsg, content: aiResponse };
      saveMessageToDatabase(finalBotMsg).catch(error => {
        console.error('Error saving final bot message:', error);
        // Continue anyway - don't block the chat flow
      });

      // Add WhatsApp button if user asked for phone number
      if (isPhoneRequest) {
        setTimeout(() => {
          addWhatsAppButton('905349627241'); // Actual WhatsApp number
        }, 1000);
      }

      // Add Maps button if user asked for location
      if (isLocationRequest) {
        setTimeout(() => {
          addMapsButton();
        }, 1000);
      }
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
      
      // Ensure input is focused after response and scroll to bottom
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Input focused after message sent');
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        await webhookService.sendChatSupportWebhook({
          session_id: sessionId,
          user_info: {
            name: user?.user_metadata?.full_name || 'مستخدم',
            email: user?.email || 'غير محدد',
            phone: user?.user_metadata?.phone || 'غير محدد'
          },
          last_message: supportMessage.content,
          last_message_time: new Date().toISOString(),
          message_count: messages.length,
          priority: 'medium',
          status: 'pending',
          language: language
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
      
      // Ensure input is focused after response and scroll to bottom
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Input focused after support request');
        }
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className="group relative bg-white/10 backdrop-blur-md border border-white/20 text-white p-6 rounded-2xl shadow-4xl transition-all duration-500 hover:scale-110 hover:bg-white/20 hover:shadow-4xl"
          aria-label={language === 'ar' ? 'فتح الشات بوت' : 'Open Chat Bot'}
        >
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-caribbean-500/20 to-indigo-600/20 rounded-2xl backdrop-blur-sm animate-glass-glow"></div>
          
          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center space-y-3">
            <MessageCircle size={32} className="text-white drop-shadow-lg" />
            
            {/* Status text */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 space-x-reverse mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-status-pulse"></div>
                <span className="text-xs font-medium text-white/90">
                  {language === 'ar' ? 'متاح الآن' : 'Available Now'}
                </span>
              </div>
              <p className="text-xs text-white/70 font-medium">
                {language === 'ar' ? 'للمحادثة' : 'For Chat'}
              </p>
            </div>
          </div>
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-caribbean-400/30 to-indigo-500/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-caribbean-400/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:left-auto md:right-6 md:transform-none z-50 w-80 h-96 md:w-96 md:h-[500px] bg-white dark:bg-jet-800 rounded-2xl shadow-2xl border border-platinum-200 dark:border-jet-700 flex flex-col overflow-hidden min-h-[400px]">
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
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 min-h-0" style={{ scrollBehavior: 'smooth' }}>
            {isLoadingHistory && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-caribbean-600 mx-auto mb-2"></div>
                <p className="text-xs">
                  {language === 'ar' ? 'جاري تحميل المحادثة...' : 'Loading conversation...'}
                </p>
              </div>
            )}
            
            {messages.length === 0 && !isLoadingHistory && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-6 md:py-8">
                <MessageCircle className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-xs md:text-sm">
                  {language === 'ar' 
                    ? `مرحباً${user ? ` ${profile?.full_name || user.email}` : ''}! كيف يمكنني مساعدتك اليوم؟`
                    : `Hello${user ? ` ${profile?.full_name || user.email}` : ''}! How can I help you today?`
                  }
                </p>
                {user && (
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'ar' ? 'تم تسجيل الدخول كعضو مسجل' : 'Logged in as registered user'}
                  </p>
                )}
              </div>
            )}
            
            {isSessionClaimed && (
              <div className="text-center bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    {language === 'ar' ? 'تم استلام المحادثة من قبل ممثل خدمة العملاء' : 'Chat claimed by customer service representative'}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-300">
                  {language === 'ar' ? 'يمكنك الآن التحدث مباشرة مع ممثل خدمة العملاء' : 'You can now chat directly with our customer service representative'}
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              // User messages on right (justify-end), Bot/Admin messages on left (justify-start)
              <div
                key={`${message.id}-${index}`}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] p-3 md:p-4 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-caribbean-600 to-indigo-700 text-white'
                      : message.sender === 'admin'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-jet-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="text-xs md:text-sm leading-relaxed">
                    {renderMessageContent(message.content, message.links)}
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-70 mt-2">
                    <span dir="ltr" className="font-mono">
                      {message.timestamp.toLocaleTimeString('en-US', { 
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                    {message.userId && message.userId !== 'anonymous' && (
                      <span className="text-xs opacity-50">
                        {language === 'ar' ? 'عضو مسجل' : 'Registered'}
                      </span>
                    )}
                  </div>
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
            
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="p-3 md:p-4 border-t border-platinum-200 dark:border-jet-700 flex-shrink-0 bg-white dark:bg-jet-800">
            <div className="flex space-x-2 space-x-reverse items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                className="flex-1 px-3 py-2 text-xs md:text-sm border border-platinum-300 dark:border-jet-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-caribbean-500 dark:bg-jet-700 dark:text-white min-w-0"
                disabled={false}
                onFocus={() => console.log('Input focused, isLoading:', isLoading)}
                onBlur={() => console.log('Input blurred, isLoading:', isLoading)}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-caribbean-600 to-indigo-700 hover:from-caribbean-700 hover:to-indigo-800 disabled:bg-gray-400 text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex-shrink-0"
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
