export interface CreateLinkBody {
  originalUrl: string; // Required: URL to shorten
  shortCode?: string; // Optional: Custom short code
  comments?: string; // Optional: Comments
  type?: 'BENIGN' | 'MALICIOUS' | 'DEFACEMENT' | 'MALWARE' | 'PHISHING' | 'BLOCKED' | undefined; // Required: Link type,
  expiration?: {
    datetime?: Date; // Optional: Expiration datetime
    url?: string; // Optional: Expiration redirect URL
  };
  qrcode?: string; // Optional: QR code string
  tags?: string[]; // Optional: Array of tags
  utm?: {
    source?: string; // Optional: UTM source
    medium?: string; // Optional: UTM medium
    campaign?: string; // Optional: UTM campaign
    term?: string; // Optional: UTM term
    content?: string; // Optional: UTM content
    expiresAt?: Date; // Optional: UTM expires at
  } | null; // Allow null for optional fields
}
