const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { BufferMemory } = require('langchain/memory');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { ConversationChain } = require("langchain/chains");
const axios = require('axios');

// Initialize Gemini AI
const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.7,
});

// Chat sessions storage (in production, use Redis or a database)
const chatSessions = new Map();

const getOrCreateChatSession = (sessionId) => {
    if (!chatSessions.has(sessionId)) {
        const memory = new BufferMemory({
            memoryKey: 'chat_history',
            returnMessages: true,
        });

        const promptTemplate = ChatPromptTemplate.fromMessages([
            ['system', 'You are an AI assistant that provides insights about agents using data from the Cookie API.'],
            new MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
        ]);

        const chain = new ConversationChain({
            llm: model,
            memory: memory,
            prompt: promptTemplate,
        });

        chatSessions.set(sessionId, chain);
    }
    return chatSessions.get(sessionId);
};

// Fetch agent data from Cookie API
async function fetchAgentData(username) {
    const url = `https://api.cookie.fun/v2/agents/twitterUsername/${username}?interval=_7Days`;
    try {
        const response = await axios.get(url, {
            headers: { 'x-api-key': process.env.COOKIE_DAO_API_KEY },
        });

        if (!response.data.ok) {
            throw new Error('Invalid or empty response from API');
        }

        return response.data.ok;
    } catch (error) {
        console.error('Error fetching agent data:', error.message);
        return null;
    }
}

exports.handleChat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const chain = getOrCreateChatSession(sessionId);
        
        const response = await chain.invoke({ input: message });
        
        res.json({
            success: true,
            response: response.response,
            cardData: null // No specific card data for general chat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.handleAgentChat = async (req, res) => {
    try {
        const { username } = req.params;
        const { message, sessionId } = req.body;
        const chain = getOrCreateChatSession(sessionId);

        // Fetch agent data
        const agentData = await fetchAgentData(username);
        if (!agentData) {
            throw new Error('Failed to fetch agent data');
        }

        // Prepare card data for UI
        const cardData = {
            agentName: agentData.agentName,
            mindshare: agentData.mindshare?.toFixed(2),
            marketCap: agentData.marketCap?.toFixed(2),
            price: agentData.price?.toFixed(2),
            holdersCount: agentData.holdersCount
        };

        // Generate summary for AI
        const summary = `
            Agent Name: ${cardData.agentName || 'N/A'}
            Mindshare: ${cardData.mindshare || 'N/A'}
            Market Cap: $${cardData.marketCap || 'N/A'}
            Price: $${cardData.price || 'N/A'}
            Holders: ${cardData.holdersCount || 'N/A'}
        `;

        // Get AI response
        const aiResponse = await chain.invoke({
            input: `${message}\nAgent Data: ${summary}`
        });

        res.json({
            success: true,
            response: aiResponse.response,
            cardData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};