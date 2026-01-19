// Lead Enrichment Service
// Automated data collection and enhancement for prospects

export interface LeadEnrichmentData {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  companyDomain?: string;
  companySize?: string;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  phoneNumber?: string;
  enrichedAt: Date;
  confidence: 'high' | 'medium' | 'low';
}

export interface CompanyData {
  domain: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  founded?: number;
  location?: string;
  website?: string;
  techStack?: string[];
  revenue?: string;
  funding?: string;
  recentNews?: Array<{
    title: string;
    date: Date;
    source: string;
    url: string;
  }>;
}

export class LeadEnrichmentService {
  /**
   * Enrich a lead with additional data from multiple sources
   * In production: integrate with Clearbit, Hunter.io, LinkedIn API, etc.
   */
  async enrichLead(email: string): Promise<LeadEnrichmentData> {
    try {
      // Extract domain from email
      const domain = email.split('@')[1];
      
      // In production, call enrichment APIs in waterfall approach
      const enrichedData: LeadEnrichmentData = {
        email,
        enrichedAt: new Date(),
        confidence: 'medium',
        companyDomain: domain,
      };
      
      return enrichedData;
    } catch (error) {
      console.error('Error enriching lead:', error);
      return {
        email,
        enrichedAt: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Enrich company data
   */
  async enrichCompany(domain: string): Promise<CompanyData> {
    try {
      // In production: integrate with Clearbit, Crunchbase, etc.
      const companyData: CompanyData = {
        domain,
        name: domain.split('.')[0],
      };
      
      return companyData;
    } catch (error) {
      console.error('Error enriching company:', error);
      throw error;
    }
  }

  /**
   * Verify email address validity
   */
  async verifyEmail(email: string): Promise<{
    valid: boolean;
    reason?: string;
    deliverable: boolean;
  }> {
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, deliverable: false, reason: 'Invalid format' };
    }
    
    // In production: integrate with email verification services
    // Check if domain exists, mailbox exists, catch-all detection
    return {
      valid: true,
      deliverable: true,
    };
  }

  /**
   * Score lead quality based on available data
   */
  scoreLead(data: LeadEnrichmentData): number {
    let score = 0;
    
    // More complete data = higher score
    if (data.firstName) score += 10;
    if (data.lastName) score += 10;
    if (data.jobTitle) score += 15;
    if (data.company) score += 15;
    if (data.linkedinUrl) score += 20;
    if (data.phoneNumber) score += 10;
    if (data.companyDomain) score += 10;
    if (data.industry) score += 5;
    if (data.location) score += 5;
    
    return score; // 0-100
  }

  /**
   * Generate personalization variables for email templates
   */
  generatePersonalizationVars(
    lead: LeadEnrichmentData,
    company?: CompanyData
  ): Record<string, string> {
    return {
      firstName: lead.firstName || 'there',
      lastName: lead.lastName || '',
      fullName: lead.fullName || lead.firstName || 'there',
      jobTitle: lead.jobTitle || 'team member',
      company: lead.company || company?.name || 'your company',
      industry: lead.industry || company?.industry || 'your industry',
      location: lead.location || company?.location || '',
      companySize: company?.size || lead.companySize || '',
    };
  }
}

export const leadEnrichment = new LeadEnrichmentService();
