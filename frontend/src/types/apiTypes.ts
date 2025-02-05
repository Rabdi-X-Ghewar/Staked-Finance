// src/types/apiTypes.ts

export interface Contract {
  chain: number;
  contractAddress: string;
}

export interface TopTweet {
  tweetUrl: string;
  tweetAuthorProfileImageUrl: string;
  tweetAuthorDisplayName: string;
  likesCount: number;
  impressionsCount: number;
}

export interface Agent {
  agentName: string;
  contracts: Contract[];
  twitterUsernames: string[];
  mindshare: number;
  marketCap: number;
  price: number;
  holdersCount: number;
  topTweets: TopTweet[];
}