import { Request, Response } from 'express';
import { TenantAwareSupabase } from '../utils/tenant.utils';

export class MetricsController {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(req: Request, res: Response) {
    try {
      const { timeRange = '7d' } = req.query;
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const supabase = TenantAwareSupabase.getClient();

      // Calculate time range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(now.getDate() - 90);

      // Get conversation metrics
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, created_at, updated_at')
        .gte('created_at', startDate.toISOString());

      // Get message metrics (unused for now, for future features)
      const { data: _messages } = await supabase
        .from('messages')
        .select('id, sender, created_at')
        .gte('created_at', startDate.toISOString());

      // Calculate AI resolution rate
      const _totalConversations = conversations?.length || 0;
      const aiResolvedConversations =
        Array.isArray(conversations) ? conversations.filter((c: any) => c.status === 'resolved').length : 0;

      // Calculate time saved (assume 15 min per conversation)
      const minutesSaved = aiResolvedConversations * 15;
      const hoursSaved = Math.floor(minutesSaved / 60);
      const minutesRemainder = minutesSaved % 60;

      // Calculate money saved (R$ 45/hour average)
      const moneySaved = Math.round((minutesSaved / 60) * 45);

      // Calculate work days saved (8h workday)
      const workDaysSaved = (minutesSaved / 60 / 8).toFixed(1);

      // Get active conversations (money in motion)
      const { data: activeConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('status', 'active');

      // Calculate daily revenue by hour (last 24h)
      const dayAgo = new Date();
      dayAgo.setHours(dayAgo.getHours() - 24);

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', dayAgo.toISOString());

      // Group by hour
      const hourlyConversions = new Array(24).fill(0);
      recentMessages?.forEach((msg) => {
        const hour = new Date(msg.created_at).getHours();
        hourlyConversions[hour]++;
      });

      // Response data structure
      const dashboardMetrics = {
        impactData: {
          timeRecovered: `${hoursSaved}h ${minutesRemainder}min`,
          moneySaved: moneySaved.toString(),
          salesClosed: aiResolvedConversations,
          workDays: parseFloat(workDaysSaved),
        },
        metricsData: {
          moneyInMotion: {
            value: (activeConversations?.length || 0) * 270, // Média de R$270 por conversa
            conversations: activeConversations?.length || 0,
          },
          guaranteedRevenue: {
            value: 8960, // TODO: Calculate from bookings
            scheduled: 23, // TODO: Get from bookings table
          },
          capacityUsage: {
            percentage: 80, // TODO: Calculate from service capacity
            occupied: 8,
            total: 10,
          },
          freeTime: {
            hours: hoursSaved > 4 ? 4 : hoursSaved,
            minutes: hoursSaved > 4 ? 23 : minutesRemainder,
          },
        },
        chartsData: {
          timeSavedData: this.generateWeeklyData((conversations || []) as any[]),
          conversionsData: this.generateHourlyData(hourlyConversions),
          metricsComparison: this.generateComparisonData(),
        },
      };

      res.json(dashboardMetrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealtimeMetrics(req: Request, res: Response) {
    try {
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const supabase = TenantAwareSupabase.getClient();

      const { data: activeConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('status', 'active');

      const { data: pendingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', 'user')
        .is('read_at', null);

      res.json({
        activeConversations: activeConversations?.length || 0,
        pendingMessages: pendingMessages?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      res.status(500).json({ error: 'Failed to fetch realtime metrics' });
    }
  }

  /**
   * Get conversation metrics
   */
  async getConversationMetrics(req: Request, res: Response) {
    try {
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const supabase = TenantAwareSupabase.getClient();

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, created_at');

      res.json({ conversations: conversations || [] });
    } catch (error) {
      console.error('Error fetching conversation metrics:', error);
      res.status(500).json({ error: 'Failed to fetch conversation metrics' });
    }
  }

  /**
   * Get AI performance metrics
   */
  async getAIPerformanceMetrics(req: Request, res: Response) {
    try {
      const organizationId = (req as { organizationId?: string })
        .organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const supabase = TenantAwareSupabase.getClient();

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, status, created_at, updated_at');

      const total = conversations?.length || 0;
      const resolved =
        Array.isArray(conversations) ? conversations.filter((c: any) => c.status === 'resolved').length : 0;

      const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

      res.json({
        totalConversations: total,
        resolvedConversations: resolved,
        resolutionRate: Math.round(resolutionRate),
        averageResponseTime: '2.3 min', // TODO: Calculate from message timestamps
      });
    } catch (error) {
      console.error('Error fetching AI performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch AI performance metrics' });
    }
  }

  // Helper methods
  private generateWeeklyData(
    _conversations: Array<{
      id: string;
      status: string;
      created_at: string;
    }>
  ) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekData = days.map((day) => ({
      day,
      hours: Math.random() * 5 + 3,
      revenue: Math.random() * 600 + 400,
    }));
    return weekData;
  }

  private generateHourlyData(hourlyConversions: number[]) {
    return [
      { hour: '00h', conversions: hourlyConversions[0] || 0 },
      { hour: '04h', conversions: hourlyConversions[4] || 0 },
      { hour: '08h', conversions: hourlyConversions[8] || 0 },
      { hour: '12h', conversions: hourlyConversions[12] || 0 },
      { hour: '16h', conversions: hourlyConversions[16] || 0 },
      { hour: '20h', conversions: hourlyConversions[20] || 0 },
      { hour: '23h', conversions: hourlyConversions[23] || 0 },
    ];
  }

  private generateComparisonData() {
    return [
      { month: 'Jan', withAI: 85, withoutAI: 35 },
      { month: 'Fev', withAI: 92, withoutAI: 38 },
      { month: 'Mar', withAI: 88, withoutAI: 42 },
      { month: 'Abr', withAI: 95, withoutAI: 45 },
    ];
  }
}
