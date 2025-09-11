export interface VehicleInfo {
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  mileage?: string;
  licensePlate?: string;
}

export interface LineItem {
  id: number;
  description: string;
  partNumber?: string;
  laborCode?: string;
  quantity: string;
  unitPrice: number;
  total: number;
  type: 'part' | 'labor' | 'other';
  ataCode?: string;
  correction?: string;
  cause?: string;
}

export interface POData {
  poNumber?: string;
  date?: string;
  vendor?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vehicle: VehicleInfo;
  lineItems: LineItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  terms?: string;
  authorizedBy?: string;
}

export interface ParseResult {
  success: boolean;
  data?: POData;
  error?: string;
  message?: string;
}

class POParserClass {
  private extractPatterns = {
    poNumber: /(?:PO#?\s*)(\d+)/i,
    date: /(?:Date\s*)(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
    vendor: /(?:Vendor:?\s*)([^0-9\n\r]+?)(?=\d|\n|$)/i,
    vendorAddress: /(?:Vendor:.*\n)(.*?)(?=National Account|Phone|$)/is,
    vendorPhone: /(?:Phone\s*:\s*)([\d\s\-\(\)]+)/i,
    
    // Vehicle patterns - updated for your format
    vehicleInfo: /(\d{4})\s+([A-Z\s]+)\s+([A-Z0-9]+)/i, // "2024 FORD F59"
    vin: /(?:VIN:?\s*)([A-Z0-9]{17})/i,
    year: /(\d{4})\s+[A-Z]+/i, // Extract year from "2024 FORD F59"
    make: /\d{4}\s+([A-Z]+)/i, // Extract make from "2024 FORD F59"  
    model: /\d{4}\s+[A-Z]+\s+([A-Z0-9]+)/i, // Extract model from "2024 FORD F59"
    mileage: /(?:Odometer\s*)(\d+)/i,
    licensePlate: /(?:Lic\s*Plate\s*)([A-Z0-9]+)/i,
    
    // Financial patterns
    subtotal: /(?:Subtotal:?\s*)\$?([\d,]+\.?\d*)/i,
    tax: /(?:Tax.*?:?\s*)\$?([\d,]+\.?\d*)/i,
    total: /(?:Total\s*Amount:?\s*)\$?([\d,]+\.?\d*)/i,
    
    // Other patterns
    terms: /(?:Terms:?\s*)([^\n\r]+)/i,
    authorizedBy: /(?:Authorized\s*By:?\s*)([^\n\r]+)/i
  };

  parse(text: string): ParseResult {
    try {
      console.log('Parsing extracted text...');
      
      // Check if this is a placeholder/demo text
      if (text.includes('Unable to extract - requires OCR setup')) {
        return {
          success: false,
          error: 'OCR Setup Required',
          message: 'Real OCR processing requires additional service configuration. This demo shows the upload workflow, but cannot extract actual text from images without proper OCR setup (Tesseract.js, Google Vision API, etc.)'
        };
      }
      
      const poData: POData = {
        vehicle: {},
        lineItems: []
      };

      // Extract basic PO information
      poData.poNumber = this.extractValue(text, this.extractPatterns.poNumber);
      poData.date = this.extractValue(text, this.extractPatterns.date);
      poData.vendor = this.extractValue(text, this.extractPatterns.vendor);
      poData.vendorAddress = this.extractValue(text, this.extractPatterns.vendorAddress);
      // Sanitize vendor address if it accidentally captured financial totals
      if (poData.vendorAddress && /(total|subtotal|tax|amount)/i.test(poData.vendorAddress)) {
        poData.vendorAddress = undefined;
      }
      poData.vendorPhone = this.extractValue(text, this.extractPatterns.vendorPhone);
      
      // Extract vehicle information
      poData.vehicle.vin = this.extractValue(text, this.extractPatterns.vin);
      poData.vehicle.year = this.extractValue(text, this.extractPatterns.year);
      poData.vehicle.make = this.extractValue(text, this.extractPatterns.make)?.trim();
      poData.vehicle.model = this.extractValue(text, this.extractPatterns.model)?.trim();
      poData.vehicle.mileage = this.extractValue(text, this.extractPatterns.mileage);
      poData.vehicle.licensePlate = this.extractValue(text, this.extractPatterns.licensePlate);

      // Extract financial totals
      const subtotalStr = this.extractValue(text, this.extractPatterns.subtotal);
      const taxStr = this.extractValue(text, this.extractPatterns.tax);
      const totalStr = this.extractValue(text, this.extractPatterns.total);

      // Fallback: find a generic 'Total' line (last occurrence)
      let totalAltStr: string | undefined;
      if (!totalStr) {
        const matches = Array.from(text.matchAll(/(?:^|\n)[^\n]*\b(?:grand\s*)?total\b[^\n]*?\$?\s*([\d,]+\.?\d*)/gmi));
        if (matches.length > 0) {
          totalAltStr = matches[matches.length - 1][1];
        }
      }
      
      poData.subtotal = subtotalStr ? parseFloat(subtotalStr.replace(/,/g, '')) : undefined;
      poData.tax = taxStr ? parseFloat(taxStr.replace(/,/g, '')) : undefined;
      poData.totalAmount = (totalStr || totalAltStr) ? parseFloat(((totalStr || totalAltStr) as string).replace(/,/g, '')) : undefined;

      // Extract other information
      poData.terms = this.extractValue(text, this.extractPatterns.terms);
      poData.authorizedBy = this.extractValue(text, this.extractPatterns.authorizedBy);

      // Extract line items
      poData.lineItems = this.extractLineItems(text);

      console.log('Parsed PO data:', poData);
      
      return {
        success: true,
        data: poData
      };
      
    } catch (error) {
      console.error('PO parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse PO data'
      };
    }
  }

  private extractValue(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern);
    return match ? match[1]?.trim() : undefined;
  }

  private extractLineItems(text: string): LineItem[] {
    const lineItems: LineItem[] = [];
    
    // Split text into lines and look for line item patterns
    const lines = text.split('\n');
    let itemId = 1;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Skip headers and empty lines
      if (!cleanLine || 
          cleanLine.includes('[Quanity') || 
          cleanLine.includes('[Cost') || 
          cleanLine.includes('Description') ||
          cleanLine.includes('Total:') ||
          cleanLine.length < 10) {
        continue;
      }

      // Pattern for: quantity $cost description TYPE atacode additional_info
      // Example: "2 $93.12 AIC RECIEVER - DRYER PART 01001065 REPLACE DOES NOT OPERATE PROPERLY"
      const pattern = /^(\d+)\s+\$?([\d,]+\.?\d*)\s+(.+?)\s+(PART|LABOR|PM)\s+(\d+)\s*(.*?)$/i;
      const match = cleanLine.match(pattern);
      
      if (match) {
        const [, quantity, cost, description, type, ataCode, additional] = match;
        
        const parsedQuantity = parseInt(quantity) || 1;
        const parsedCost = parseFloat(cost.replace(/,/g, '')) || 0;
        const unitPrice = parsedQuantity > 0 ? parsedCost / parsedQuantity : parsedCost;
        
        const lineItem: LineItem = {
          id: itemId++,
          description: description.trim(),
          quantity: parsedQuantity.toString(),
          unitPrice: unitPrice,
          total: parsedCost,
          type: type.toLowerCase() === 'part' ? 'part' : 
                type.toLowerCase() === 'labor' ? 'labor' : 'other',
          partNumber: type.toUpperCase() === 'PART' ? ataCode : undefined,
          laborCode: type.toUpperCase() === 'LABOR' ? ataCode : undefined,
          ataCode: ataCode,
          correction: additional?.includes('REPLACE') ? 'REPLACE' : additional?.trim() || '',
          cause: additional?.includes('NOT OPERATE') ? 'NOT OPERATE PROPERLY' : 
                 additional?.includes('MAINTENANCE') ? 'MAINTENANCE' : 
                 additional?.includes('NOT SUPPLIED') ? 'NOT SUPPLIED' : additional?.trim() || ''
        };
        
        lineItems.push(lineItem);
        continue;
      }

      // Alternative pattern without $ sign
      // Example: "7 5267.68 AIC REFRIGERANT, (PER LB) PART 01001273 REPLACE MAINTENANCE"
      const altPattern = /^(\d+)\s+([\d,]+\.?\d*)\s+(.+?)\s+(PART|LABOR|PM)\s+(\d+)\s*(.*?)$/i;
      const altMatch = cleanLine.match(altPattern);
      
      if (altMatch) {
        const [, quantity, cost, description, type, ataCode, additional] = altMatch;
        
        const parsedQuantity = parseInt(quantity) || 1;
        const parsedCost = parseFloat(cost.replace(/,/g, '')) || 0;
        const unitPrice = parsedQuantity > 0 ? parsedCost / parsedQuantity : parsedCost;
        
        const lineItem: LineItem = {
          id: itemId++,
          description: description.trim(),
          quantity: parsedQuantity.toString(),
          unitPrice: unitPrice,
          total: parsedCost,
          type: type.toLowerCase() === 'part' ? 'part' : 
                type.toLowerCase() === 'labor' ? 'labor' : 'other',
          partNumber: type.toUpperCase() === 'PART' ? ataCode : undefined,
          laborCode: type.toUpperCase() === 'LABOR' ? ataCode : undefined,
          ataCode: ataCode,
          correction: additional?.includes('REPLACE') ? 'REPLACE' : additional?.trim() || '',
          cause: additional?.includes('NOT OPERATE') ? 'NOT OPERATE PROPERLY' : 
                 additional?.includes('MAINTENANCE') ? 'MAINTENANCE' : 
                 additional?.includes('NOT SUPPLIED') ? 'NOT SUPPLIED' : additional?.trim() || ''
        };
        
        lineItems.push(lineItem);
      }
    }

    console.log('Extracted line items:', lineItems); // Debug log
    return lineItems;
  }

  private parseLineItem(section: string, id: number): LineItem | null {
    try {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length === 0) return null;
      
      let description = '';
      let partNumber = '';
      let laborCode = '';
      let quantity = '1';
      let unitPrice = 0;
      let total = 0;
      
      for (const line of lines) {
        // Extract description (usually the first meaningful line)
        if (!description && line && !line.match(/^(Part|Quantity|Price|Total)/i)) {
          description = line;
        }
        
        // Extract part number
        const partMatch = line.match(/Part\s*Number:?\s*([A-Z0-9\-]+)/i);
        if (partMatch) partNumber = partMatch[1];
        
        // Extract labor code
        const laborMatch = line.match(/Labor\s*Code:?\s*([A-Z0-9\-]+)/i);
        if (laborMatch) laborCode = laborMatch[1];
        
        // Extract quantity
        const qtyMatch = line.match(/Quantity:?\s*(\d+(?:\.\d+)?(?:\s*\w+)?)/i);
        if (qtyMatch) quantity = qtyMatch[1];
        
        // Extract unit price
        const unitPriceMatch = line.match(/Unit\s*Price:?\s*\$?([\d,]+\.?\d*)/i);
        if (unitPriceMatch) unitPrice = parseFloat(unitPriceMatch[1].replace(/,/g, ''));
        
        // Extract total
        const totalMatch = line.match(/Total:?\s*\$?([\d,]+\.?\d*)/i);
        if (totalMatch) total = parseFloat(totalMatch[1].replace(/,/g, ''));
      }
      
      if (!description) return null;
      
      // Determine item type
      let type: 'part' | 'labor' | 'other' = 'other';
      if (partNumber || description.toLowerCase().includes('part') || description.toLowerCase().includes('brake') || description.toLowerCase().includes('filter')) {
        type = 'part';
      } else if (laborCode || description.toLowerCase().includes('labor') || description.toLowerCase().includes('service') || description.toLowerCase().includes('hour')) {
        type = 'labor';
      }
      
      return {
        id,
        description,
        partNumber: partNumber || undefined,
        laborCode: laborCode || undefined,
        quantity,
        unitPrice,
        total,
        type
      };
      
    } catch (error) {
      console.error('Error parsing line item:', error);
      return null;
    }
  }

  private completeLineItem(item: Partial<LineItem>, id: number): LineItem | null {
    if (!item.description) return null;
    
    return {
      id,
      description: item.description,
      partNumber: item.partNumber,
      laborCode: item.laborCode,
      quantity: item.quantity || '1',
      unitPrice: item.unitPrice || 0,
      total: item.total || 0,
      type: item.partNumber ? 'part' : item.laborCode ? 'labor' : 'other'
    };
  }
}

export const POParser = new POParserClass();
