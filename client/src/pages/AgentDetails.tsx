import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
// import { Separator } from "../components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Interfaces

interface Message {
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}
interface Asset {
  name: string;
  rewardRate: string;
  logo: string;
  type: "asset";
}

interface Provider {
  name: string;
  aum: string;
  logo: string;
  type: "provider";
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

interface EthereumMetrics {
  currentRate: string;
  historicalRates: Array<{
    rate: string;
    date: string;
  }>;
  type: "metrics";
}

const AgentDetails: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentCard, setCurrentCard] = useState<any>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket("ws://localhost:3000");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("data", data);

      switch (data.type) {
        case "message":
          setMessages((prev) => [
            ...prev,
            {
              type: "ai",
              content: data.content,
              timestamp: new Date(data.timestamp),
            },
          ]);
          break;

        case "tools":
          try {
            // Parse the tool response content
            const toolData = JSON.parse(data.content);
            console.log("Parsed tool data:", toolData);

            if (toolData.error) {
              console.error("Tool error:", toolData.message);
              return;
            }

            // Handle different tool responses
            if (toolData.type === "assets") {
              setCurrentCard({
                type: "assets",
                items: toolData.items.map((asset: any) => ({
                  name: asset.name,
                  rewardRate:
                    asset.rewardRate,
                  logo: asset.logo,
                  type: "asset",
                })),
              });
            } else if ("agents" in toolData) {
              setCurrentCard({
                type: "agents_list",
                items: toolData.agents.map((agent: any) => ({
                  name: agent.name,
                  mindshare: agent.mindshare,
                  marketCap: agent.marketCap,
                  type: "agent_card",
                })),
              });
            } else if ("name" in toolData) {
              // Single agent response
              setCurrentCard({
                type: "agent_details",
                agentName: toolData.name,
                mindshare: toolData.mindshare,
                marketCap: toolData.marketCap,
                price: toolData.price,
                holdersCount: toolData.holdersCount,
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
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: input,
        timestamp: new Date(),
      },
    ]);

    // Send message through WebSocket
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
      case "assets":
        return <StakingAssetsCard assets={currentCard.items} />;

      case "providers":
        return <ProvidersCard providers={currentCard.items} />;

      case "agent_details":
        return <AgentDetailsCard data={currentCard} />;

      case "agents_list":
        return <AgentsListCard agents={currentCard.items} />;

      case "metrics":
        return <EthereumMetricsCard data={currentCard} />;

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
    <div className="flex w-full h-screen bg-gray-50">
      {/* Chat Interface */}
      <div className="w-[570px] border-r bg-white flex flex-col h-full">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-lg font-semibold">
            AI Assistant
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
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
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              disabled={isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Card Display Area */}
      <div className="flex-1 p-6 overflow-y-auto">{renderCard()}</div>
    </div>
  );
};

// Card Components

const StakingAssetsCard: React.FC<{ assets: Asset[] }> = ({ assets }) => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {assets.map((asset, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-3 mb-3">
          <img
            src={asset.logo}
            alt={asset.name}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/fallback-asset-image.png"; // Add a fallback image
            }}
          />
          <h3 className="font-semibold text-lg">{asset.name}</h3>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">APR</span>
          <span className="text-green-600 font-semibold">
            {asset.rewardRate}%
          </span>
        </div>
      </div>
    ))}
  </div>
);

const ProvidersCard: React.FC<{ providers: Provider[] }> = ({ providers }) => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {providers.map((provider, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-3 mb-3">
          <img
            src={provider.logo}
            alt={provider.name}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/fallback-provider-image.png";
            }}
          />
          <h3 className="font-semibold text-lg">{provider.name}</h3>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">AUM</span>
          <span className="text-blue-600 font-semibold">{provider.aum}</span>
        </div>
      </div>
    ))}
  </div>
);

const AgentDetailsCard: React.FC<{ data: AgentDetails }> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-2xl font-bold mb-6">{data.agentName}</h2>
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Mindshare</p>
        <p className="text-lg font-semibold">{data.mindshare}%</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Market Cap</p>
        <p className="text-lg font-semibold">{data.marketCap}</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Price</p>
        <p className="text-lg font-semibold">{data.price}</p>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Holders</p>
        <p className="text-lg font-semibold">{data.holdersCount}</p>
      </div>
    </div>
  </div>
);

const AgentsListCard: React.FC<{ agents: AgentListItem[] }> = ({ agents }) => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    {agents.map((agent, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
      >
        <h3 className="font-semibold text-lg mb-3">{agent.name}</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Mindshare</span>
            <span className="text-blue-600 font-semibold">
              {agent.mindshare}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Market Cap</span>
            <span className="text-blue-600 font-semibold">
              {agent.marketCap}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EthereumMetricsCard: React.FC<{ data: EthereumMetrics }> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-2xl font-bold mb-6">Ethereum Staking Metrics</h2>
    <div className="mb-8">
      <p className="text-gray-600 mb-2">Current APR</p>
      <p className="text-3xl font-bold text-green-600">{data.currentRate}%</p>
    </div>
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Historical Rates</h3>
      <div className="space-y-2">
        {data.historicalRates.map((rate, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
          >
            <span className="text-gray-600">
              {new Date(rate.date).toLocaleDateString()}
            </span>
            <span className="font-medium">{rate.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Loading Card Component
// const LoadingCard: React.FC = () => (
//   <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
//     <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
//     <div className="grid grid-cols-2 gap-4">
//       {[1, 2, 3, 4].map((i) => (
//         <div key={i} className="p-4 bg-gray-100 rounded-lg">
//           <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
//           <div className="h-6 bg-gray-200 rounded w-3/4"></div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// Error Card Component
const ErrorCard: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center gap-3 text-red-500 mb-4">
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="font-semibold text-lg">Error Loading Data</h3>
    </div>
    <p className="text-gray-600">{message}</p>
  </div>
);

export default AgentDetails;
