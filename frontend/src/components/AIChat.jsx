import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './AIChat.css';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: window.innerHeight - 120 });
  const chatEndRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // 初始化系统消息
  useEffect(() => {
    setMessages([
      {
        role: 'system',
        content: '你是人工智能助手，为广西自动化学会会员提供服务。'
      },
      {
        role: 'assistant',
        content: '您好！我是您的智能助手，有什么可以帮助您的吗？'
      }
    ]);
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      // 调用后端AI接口
      const response = await axios.post('/api/ai/chat', {
        messages: newMessages
      });

      // 处理AI响应
      if (response.data.choices && response.data.choices.length > 0) {
        const aiMessage = response.data.choices[0].message;
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // 处理无效响应格式
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，AI服务返回了无效的响应格式，请稍后重试。'
        }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // 检查是否有模拟响应
      if (error.response && error.response.data && error.response.data.choices) {
        // 使用后端返回的模拟响应
        const aiMessage = error.response.data.choices[0].message;
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // 根据错误类型显示更具体的错误信息
        let errorMessage = '抱歉，AI服务暂时不可用，请稍后重试。';
        if (error.response) {
          // 服务器返回了错误响应
          if (error.response.status === 400) {
            errorMessage = '请求参数错误，请检查您的输入。';
          } else if (error.response.status === 401) {
            errorMessage = 'AI服务认证失败，请联系管理员。';
          } else if (error.response.status === 500) {
            errorMessage = 'AI服务内部错误，请稍后重试。';
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          errorMessage = '无法连接到AI服务，请检查网络连接。';
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorMessage
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 拖拽相关函数
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('chat-header') || 
        e.target.classList.contains('chat-icon')) {
      isDraggingRef.current = true;
      startPosRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;

    // 限制在窗口内
    const maxX = window.innerWidth - (isOpen ? 320 : 60);
    const maxY = window.innerHeight - (isOpen ? 450 : 60);

    setPosition({
      x: Math.max(10, Math.min(newX, maxX)),
      y: Math.max(10, Math.min(newY, maxY))
    });
  }, [isOpen]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // 添加全局事件监听器
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`ai-chat-container ${isOpen ? 'open' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 悬浮图标 */}
      <div 
        className="chat-icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        🤖
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="chat-window">
          {/* 聊天头部 */}
          <div className="chat-header">
            <div className="chat-title">智能助手</div>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* 聊天消息区域 */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.role}`}
              >
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="chat-input-area">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              disabled={isTyping}
            />
            <button 
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;