// Email Warm-up and Deliverability System
// Implements gradual sending limits and reputation monitoring

export interface WarmupConfig {
  userId: string;
  emailAccount: string;
  startDate: Date;
  currentDailyLimit: number;
  targetDailyLimit: number;
  warmupDays: number;
  currentDay: number;
  status: 'active' | 'paused' | 'completed';
}

export interface DomainHealth {
  domain: string;
  spfValid: boolean;
  dkimValid: boolean;
  dmarcValid: boolean;
  reputationScore: number; // 0-100
  blacklistStatus: 'clean' | 'listed';
  lastChecked: Date;
}

export class EmailWarmupService {
  /**
   * Calculate the daily sending limit based on warmup progress
   * Follows industry best practices: start slow, ramp up gradually
   */
  calculateDailyLimit(config: WarmupConfig): number {
    // Day 1-3: 5-10 emails
    if (config.currentDay <= 3) return Math.min(5 + config.currentDay * 2, 10);
    // Day 4-7: 10-25 emails
    if (config.currentDay <= 7) return Math.min(10 + (config.currentDay - 3) * 5, 25);
    // Day 8-14: 25-50 emails
    if (config.currentDay <= 14) return Math.min(25 + (config.currentDay - 7) * 3, 50);
    // Day 15-21: 50-100 emails
    if (config.currentDay <= 21) return Math.min(50 + (config.currentDay - 14) * 7, 100);
    // Day 22-28: 100-200 emails
    if (config.currentDay <= 28) return Math.min(100 + (config.currentDay - 21) * 14, 200);
    // After 28 days: gradually reach target
    return Math.min(200 + (config.currentDay - 28) * 20, config.targetDailyLimit);
  }

  /**
   * Validate domain authentication (SPF, DKIM, DMARC)
   */
  async validateDomainAuth(domain: string): Promise<DomainHealth> {
    try {
      // In production, integrate with DNS lookup services
      // For now, return structure for implementation
      return {
        domain,
        spfValid: false,
        dkimValid: false,
        dmarcValid: false,
        reputationScore: 0,
        blacklistStatus: 'clean',
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Error validating domain:', error);
      throw error;
    }
  }

  /**
   * Check if an email account is ready to send based on warmup status
   */
  canSendEmail(config: WarmupConfig, sentToday: number): boolean {
    if (config.status !== 'active') return false;
    const dailyLimit = this.calculateDailyLimit(config);
    return sentToday < dailyLimit;
  }

  /**
   * Get warmup recommendations
   */
  getWarmupRecommendations(config: WarmupConfig): string[] {
    const recommendations: string[] = [];
    
    if (config.currentDay < 7) {
      recommendations.push('Send to engaged contacts who are likely to reply');
      recommendations.push('Avoid sending to cold lists during warmup');
    }
    
    if (config.currentDay < 14) {
      recommendations.push('Maintain consistent sending times each day');
      recommendations.push('Ensure your content varies to appear more human');
    }
    
    if (config.currentDay < 21) {
      recommendations.push('Start incorporating follow-up sequences');
      recommendations.push('Monitor spam complaints closely');
    }
    
    return recommendations;
  }
}

export const warmupService = new EmailWarmupService();
