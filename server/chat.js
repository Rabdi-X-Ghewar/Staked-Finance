require('dotenv').config();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { BufferMemory } = require('langchain/memory');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { ConversationChain } = require("langchain/chains");
const axios = require('axios');
const readline = require('readline');

// Initialize Gemini AI
const model = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.7,
});

// Fetch data from Cookie API
async function fetchAgentData(username) {
    const url = `https://api.cookie.fun/v2/agents/twitterUsername/${username}?interval=_7Days`;
    try {
        console.log('Fetching data from:', url);
        const response = await axios.get(url, {
            headers: { 'x-api-key': process.env.COOKIE_DAO_API_KEY },
        });

        console.log('Raw API Response:', response.data);

        if (!response.data.ok) {
            throw new Error('Invalid or empty response from API');
        }

        // Log the parsed agent data
        console.log('Parsed Agent Data:', response.data.ok);

        return response.data.ok;
    } catch (error) {
        if (error.response) {
            console.error(`HTTP Error ${error.response.status}:`, error.response.data?.error?.errorMessage || error.message);
            return null;
        } else {
            console.error('Error fetching agent data:', error.message);
            return null;
        }
    }
}

// Set up memory and prompt template
const memory = new BufferMemory({
    memoryKey: 'chat_history',
    returnMessages: true, // Ensure memory returns an array of messages
});

const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', 'You are an AI assistant that provides insights about agents using data from the Cookie API.'],
    new MessagesPlaceholder('chat_history'), // Use MessagesPlaceholder for chat history
    ['human', '{input}'],
]);

// Create the LLM chain
const llmChain = new ConversationChain({
    llm: model,
    memory: memory,
    prompt: promptTemplate,
});

// Command-line interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('Welcome to the Cookie Agent Chatbot! Type "exit" to quit.');

async function handleUserInput(input) {
    const usernameMatch = input.match(/agent\s+(\w+)/i);
    if (usernameMatch) {
        const username = usernameMatch[1];
        console.log(`Fetching data for agent: ${username}`);
        const agentData = await fetchAgentData(username);

        if (!agentData) {
            return 'Failed to fetch agent data. Please check the username and try again.';
        }

        // Safe property access with fallbacks
        const summary = `
            Agent Name: ${agentData.agentName || 'N/A'}
            Mindshare: ${agentData.mindshare?.toFixed(2) || 'N/A'}
            Market Cap: $${agentData.marketCap?.toFixed(2) || 'N/A'}
            Price: $${agentData.price?.toFixed(2) || 'N/A'}
            Holders: ${agentData.holdersCount || 'N/A'}
        `;

        console.log('Generated Summary:', summary);

        const aiResponse = await llmChain.invoke({
            input: `Analyze this agent data: ${summary}`
        });
        return aiResponse.response;
    }

    return (await llmChain.invoke({ input })).response;
}

function askQuestion() {
    rl.question('> ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        try {
            const response = await handleUserInput(input);
            console.log('AI Response:', response);
        } catch (error) {
            console.error('Processing error:', error.message);
        }

        askQuestion();
    });
}

askQuestion();