export const ADMIN_EMAIL_CAMPAIGN_DRAFT_KEY = "envitefy:admin:email-campaign:draft";

export type AdminEmailCampaignAudienceMode = "individual" | "broadcast";

export type AdminEmailCampaignDraft = {
  subject: string;
  bodyHtml: string;
  preheader?: string;
  buttonText?: string;
  buttonUrl?: string;
  /** AI generator audience; maps to campaign Individual vs All users. */
  audienceMode?: AdminEmailCampaignAudienceMode;
};
