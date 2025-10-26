interface MarketPriceResult {
  success: boolean;
  averagePrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  sources?: Array<{
    title: string;
    price: number;
    source: string;
    link: string;
  }>;
  error?: string;
}

interface PriceComparisonResult {
  item: string;
  currentPrice: number;
  marketPrice?: number;
  variance?: number;
  status: 'good' | 'caution' | 'overpriced';
  confidence: number;
}

class SerpAPIServiceClass {
  private readonly apiKey = import.meta.env.VITE_SERPAPI_KEY;
  private readonly baseUrl = 'https://serpapi.com/search.json';

  async getMarketPrice(itemDescription: string, partNumber?: string): Promise<MarketPriceResult> {
    try {
      console.log(`🔍 Searching market price for: ${itemDescription}${partNumber ? ` (${partNumber})` : ''}`);
      
      if (!this.apiKey) {
        console.warn('⚠️ SerpAPI key not found, using mock data');
        return this.getMockMarketPrice(itemDescription, partNumber) || {
          success: false,
          error: 'SerpAPI key not configured'
        };
      }

      // Build search query
      const baseQuery = partNumber 
        ? `${itemDescription} ${partNumber}`
        : `${itemDescription}`;
      
      const searchQuery = `${baseQuery} automotive parts price site:(autozone.com OR advanceautoparts.com OR napaonline.com OR oreillyauto.com OR rockauto.com OR partsgeek.com OR finditparts.com OR ryderfleetproducts.com OR fleetpride.com)`;

      // Build request URL
      const params = new URLSearchParams({
        engine: 'google',
        q: searchQuery,
        tbm: 'shop',
        api_key: this.apiKey,
        num: '20',
        gl: 'us',
        hl: 'en',
        location: 'United States'
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check if we have shopping results
      if (!data.shopping_results || data.shopping_results.length === 0) {
        console.log(`ℹ️ No market data found for: ${itemDescription}`);
        
        // Try mock data for development
        const mockResult = this.getMockMarketPrice(itemDescription, partNumber);
        if (mockResult) {
          return mockResult;
        }
        
        return {
          success: false,
          error: 'No market price data found'
        };
      }

      // Extract price information from shopping results
      const prices: number[] = [];
      const sources: Array<{ title: string; price: number; source: string; link: string }> = [];

      for (const result of data.shopping_results) {
        // Extract price from different possible formats
        let price = 0;
        
        if (result.price) {
          // Handle price formats like "$29.99", "29.99", etc.
          const priceStr = result.price.toString().replace(/[^\d.]/g, '');
          price = parseFloat(priceStr);
        } else if (result.extracted_price) {
          price = parseFloat(result.extracted_price);
        }

        if (price > 0 && price < 10000) { // Filter out unrealistic prices
          prices.push(price);
          sources.push({
            title: result.title || 'Unknown Product',
            price: price,
            source: result.source || 'Unknown Source',
            link: result.link || ''
          });
        }
      }

      if (prices.length === 0) {
        console.log(`⚠️ No valid prices found for: ${itemDescription}`);
        return {
          success: false,
          error: 'No valid price data found'
        };
      }

      // Calculate statistics
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      console.log(`✅ Found ${prices.length} prices for ${itemDescription}, avg: $${averagePrice.toFixed(2)}`);

      return {
        success: true,
        averagePrice: averagePrice,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        sources: sources.slice(0, 5) // Return top 5 sources
      };

    } catch (error) {
      console.error('SerpAPI error:', error);
      
      // Try mock data for development
      const mockResult = this.getMockMarketPrice(itemDescription, partNumber);
      if (mockResult) {
        console.log(`🎭 Using mock data for: ${itemDescription}`);
        return mockResult;
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private getMockMarketPrice(itemDescription: string, partNumber?: string): MarketPriceResult | null {
    // Mock data for development/testing
    const mockPrices: { [key: string]: number } = {
      'headlamp': 85.99,
      'headlight': 85.99,
      'housing': 85.99,
      'bolt': 3.99,
      'adhesive': 15.99,
      'sealant': 15.99,
      'door': 125.99,
      'latch': 45.99,
      'hinge': 35.99,
      'compressor': 899.99,
      'reciever': 125.99,
      'dryer': 125.99,
      'refrigerant': 12.99
    };

    const description = itemDescription.toLowerCase();
    let mockPrice = 25.99; // default price

    // Find matching mock price
    for (const [keyword, price] of Object.entries(mockPrices)) {
      if (description.includes(keyword)) {
        mockPrice = price;
        break;
      }
    }

    return {
      success: true,
      averagePrice: mockPrice,
      priceRange: {
        min: mockPrice * 0.8,
        max: mockPrice * 1.2
      },
      sources: [
        {
          title: `Mock ${itemDescription}`,
          price: mockPrice,
          source: 'Mock Data',
          link: '#'
        }
      ]
    };
  }

  async compareLinePrices(lineItems: { description: string; partNumber?: string; unitPrice: number }[]): Promise<PriceComparisonResult[]> {
    const results: PriceComparisonResult[] = [];

    for (const item of lineItems) {
      try {
        const marketResult = await this.getMarketPrice(item.description, item.partNumber);
        
        let status: 'good' | 'caution' | 'overpriced' = 'good';
        let variance = 0;
        let confidence = 0.5; // Default confidence

        if (marketResult.success && marketResult.averagePrice) {
          variance = ((item.unitPrice - marketResult.averagePrice) / marketResult.averagePrice) * 100;
          
          if (variance > 25) {
            status = 'overpriced';
            confidence = 0.8;
          } else if (variance > 10) {
            status = 'caution';
            confidence = 0.7;
          } else {
            status = 'good';
            confidence = 0.9;
          }
        }

        results.push({
          item: item.description,
          currentPrice: item.unitPrice,
          marketPrice: marketResult.averagePrice,
          variance: variance,
          status: status,
          confidence: confidence
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error comparing price for ${item.description}:`, error);
        
        // Add item with unknown status
        results.push({
          item: item.description,
          currentPrice: item.unitPrice,
          status: 'good',
          confidence: 0.1
        });
      }
    }

    return results;
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Helper method to format percentage
  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}

// Export singleton instance
export const SerpAPIService = new SerpAPIServiceClass();
export default SerpAPIService;
