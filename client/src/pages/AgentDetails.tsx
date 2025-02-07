import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";

// Interfaces
interface Message {
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AgentDetails {
  agentName: string;
  mindshare: number;
  marketCap: string;
  price: string;
  holdersCount: number;
  type: "agent_details";
}

interface AgentListItem {
  name: string;
  mindshare: number;
  marketCap: string;
  type: "agent_card";
}

const AgentDetails: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    ws.current = new WebSocket("https://pluto-agent.onrender.com");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("data", data);

      switch (data.type) {
        case "connection":
          console.log("Connected to server:", data.content);
          setMessages((prev) => [
            ...prev,
            {
              type: "ai",
              content: data.content,
              timestamp: new Date(),
            },
          ]);
          break;

        case "message":
          if (data.content) {
            setMessages((prev) => [
              ...prev,
              {
                type: "ai",
                content: data.content,
                timestamp: new Date(data.timestamp),
              },
            ]);
          }

          break;

        case "tools":
          try {
            const toolData = JSON.parse(data.content);
            console.log("Parsed tool data:", toolData);

            if (toolData.error) {
              console.error("Tool error:", toolData.message);
              return;
            }

            if (toolData.ok.currentPage >= 1) {
              setCurrentCard({
                type: "agents_list",
                items: toolData.ok.data.map((agent: any) => ({
                  name: agent.agentName,
                  mindshare: agent.mindshare.toFixed(2),
                  marketCap: agent.mindshareDeltaPercent.toFixed(2),
                  type: "agent_card",
                })),
              });
            } else if (toolData.ok.agentName !== "") {
              setCurrentCard({
                type: "agent_details",
                agentName: toolData.ok.agentName,
                mindshare: toolData.ok.mindshare,
                marketCap: toolData.ok.marketCap,
                price: toolData.ok.price,
                holdersCount: toolData.ok.holdersCount,
              });
            }
          } catch (error) {
            console.error("Error parsing tool response:", error);
          }
          break;

        case "error":
          console.error("Server error:", data.content);
          break;
      }
    };
    return () => ws.current?.close();
  }, []);

  const handleSendMessage = () => {
    if (!input.trim() || !ws.current) return;

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: input,
        timestamp: new Date(),
      },
    ]);

    ws.current.send(
      JSON.stringify({
        content: input,
      })
    );

    setInput("");
    setIsLoading(false);
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCard = () => {
    if (!currentCard) return null;

    try {
      switch (currentCard.type) {
        case "agent_details":
          return <AgentDetailsCard data={currentCard} />;
        case "agents_list":
          return <AgentsListCard agents={currentCard.items} />;
        default:
          return <ErrorCard message="Unknown card type" />;
      }
    } catch (error) {
      return (
        <ErrorCard
          message={error instanceof Error ? error.message : "An error occurred"}
        />
      );
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-950">
      <div className="w-[570px] border-r border-gray-800 bg-gray-900 flex flex-col h-full">
        <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4 bg-gray-900">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Button>
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-100">
            AI Assistant
          </div>
        </div>
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-2xl p-4 transition-all duration-200",
                  msg.type === "user"
                    ? "ml-auto bg-blue-600 text-gray-100 max-w-[80%] hover:bg-blue-700"
                    : "bg-gray-800 text-gray-100 max-w-[80%] hover:bg-gray-700"
                )}
              >
                {msg.type === "ai" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm max-w-none prose-invert"
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                <span className="text-xs opacity-70 mt-2 block">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t border-gray-800 bg-gray-900 p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500 rounded-xl placeholder-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
        {renderCard()}
      </div>
    </div>
  );
};

const AgentDetailsCard: React.FC<{ data: AgentDetails }> = ({ data }) => (
  <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-6 hover:shadow-xl hover:border-gray-700">
    <h2 className="text-2xl font-bold mb-4 text-gray-100">{data.agentName}</h2>
    <div className="grid grid-cols-2 gap-6">
      {[
        { label: "Mindshare", value: `${data.mindshare}%` },
        { label: "Market Cap", value: data.marketCap },
        { label: "Price", value: data.price },
        { label: "Holders", value: data.holdersCount.toLocaleString() },
      ].map((item, index) => (
        <div
          key={index}
          className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500"
        >
          <p className="text-sm text-gray-400 mb-1">{item.label}</p>
          <p className="text-lg font-semibold text-gray-100">{item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

const AgentsListCard: React.FC<{ agents: AgentListItem[] }> = ({ agents }) => (
  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
    {agents.map((agent, idx) => (
      <div
        key={idx}
        className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-5 hover:shadow-xl hover:border-blue-500 transition-all"
      >
        <h3 className="font-semibold text-lg mb-3 text-gray-100">
          {agent.name}
        </h3>
        <div className="space-y-3">
          {[
            { label: "Mindshare", value: `${agent.mindshare}%` },
            { label: "Market Cap", value: agent.marketCap },
          ].map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 rounded-xl bg-gray-800"
            >
              <span className="text-gray-400">{item.label}</span>
              <span className="text-blue-400 font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ErrorCard: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-gray-900 rounded-2xl shadow-lg border border-red-900 p-6">
    <div className="flex items-center gap-3 text-red-400 mb-3">
      <AlertCircle className="w-6 h-6" />
      <h3 className="font-semibold text-lg">Error Loading Data</h3>
    </div>
    <p className="text-gray-400">{message}</p>
  </div>
);

export default AgentDetails;