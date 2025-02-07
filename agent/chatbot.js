"use strict";
const { AgentKit, twitterActionProvider } = require("@coinbase/agentkit");
const { getLangChainTools } = require("@coinbase/agentkit-langchain");
const { HumanMessage } = require("@langchain/core/messages");
const { MemorySaver } = require("@langchain/langgraph");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { ChatOpenAI } = require("@langchain/openai");
const dotenv = require("dotenv");
const cookieAPITool = require("./cookieAPITool.js");

dotenv.config();

const modifier = `
  You are a helpful agent that can interact with the Twitter (X) API using the Coinbase Developer Platform Twitter (X) Agentkit.
  You are empowered to interact with Twitter (X) using your tools.

  If someone asks you to do something you can't do with your currently available tools, you must say so, and encourage them to implement it themselves using the Twitter (X) API + Agentkit.
  Recommend they go to https://developer.x.com/en/docs for more information.

  You also have access to Cookie API tool, which can be used to get the list of agents from the Twitter (X) API.
  A tool to interact with Cookie DAO API. Available operations:
        - getAgentByTwitter: Get agent details using Twitter username
        - getAgentByContract: Get agent details using contract address
        - getAgentsList: Get paginated list of agents
        - searchTweets: Search for tweets within a date range

  Be concise and helpful with your responses.
  Refrain from restating your tools' descriptions unless it is explicitly requested.
`;

/**
 * Initialize the agent with Twitter (X) Agentkit.
 * @returns {Promise<{agent: any, config: any}>} The agent executor and its configuration.
 */
async function initialize() {
  const llm = new ChatOpenAI({
    model: "openai/gpt-4o-mini",
    apiKey: process.env.OPENROUTER_API_KEY, // you can input your API key in plaintext, but this is not recommended
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
  const agentkit = await AgentKit.from({
    cdpApiKeyName: process.env.CDP_API_KEY_NAME,
    cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY
      ? process.env.CDP_API_KEY_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
    actionProviders: [twitterActionProvider()],
  });
  const tools = await getLangChainTools(agentkit);
  const alltools = [...tools, cookieAPITool];
  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "Pluto Chatbot " },
  };
  const agent = createReactAgent({
    llm,
    tools: alltools,
    checkpointSaver: memory,
    messageModifier: modifier,
  });
  return { agent, config: agentConfig };
}

/**
 * Handle chat mode over WebSocket.
 * @param {WebSocket} ws WebSocket connection.
 * @param {any} agent Agent executor.
 * @param {any} config Agent configuration.
 */
async function handleChatMode(ws, agent, config) {
  ws.send(
    JSON.stringify({
      type: "message",
      content: "Chat mode activated. Type your message (type 'exit' to quit).",
      timestamp: new Date().toISOString(),
    })
  );

  ws.on("message", async (data) => {
    try {
      // Convert the buffer to a string and parse it as JSON
      const rawData = data.toString();
      const message = JSON.parse(rawData);

      const userInput = message.content.trim();

      if (userInput.toLowerCase() === "exit") {
        ws.send(
          JSON.stringify({
            type: "message",
            content: "Exiting chat mode. Goodbye!",
            timestamp: new Date().toISOString(),
          })
        );
        ws.close();
        return;
      }

      // Stream the response from the agent
      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          ws.send(
            JSON.stringify({
              type: "message",
              content: chunk.agent.messages[0].content,
              timestamp: new Date().toISOString(),
            })
          );
        } else if ("tools" in chunk) {
          ws.send(
            JSON.stringify({
              type: "message",
              content: chunk.tools.messages[0].content,
              timestamp: new Date().toISOString(),
            })
          );
        }
        ws.send(
          JSON.stringify({
            type: "message",
            content: "-------------------",
            timestamp: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          content: "Error: " + error.message,
          timestamp: new Date().toISOString(),
        })
      );
    }
  });
}
/**
 * Handle autonomous mode over WebSocket.
 * @param {WebSocket} ws WebSocket connection.
 * @param {any} agent Agent executor.
 * @param {any} config Agent configuration.
 * @param {number} [interval=10] Time interval in seconds between actions.
 */
async function handleAutoMode(ws, agent, config, interval = 10) {
  ws.send(
    JSON.stringify({
      type: "message",
      content:
        "Autonomous mode activated. The agent will now run periodically.",
      timestamp: new Date().toISOString(),
    })
  );

  const thought =
    "Be creative and use the cookie tool to get the twitter agent list and compare and find good agent " +
    "Choose an action to post a tweet about the agent you found and tag the agent in the tweet";

  try {
    while (ws.readyState === ws.OPEN) {
      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          ws.send(
            JSON.stringify({
              type: "message",
              content: chunk.agent.messages[0].content,
              timestamp: new Date().toISOString(),
            })
          );
        } else if ("tools" in chunk) {
          ws.send(
            JSON.stringify({
              type: "message",
              content: chunk.tools.messages[0].content,
              timestamp: new Date().toISOString(),
            })
          );
        }
        ws.send(
          JSON.stringify({
            type: "message",
            content: "-------------------",
            timestamp: new Date().toISOString(),
          })
        );
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "error",
        content: "Error: " + error.message,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

module.exports = { initialize, handleChatMode, handleAutoMode };
