export interface StoredPO {
  id: string;
  poNumber: string;
  vendor: string;
  vehicle: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  total: number;
  savings?: number;
  flaggedItems?: number;
  extractedData?: any;
  vehicleData?: any;
  rawText?: string;
  aiAnalysis?: any;
  priceComparison?: any[];
  aiNote?: string; // AI decision reasoning
  createdAt: string;
}

export interface POStats {
  totalPOs: number;
  approved: number;
  rejected: number;
  pending: number;
}

class LocalStorageServiceClass {
  private readonly PO_STORAGE_KEY = 'fleet_po_data';
  private readonly STATS_STORAGE_KEY = 'fleet_po_stats';

  // Get all stored POs
  getAllPOs(): StoredPO[] {
    try {
      const stored = localStorage.getItem(this.PO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading PO data from localStorage:', error);
      return [];
    }
  }

  // Get PO by ID
  getPO(id: string): StoredPO | null {
    const pos = this.getAllPOs();
    return pos.find(po => po.id === id) || null;
  }

  // Save new PO
  savePO(poData: Omit<StoredPO, 'id' | 'createdAt'>): StoredPO {
    const pos = this.getAllPOs();
    const newPO: StoredPO = {
      ...poData,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    
    pos.unshift(newPO); // Add to beginning
    
    try {
      localStorage.setItem(this.PO_STORAGE_KEY, JSON.stringify(pos));
      this.updateStats();
      return newPO;
    } catch (error) {
      console.error('Error saving PO to localStorage:', error);
      throw error;
    }
  }

  // Update existing PO
  updatePO(id: string, updates: Partial<StoredPO>): boolean {
    const pos = this.getAllPOs();
    const index = pos.findIndex(po => po.id === id);
    
    if (index === -1) return false;
    
    pos[index] = { ...pos[index], ...updates };
    
    try {
      localStorage.setItem(this.PO_STORAGE_KEY, JSON.stringify(pos));
      this.updateStats();
      return true;
    } catch (error) {
      console.error('Error updating PO in localStorage:', error);
      return false;
    }
  }

  // Delete PO
  deletePO(id: string): boolean {
    const pos = this.getAllPOs();
    const filteredPOs = pos.filter(po => po.id !== id);
    
    if (filteredPOs.length === pos.length) return false; // PO not found
    
    try {
      localStorage.setItem(this.PO_STORAGE_KEY, JSON.stringify(filteredPOs));
      this.updateStats();
      return true;
    } catch (error) {
      console.error('Error deleting PO from localStorage:', error);
      return false;
    }
  }

  // Get statistics
  getStats(): POStats {
    try {
      const stored = localStorage.getItem(this.STATS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stats from localStorage:', error);
    }
    
    // Fallback: calculate stats from current data
    return this.calculateStats();
  }

  // Update statistics
  private updateStats(): void {
    const stats = this.calculateStats();
    try {
      localStorage.setItem(this.STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats to localStorage:', error);
    }
  }

  // Calculate statistics from current data
  private calculateStats(): POStats {
    const pos = this.getAllPOs();
    
    return {
      totalPOs: pos.length,
      approved: pos.filter(po => po.status === 'approved').length,
      rejected: pos.filter(po => po.status === 'rejected').length,
      pending: pos.filter(po => po.status === 'pending').length
    };
  }

  // Get recent POs (last 10)
  getRecentPOs(limit: number = 10): StoredPO[] {
    return this.getAllPOs().slice(0, limit);
  }

  // Filter POs by status
  getPOsByStatus(status: StoredPO['status']): StoredPO[] {
    return this.getAllPOs().filter(po => po.status === status);
  }

  // Search POs
  searchPOs(query: string): StoredPO[] {
    const pos = this.getAllPOs();
    const lowercaseQuery = query.toLowerCase();
    
    return pos.filter(po => 
      po.poNumber.toLowerCase().includes(lowercaseQuery) ||
      po.vendor.toLowerCase().includes(lowercaseQuery) ||
      po.vehicle.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Generate unique ID
  private generateId(): string {
    return `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    try {
      localStorage.removeItem(this.PO_STORAGE_KEY);
      localStorage.removeItem(this.STATS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage data:', error);
    }
  }

  // Export data (for backup)
  exportData(): { pos: StoredPO[], stats: POStats } {
    return {
      pos: this.getAllPOs(),
      stats: this.getStats()
    };
  }

  // Import data (for restore)
  importData(data: { pos: StoredPO[], stats?: POStats }): boolean {
    try {
      localStorage.setItem(this.PO_STORAGE_KEY, JSON.stringify(data.pos));
      if (data.stats) {
        localStorage.setItem(this.STATS_STORAGE_KEY, JSON.stringify(data.stats));
      } else {
        this.updateStats();
      }
      return true;
    } catch (error) {
      console.error('Error importing data to localStorage:', error);
      return false;
    }
  }
}

export const LocalStorageService = new LocalStorageServiceClass();