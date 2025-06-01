
import { supabase } from "@/integrations/supabase/client";

export interface LinkAnalytics {
  linkId: string;
  title: string;
  totalViews: number;
  createdAt: string;
  lastViewed?: string;
  viewsOverTime: { date: string; views: number }[];
}

export interface DashboardAnalytics {
  totalLinks: number;
  totalViews: number;
  activeLinks: number;
  expiredLinks: number;
  recentActivity: {
    date: string;
    linksCreated: number;
    totalViews: number;
  }[];
  topPerformingLinks: {
    id: string;
    title: string;
    views: number;
  }[];
}

export class AnalyticsService {
  static async getDashboardAnalytics(userId: string): Promise<{ success: boolean; analytics?: DashboardAnalytics; error?: string }> {
    try {
      // Get all user links
      const { data: links, error: linksError } = await supabase
        .from("links")
        .select("id, title, views, created_at, expiration_date")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (linksError) {
        return { success: false, error: linksError.message };
      }

      const now = new Date();
      const totalLinks = links?.length || 0;
      const totalViews = links?.reduce((sum, link) => sum + (link.views || 0), 0) || 0;
      const expiredLinks = links?.filter(link => 
        link.expiration_date && new Date(link.expiration_date) < now
      ).length || 0;
      const activeLinks = totalLinks - expiredLinks;

      // Calculate recent activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const recentActivity = last7Days.map(date => {
        const dayLinks = links?.filter(link => 
          link.created_at.startsWith(date)
        ) || [];
        
        return {
          date,
          linksCreated: dayLinks.length,
          totalViews: dayLinks.reduce((sum, link) => sum + (link.views || 0), 0)
        };
      });

      // Top performing links
      const topPerformingLinks = (links || [])
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(link => ({
          id: link.id,
          title: link.title,
          views: link.views || 0
        }));

      const analytics: DashboardAnalytics = {
        totalLinks,
        totalViews,
        activeLinks,
        expiredLinks,
        recentActivity,
        topPerformingLinks
      };

      return { success: true, analytics };
    } catch (error: any) {
      console.error("Error getting dashboard analytics:", error);
      return { success: false, error: error.message };
    }
  }

  static async getLinkAnalytics(linkId: string): Promise<{ success: boolean; analytics?: LinkAnalytics; error?: string }> {
    try {
      const { data: link, error: linkError } = await supabase
        .from("links")
        .select("id, title, views, created_at")
        .eq("id", linkId)
        .single();

      if (linkError) {
        return { success: false, error: linkError.message };
      }

      // For now, create mock view data over time
      // In a real implementation, you'd track individual view events
      const viewsOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * (link.views || 0) / 7)
        };
      });

      const analytics: LinkAnalytics = {
        linkId: link.id,
        title: link.title,
        totalViews: link.views || 0,
        createdAt: link.created_at,
        viewsOverTime
      };

      return { success: true, analytics };
    } catch (error: any) {
      console.error("Error getting link analytics:", error);
      return { success: false, error: error.message };
    }
  }

  static async recordView(linkId: string, metadata?: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Record the view using the database function
      await supabase.rpc('increment_link_views', { link_id: linkId });

      // In a more advanced implementation, you could also record:
      // - IP address (hashed for privacy)
      // - User agent
      // - Referrer
      // - Timestamp
      // This would allow for more detailed analytics

      return { success: true };
    } catch (error: any) {
      console.error("Error recording view:", error);
      return { success: false, error: error.message };
    }
  }
}
