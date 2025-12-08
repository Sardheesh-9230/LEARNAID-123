// Chatbot service for study assistance
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatBotResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ChatBotService {
  private apiUrl = '/api/chatbot';

  async sendMessage(message: string, context?: string): Promise<ChatBotResponse> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: message,
          context,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to send message to chatbot`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.response || data.message || 'Response received',
        data: data,
      };
    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        success: false,
        message: 'Failed to communicate with chatbot',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStudyHelp(topic: string, subject?: string): Promise<ChatBotResponse> {
    const context = subject ? `Subject: ${subject}` : '';
    const message = `Help me understand: ${topic}`;
    
    return this.sendMessage(message, context);
  }

  async generateQuestions(topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<ChatBotResponse> {
    const message = `Generate ${difficulty} level questions for: ${topic}`;
    
    return this.sendMessage(message, `difficulty: ${difficulty}`);
  }

  async explainConcept(concept: string, level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ChatBotResponse> {
    const message = `Explain this concept at ${level} level: ${concept}`;
    
    return this.sendMessage(message, `level: ${level}`);
  }
}

export const chatBotService = new ChatBotService();