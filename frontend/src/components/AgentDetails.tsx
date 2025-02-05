import React, { useEffect, useState } from 'react';

interface Agent {
  agentName: string;
  mindshare: number;
  marketCap: number;
  price: number;
  holdersCount: number;
}

interface Props {
  username: string; // Twitter username of the agent
}

const AgentDetails: React.FC<Props> = ({ username }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        // Fetch data from the backend
        const response = await fetch(`http://localhost:3000/agent/twitter/${username}?interval=_7Days`);

        // Log the raw response for debugging
        const text = await response.text();
        console.log('Raw response:', text);

        // Check if the response status is OK
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON response
        const data = JSON.parse(text);
        setAgent(data.ok); // Set the agent data
        setLoading(false); // Stop loading
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching agent:', error.message);
          setError(error.message || 'An unexpected error occurred');
        } else {
          console.error('Error fetching agent:', error);
          setError('An unexpected error occurred');
        }
        setLoading(false); // Stop loading even if there's an error
      }
    };

    fetchAgent();
  }, [username]);

  if (loading) return <p>Loading agent details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!agent) return <p>No agent data available.</p>;

  return (
    <div>
      <h1>{agent.agentName}</h1>
      <p>Mindshare: {agent.mindshare.toFixed(2)}</p>
      <p>Market Cap: ${agent.marketCap.toFixed(2)}</p>
      <p>Price: ${agent.price.toFixed(2)}</p>
      <p>Holders: {agent.holdersCount}</p>
    </div>
  );
};

export default AgentDetails;