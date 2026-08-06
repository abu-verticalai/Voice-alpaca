export interface ExamplePhrase {
  id: string;
  text: string;
}

export interface Intent {
  id: string;
  name: string;
  examplePhrases: ExamplePhrase[];
  fixedResponse: string;
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
  greeting: string;
  conversations: Conversation[];
  closing: string;
  dynamicVariables: Record<string, string>;
}
