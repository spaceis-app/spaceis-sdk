/** Navigation link in the footer */
export interface NavLink {
  /** Link display text */
  label: string;
  /** Link URL */
  url: string;
}

/** Footer navigation section (up to 3 sections in footer) */
export interface NavSection {
  /** Whether this section is displayed */
  enabled: boolean;
  /** Section heading */
  title: string;
  /** Links in this section */
  links: NavLink[];
}

/** Footer configuration with description and navigation sections */
export interface FooterConfig {
  /** Footer description text (HTML), or `null` */
  description: string | null;
  /** First navigation column */
  nav_section_1?: NavSection | null;
  /** Second navigation column */
  nav_section_2?: NavSection | null;
  /** Third navigation column */
  nav_section_3?: NavSection | null;
}

/** Configuration for a toggleable shop section */
export interface SectionConfig {
  /** Whether this section is enabled/visible */
  is_active: boolean;
}

/** Feature sections that can be toggled on/off in the shop */
export interface SectionsConfig {
  /** Voucher redemption section */
  vouchers: SectionConfig | null;
  /** Daily reward section */
  daily_reward: SectionConfig | null;
}

/** SEO meta tags configuration */
export interface MetaConfig {
  /** Page title for `<title>` tag */
  title: string | null;
  /** Meta description */
  description: string | null;
  /** Meta keywords (comma-separated) */
  keywords: string | null;
}

/** Open Graph metadata for social sharing */
export interface OgConfig {
  /** OG title */
  title: string | null;
  /** OG description */
  description: string | null;
  /** OG canonical URL */
  url: string | null;
  /** OG image URL */
  image: string | null;
  /** OG type (e.g. `"website"`) */
  type: string | null;
}

/** Simple media file with a URL */
export interface SimpleMediaFile {
  /** File URL, or `null` if not set */
  url: string | null;
}

/**
 * Complete shop template configuration.
 *
 * Contains all customization settings: branding, layout, navigation,
 * footer, SEO, social links, and feature flags.
 */
export interface TemplateConfiguration {
  /** Shop display name */
  app_name: string | null;
  /** Shop description (HTML) */
  description: string | null;
  /** Favicon file */
  favicon: SimpleMediaFile | null;
  /** Logo file */
  logo: SimpleMediaFile | null;
  /** Footer configuration */
  footer: FooterConfig;
  /** Intro/hero section content (HTML), or `null` */
  intro: string | null;
  /** Toggleable shop sections */
  sections: SectionsConfig;
  /** SEO meta tags */
  meta: MetaConfig;
  /** Open Graph metadata */
  og: OgConfig;
  /** Feature flags (template-specific) */
  features?: Record<string, boolean>;
  /** Template identifier */
  template_id?: string;
  /** Social media links */
  social?: {
    twitter_handle?: string;
    facebook_url?: string;
    discord_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
  };
  /** Template-specific extra fields */
  [key: string]: unknown;
}
