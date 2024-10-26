export interface CreateLinkDTO {
  originalURL: string;
  shortURL: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  expiresAt: string;
}
