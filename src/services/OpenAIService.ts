interface AIAnalysisResult {
  success: boolean;
  summary?: string;
  issues?: string[];
  vehicleCondition?: string;
  repairAnalysis?: string;
  costAnalysis?: string;
  error?: string;
}

interface LineItemAnalysis {
  item: string;
  analysis: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

class OpenAIServiceClass {
  private readonly apiKey = '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';

  async analyzePO(poData: any, rawText: string): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please set your API key first.'
      };
    }

    try {
      const prompt = `
Analyze this fleet repair purchase order and provide insights:

RAW TEXT:
${rawText}

EXTRACTED PO DATA:
${JSON.stringify(poData, null, 2)}

Please provide:
1. SUMMARY: What happened to the vehicle and what repairs are being done
2. ISSUES: Any potential problems or concerns with this PO
3. VEHICLE_CONDITION: Assessment of the vehicle's condition based on repairs needed
4. REPAIR_ANALYSIS: Detailed analysis of what the mechanic is doing and why
5. COST_ANALYSIS: Assessment of pricing and value

Respond in JSON format with keys: summary, issues, vehicleCondition, repairAnalysis, costAnalysis
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert fleet mechanic and cost analyst. Analyze repair purchase orders and provide detailed insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse JSON response
      try {
        const analysis = JSON.parse(content);
        return {
          success: true,
          summary: analysis.summary,
          issues: Array.isArray(analysis.issues) ? analysis.issues : [analysis.issues].filter(Boolean),
          vehicleCondition: analysis.vehicleCondition,
          repairAnalysis: analysis.repairAnalysis,
          costAnalysis: analysis.costAnalysis
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw content
        return {
          success: true,
          summary: content,
          issues: [],
          vehicleCondition: '',
          repairAnalysis: '',
          costAnalysis: ''
        };
      }

    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze PO'
      };
    }
  }

  async analyzeLineItems(lineItems: any[]): Promise<LineItemAnalysis[]> {
    if (!this.apiKey || lineItems.length === 0) {
      return [];
    }

    try {
      const prompt = `
Analyze these repair line items for potential issues:

${JSON.stringify(lineItems, null, 2)}

For each item, provide:
- analysis: Brief analysis of the item
- riskLevel: low/medium/high based on cost, description clarity, necessity
- suggestions: Array of improvement suggestions

Respond in JSON array format.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert fleet maintenance auditor. Analyze repair line items for cost optimization and accuracy.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return [];
        }
      }

      return [];
    } catch (error) {
      console.error('Line item analysis error:', error);
      return [];
    }
  }
}

export const OpenAIService = new OpenAIServiceClass();
export type { AIAnalysisResult, LineItemAnalysis };