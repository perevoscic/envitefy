export const ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY = "envitefy:admin:email-campaign:draft";

export type AdminEmailCampaignDraft = {
  subject: string;
  bodyHtml: string;
  buttonText?: string;
  buttonUrl?: string;
};
