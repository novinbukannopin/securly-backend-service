export interface TokenResponse {
  token: string;
  expires: Date;
}

export interface AuthTokensResponse {
  access: TokenResponse;
  refresh?: TokenResponse;
}

export interface successResponse {
  code: number;
  message: string;
  data?: any;
}

import { UAParserInstance } from 'ua-parser-js';

export interface AnalyticsData {
  ipDetails: {
    ip: string;
    loc: string;
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    org?: string;
    postal?: string;
  } | null;
  userAgentData: UAParserInstance;
}
