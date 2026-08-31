import 'server-only';
import UserRepository from '../repositories/UserRepository';
import LeadRepository from '../repositories/LeadRepository';
import CampaignRepository from '../repositories/CampaignRepository';
import GmailAccountRepository from '../repositories/GmailAccountRepository';

export class SecurityService {
  /**
   * IDOR Protection Helper: Verifies user owns resource or is a Master/Admin
   */
  static async verifyResourceOwnership(
    userId: number,
    modelName: 'lead' | 'campaign' | 'gmailAccount' | 'template' | 'contact',
    resourceId: number
  ): Promise<boolean> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) return false;

      const roleStr = String(user.role).toUpperCase();
      if (roleStr === 'MASTER' || roleStr === 'ADMIN') return true;

      switch (modelName) {
        case 'lead': {
          const lead = await LeadRepository.findById(resourceId, userId);
          return !!lead;
        }
        case 'campaign': {
          const campaign = await CampaignRepository.findById(resourceId, userId);
          return !!campaign;
        }
        case 'gmailAccount': {
          const account = await GmailAccountRepository.findById(resourceId, userId);
          return !!account;
        }
        default:
          return true;
      }
    } catch {
      return false;
    }
  }
}

export default SecurityService;
