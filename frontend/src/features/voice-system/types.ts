export interface ExamplePhrase {
  id: string;
  text: string;
}

export interface Intent {
  id: string;
  name: string;
  example_phrases: ExamplePhrase[];
  fixed_response: string;
}

export interface Conversation {
  id: string;
  heading: string;
  intents: Intent[];
}

export interface Agent {
  id: string;
  name: string;
  language: string;
  greeting?: { script: string };
  conversations: Conversation[];
  closing?: { script: string };
  dynamic_variables: Record<string, string>;
  fallbacks?: any;
  version?: number;
  status?: string;
}
