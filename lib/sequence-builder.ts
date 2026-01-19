//Email Sequence Builder
// Visual workflow for multi-step email campaigns

export interface EmailSequenceStep {
  id: string;
  order: number;
  templateId?: string;
  subject: string;
  body: string;
  delayDays: number; // Delay from previous step
  delayHours?: number; // Additional hours
  condition?: {
    type: 'opened' | 'clicked' | 'replied' | 'not_opened' | 'not_replied';
    action: 'continue' | 'skip' | 'end_sequence';
  };
  abTest?: {
    enabled: boolean;
    variantA: Partial<EmailSequenceStep>;
    variantB: Partial<EmailSequenceStep>;
    splitPercentage: number; // 0-100, % for variant A
  };
}

export interface EmailSequence {
  id: string;
  userId: string;
  name: string;
  description?: string;
  steps: EmailSequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalSubscribers: number;
  activeSubscribers: number;
  completedSubscribers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceSubscriber {
  id: string;
  sequenceId: string;
  businessId: string;
  email: string;
  currentStep: number;
  nextSendAt?: Date;
  status: 'active' | 'completed' | 'unsubscribed' | 'bounced';
  stepHistory: Array<{
    stepId: string;
    sentAt: Date;
    opened?: boolean;
    clicked?: boolean;
    replied?: boolean;
  }>;
}

export class SequenceBuilder {
  /**
   * Validate sequence structure
   */
  validateSequence(sequence: EmailSequence): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!sequence.name || sequence.name.trim().length === 0) {
      errors.push('Sequence name is required');
    }
    
    if (sequence.steps.length === 0) {
      errors.push('At least one step is required');
    }
    
    // Check for duplicate orders
    const orders = sequence.steps.map(s => s.order);
    if (new Set(orders).size !== orders.length) {
      errors.push('Duplicate step orders detected');
    }
    
    // Validate delays
    sequence.steps.forEach((step, index) => {
      if (index > 0 &&step.delayDays === 0 && !step.delayHours) {
        errors.push(`Step ${index + 1}: Must have a delay from previous step`);
      }
      if (step.delayDays < 0 || (step.delayHours && step.delayHours < 0)) {
        errors.push(`Step ${index + 1}: Delay cannot be negative`);
      }
    });
    
    // Validate AB tests
    sequence.steps.forEach((step, index) => {
      if (step.abTest?.enabled) {
        if (!step.abTest.variantA || !step.abTest.variantB) {
          errors.push(`Step ${index + 1}: AB test requires both variants`);
        }
        if (step.abTest.splitPercentage < 0 || step.abTest.splitPercentage > 100) {
          errors.push(`Step ${index + 1}: Invalid AB test split percentage`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate next send time for a subscriber
   */
  calculateNextSendTime(
    subscriber: SequenceSubscriber,
    sequence: EmailSequence
  ): Date | null {
    const currentStep = sequence.steps.find(s => s.order === subscriber.currentStep);
    
    if (!currentStep) return null;
    
    // Check if sequence is complete
    if (subscriber.currentStep >= sequence.steps.length) {
      return null;
    }
    
    // Get last sent time
    const lastSent = subscriber.stepHistory[subscriber.stepHistory.length - 1]?.sentAt;
    if (!lastSent) return new Date(); // Send immediately if never sent
    
    // Calculate delay
    const nextStep = sequence.steps[subscriber.currentStep];
    if (!nextStep) return null;
    
    const delayMs =
      (nextStep.delayDays * 24 * 60 * 60 * 1000) +
      ((nextStep.delayHours || 0) * 60 * 60 * 1000);
    
    return new Date(lastSent.getTime() + delayMs);
  }

  /**
   * Check if subscriber should proceed to next step based on conditions
   */
  shouldProceedToNextStep(
    subscriber: SequenceSubscriber,
    currentStep: EmailSequenceStep
  ): boolean {
    if (!currentStep.condition) return true; // No condition, always proceed
    
    const lastHistory = subscriber.stepHistory[subscriber.stepHistory.length - 1];
    if (!lastHistory) return true;
    
    const { type, action } = currentStep.condition;
    
    let conditionMet = false;
    switch (type) {
      case 'opened':
        conditionMet = !!lastHistory.opened;
        break;
      case 'clicked':
        conditionMet = !!lastHistory.clicked;
        break;
      case 'replied':
        conditionMet = !!lastHistory.replied;
        break;
      case 'not_opened':
        conditionMet = !lastHistory.opened;
        break;
      case 'not_replied':
        conditionMet = !lastHistory.replied;
        break;
    }
    
    if (action === 'skip' && conditionMet) return false;
    if (action === 'end_sequence' && conditionMet) return false;
    
    return true;
  }

  /**
   * Get AB test variant for a subscriber
   */
  getABTestVariant(
    subscriberId: string,
    step: EmailSequenceStep
  ): 'A' | 'B' {
    if (!step.abTest?.enabled) return 'A';
    
    // Use subscriber ID hash to consistently assign variant
    const hash = subscriberId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const percentage = Math.abs(hash % 100);
    return percentage < step.abTest.splitPercentage ? 'A' : 'B';
  }

  /**
   * Generate sequence performance summary
   */
  getSequencePerformance(
    sequence: EmailSequence,
    subscribers: SequenceSubscriber[]
  ): {
    totalSubscribers: number;
    activeSubscribers: number;
    completedSubscribers: number;
    unsubscribed: number;
    bounced: number;
    stepPerformance: Array<{
      stepOrder: number;
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
      openRate: number;
      clickRate: number;
      replyRate: number;
    }>;
  } {
    const stepPerformance = sequence.steps.map(step => {
      const stepHistory = subscribers.flatMap(sub =>
        sub.stepHistory.filter(h => h.stepId === step.id)
      );
      
      const sent = stepHistory.length;
      const opened = stepHistory.filter(h => h.opened).length;
      const clicked = stepHistory.filter(h => h.clicked).length;
      const replied = stepHistory.filter(h => h.replied).length;
      
      return {
        stepOrder: step.order,
        sent,
        opened,
        clicked,
        replied,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      };
    });
    
    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: subscribers.filter(s => s.status === 'active').length,
      completedSubscribers: subscribers.filter(s => s.status === 'completed').length,
      unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
      bounced: subscribers.filter(s => s.status === 'bounced').length,
      stepPerformance,
    };
  }
}

export const sequenceBuilder = new SequenceBuilder();
