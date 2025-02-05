import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { ArrowLeft, Search, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface CardData {
  agentName: string;
  mindshare: string;
  marketCap: string;
  price: string;
  holdersCount: number;
}

interface ChatResponse {
  success: boolean;
  response: string;
  cardData: CardData | null;
}

const AgentDetails: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reference for auto-scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a random session ID when component mounts
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const username = input.match(/agent\s+(\w+)/i)?.[1];
      const endpoint = username
        ? `http://localhost:3000/api/chat/agent/${username}`
        : 'http://localhost:3000/api/chat';

      const response = await axios.post<ChatResponse>(endpoint, {
        message: input,
        sessionId,
      });

      if (response.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: 'user',
            content: input,
            timestamp: new Date(),
          },
          {
            type: 'ai',
            content: response.data.response,
            timestamp: new Date(),
          },
        ]);

        if (response.data.cardData) {
          setCardData(response.data.cardData);
        }
      }

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex  w-full h-screen bg-gray-50">
      {/* Sidebar - Chat Interface */}
      <div className="w-[570px] border-r bg-white flex flex-col h-full">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-semibold">
            AI Assistant
          </div>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-7 text-gray-500" />
            <Input
              placeholder="Search messages..."
              className="pl-8"
              // Implement search functionality as needed
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`rounded-3xl p-3 ${
                  msg.type === "user"
                    ? "ml-auto bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                } max-w-[80%]`}
              >
                {msg.type === "ai" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <span className="text-xs opacity-70 mt-1 block">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={sendMessage} size="icon" disabled={isLoading}>
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <Send className="h-4 w-4 rounded-xl" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Exploration */}
      <div className="flex-1 p-6  overflow-y-auto">
        {/* If cardData is available, show agent details */}
        {cardData ? (
  <div className="bg-gradient-to-br m-auto from-gray-900 to-gray-800 shadow-2xl rounded-3xl p-6 max-w-md text-white border border-gray-700">
    <h2 className="text-2xl font-bold text-center text-white">{cardData.agentName}</h2>
    <Separator className="my-4 bg-gray-600" />
    
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-300">Mindshare:</p>
        <span className="font-semibold text-lg text-gray-100">{cardData.mindshare}</span>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-300">Market Cap:</p>
        <span className="font-semibold text-lg text-green-400">${cardData.marketCap}</span>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-300">Price:</p>
        <span className="font-semibold text-lg text-blue-400">${cardData.price}</span>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-300">Holders:</p>
        <span className="font-semibold text-lg text-yellow-300">{cardData.holdersCount}</span>
      </div>
    </div>
  </div>
) : (
  <div className="text-center text-gray-500">
    <p>No agent selected. Start a conversation to explore data.</p>
  </div>
)}

        {/* Additional Exploration Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">Explore More</h3>
          <Separator className="my-2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Example Placeholder Cards */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-800">Related Agents</h4>
              <p className="text-xs text-gray-600">Discover similar AI agents.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-800">Market Trends</h4>
              <p className="text-xs text-gray-600">Latest insights on market cap fluctuations.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="text-sm font-medium text-gray-800">AI Insights</h4>
              <p className="text-xs text-gray-600">How AI agents impact the industry.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetails;
