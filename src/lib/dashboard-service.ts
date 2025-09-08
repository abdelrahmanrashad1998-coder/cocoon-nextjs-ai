import { 
  collection, 
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import { QuoteData, QuoteStatus } from "@/types/quote";

export interface DashboardMetrics {
  totalRevenue: number;
  activeProjects: number;
  completedProjects: number;
  profitMargin: number;
  revenueGrowth: number;
  projectGrowth: number;
  completionGrowth: number;
  profitGrowth: number;
}

export interface ProjectData {
  id: string;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
  createdAt: string;
  updatedAt?: string;
  totalValue?: number;
  clientName?: string;
  productionStartDate?: string;
  actualDaysInProduction?: number;
}

export interface ChartDataPoint {
  date: string;
  completed: number;
  inProgress: number;
  revenue: number;
}

export class DashboardService {
  /**
   * Fetch all quotes from Firebase
   */
  static async fetchQuotes(): Promise<QuoteData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "quotes"));
      const quotes: QuoteData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quotes.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString()
        } as QuoteData);
      });
      
      return quotes;
    } catch (error) {
      console.error("Error fetching quotes:", error);
      throw error;
    }
  }

  /**
   * Calculate dashboard metrics from quotes data
   */
  static calculateMetrics(quotes: QuoteData[]): DashboardMetrics {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastQuarter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    // Filter quotes by time periods
    const allQuotes = quotes;
    const lastMonthQuotes = quotes.filter(quote => 
      new Date(quote.createdAt) >= lastMonth
    );
    const lastQuarterQuotes = quotes.filter(quote => 
      new Date(quote.createdAt) >= lastQuarter
    );

    // Calculate totals
    const totalRevenue = allQuotes.reduce((sum, quote) => {
      const quoteTotal = quote.items.reduce((itemSum, item) => {
        const area = item.width * item.height * item.quantity;
        const basePrice = area * 150; // Base price per m²
        return itemSum + basePrice;
      }, 0);
      return sum + quoteTotal;
    }, 0);

    const lastQuarterRevenue = lastQuarterQuotes.reduce((sum, quote) => {
      const quoteTotal = quote.items.reduce((itemSum, item) => {
        const area = item.width * item.height * item.quantity;
        const basePrice = area * 150;
        return itemSum + basePrice;
      }, 0);
      return sum + quoteTotal;
    }, 0);

    // Count projects by status
    const activeProjects = quotes.filter(quote => 
      ["draft", "pending_review", "approved", "in_production"].includes(quote.status || "draft")
    ).length;

    const completedProjects = quotes.filter(quote => 
      quote.status === "completed"
    ).length;

    // Calculate profit margin (simplified calculation)
    const totalCosts = totalRevenue * 0.7; // Assume 70% costs
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

    // Calculate growth percentages
    const revenueGrowth = lastQuarterRevenue > 0 ? 
      ((totalRevenue - lastQuarterRevenue) / lastQuarterRevenue) * 100 : 0;

    const projectGrowth = lastMonthQuotes.length > 0 ? 
      ((quotes.length - lastMonthQuotes.length) / lastMonthQuotes.length) * 100 : 0;

    const completionGrowth = lastMonthQuotes.filter(q => q.status === "completed").length > 0 ?
      ((completedProjects - lastMonthQuotes.filter(q => q.status === "completed").length) / 
       lastMonthQuotes.filter(q => q.status === "completed").length) * 100 : 0;

    const profitGrowth = 2.1; // Mock value for now

    return {
      totalRevenue,
      activeProjects,
      completedProjects,
      profitMargin,
      revenueGrowth,
      projectGrowth,
      completionGrowth,
      profitGrowth,
    };
  }

  /**
   * Convert quotes to project data for the table
   */
  static convertQuotesToProjects(quotes: QuoteData[]): ProjectData[] {
    return quotes.map(quote => {
      // Calculate project duration based on settings
      const targetDays = quote.settings?.projectDuration || 60;
      
      // Calculate actual days based on production status
      let actualDays = 0;
      let productionStartDate: string | undefined;
      let actualDaysInProduction: number | undefined;

      if (quote.status === "in_production") {
        // If in production, check if we have a production start date
        productionStartDate = quote.productionStartDate || quote.updatedAt || quote.createdAt;
        const startDate = new Date(productionStartDate);
        const now = new Date();
        actualDaysInProduction = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        actualDays = actualDaysInProduction;
      } else if (quote.status === "completed") {
        // If completed, calculate total days from creation to completion
        const createdDate = new Date(quote.createdAt);
        const completedDate = new Date(quote.updatedAt || quote.createdAt);
        actualDays = Math.floor((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // For other statuses, show 0 or minimal progress
        actualDays = 0;
      }

      // Determine project type based on items
      const itemTypes = quote.items.map(item => item.type);
      const primaryType = itemTypes.includes("curtain_wall") ? "Curtain Wall" :
                         itemTypes.includes("window") ? "Windows" :
                         itemTypes.includes("door") ? "Doors" :
                         itemTypes.includes("sky_light") ? "Sky Light" :
                         "Mixed";

      // Map status - keep original status names for better tracking
      const statusMap: Record<QuoteStatus, string> = {
        draft: "Draft",
        pending_review: "Pending Review", 
        approved: "Approved",
        rejected: "Rejected",
        in_production: "In Production",
        completed: "Completed",
        cancelled: "Cancelled"
      };

      // Calculate project value
      const totalValue = quote.items.reduce((sum, item) => {
        const area = item.width * item.height * item.quantity;
        const basePrice = area * 150;
        return sum + basePrice;
      }, 0);

      return {
        id: quote.id,
        header: quote.name || `Project ${quote.id}`,
        type: primaryType,
        status: statusMap[quote.status || "draft"],
        target: targetDays.toString(),
        limit: actualDays.toString(),
        reviewer: "Assign manager",
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        totalValue,
        clientName: quote.contactInfo?.name || "Unknown Client",
        productionStartDate,
        actualDaysInProduction
      };
    });
  }

  /**
   * Generate chart data from quotes
   */
  static generateChartData(quotes: QuoteData[]): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    
    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count quotes created on this date
      const dayQuotes = quotes.filter(quote => {
        const quoteDate = new Date(quote.createdAt).toISOString().split('T')[0];
        return quoteDate === dateStr;
      });

      const completed = dayQuotes.filter(q => q.status === "completed").length;
      const inProgress = dayQuotes.filter(q => 
        ["draft", "pending_review", "approved", "in_production"].includes(q.status || "draft")
      ).length;

      const revenue = dayQuotes.reduce((sum, quote) => {
        return sum + quote.items.reduce((itemSum, item) => {
          const area = item.width * item.height * item.quantity;
          return itemSum + (area * 150);
        }, 0);
      }, 0);

      data.push({
        date: dateStr,
        completed,
        inProgress,
        revenue
      });
    }

    return data;
  }

  /**
   * Get dashboard data (all in one call)
   */
  static async getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    projects: ProjectData[];
    chartData: ChartDataPoint[];
  }> {
    try {
      const quotes = await this.fetchQuotes();
      const metrics = this.calculateMetrics(quotes);
      const projects = this.convertQuotesToProjects(quotes);
      const chartData = this.generateChartData(quotes);

      return {
        metrics,
        projects,
        chartData
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      throw error;
    }
  }
}
