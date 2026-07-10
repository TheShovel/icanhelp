# Email Marketing & Newsletters

## Platform Options
- **Mailchimp**: most popular for beginners. Free tier (500 contacts, 1,000 sends/month). Templates, automation, landing pages. Paid: $13-299/month. Good for: small businesses, basic email marketing
- **ConvertKit**: creator-focused (bloggers, authors, course creators). Simple UI, automations, tags, subscriber scoring. $39-159/month. Best for: building subscriber relationships, not blasts
- **MailerLite**: affordable, user-friendly. $10-90/month. 1,000 subscribers free (12,000 emails/mo). Good for: small/medium businesses on budget. Limited advanced features vs ConvertKit
- **Klaviyo**: e-commerce focused, deep integrations with Shopify/Magento/Woo. Powerful segmentation + automation (abandoned cart flows). Free up to 250 contacts (10,000 sends/month). Paid: $45+ — used by DTC brands. Best for: e-commerce product emails
- **SendGrid (Twilio)**: transactional email (API), high volume, developer-focused. Free 100 emails/day forever. Paid: $19.95/month for 50k. ESP: good for marketing also, but not as user-friendly as Mailchimp
- **Substack**: newsletter platform — built-in paid subscriptions. Takes 10% of subscription revenue. Good for: writers, independent journalists, analysts. Less control over subscriber data

## Deliverability
- **Authentication**: SPF (Sender Policy Framework — DNS record: which servers can send email for your domain). DKIM (DomainKeys Identified Mail — digital signature verifying email not tampered). DMARC (Domain-based Message Authentication — what to do if SPF/DKIM fail: quarantine, reject, none/monitor). DMARC policy: p=none (monitor), p=quarantine, p=reject (protect domain). DMARC reports: receive XML feedback on authentication results. Set up all three before sending campaigns
- **Warm-up**: sending domain reputation starts cold. Gradually increase volume over 2-4 weeks. Start: 50-100 emails/day, increase 20% daily. Avoid: sudden large sends (spike) → spam filters flag. Use dedicated IP (instead of shared, for consistent reputation). Dedicated IP vs shared IP: shared reputation affected by others; dedicated = you control it, higher volume needed long-term
- **Bounces**: hard (invalid address, remove immediately — 5%+ bounce rate = spam flag). Soft (temporary — mailbox full, try again up to 3x then remove if persistent). Spam complaints: keep <0.1% (Google/Yahoo threshold: <0.3% for deliverability). Complaint rate = recipients who mark as spam / total delivered
  - Unsubscribe rate: 0.2-0.5% typical per send. Above 1%: review content/frequency/segmentation
- **List health**: remove unengaged subscribers (no opens in 3-6 months). Re-engagement campaign (win-back email, if no response, suppress). Keep list clean — quality > quantity. Cleanup every 6 months
- **Content factors**: spam trigger words (FREE, ACT NOW, CLICK HERE, limited time, 100% — not as impactful as they used to be, but use caution). Text-to-image ratio: more text than images (images alone = likely spam). Links: reputable domains, not URL shorteners. DKIM/SPF alignment: domain matches From/Reply-to

## Design & Content
- **Subject line**: 30-50 characters. Personalization (first name, location). Urgency/scarcity (effective if genuine). Curiosity gap. Avoid: ALL CAPS, excessive punctuation, spam words. Emoji in subject: test with audience
  - Preview text (preheader): second most visible line after subject — use it! 85-130 characters. Best practices: summarize content, complement subject, call to action, extend subject with key info
- **Email body**: preheader text (hidden in HTML, shows after subject in inbox) — use it (will also show on open). Salutation with first name. Single column layout (mobile-friendly). 500-5000 characters. CTA button (visible above fold, contrasting color, actionable text: "Get 50% Off", "Read Article →"). High-quality images (max 600px wide). Alt text on all images (describe what they show, also helps accessibility)
  - Footer: physical mailing address (required by CAN-SPAM). Unsubscribe link (must be ONE-click, no login required). Preference center (choose frequency, topics). Plain text version (some email clients display only text)
- **Mobile optimization**: 55-70% of emails opened on mobile. Font: 14px min for body, 22px for heading. Button: 44x44px min tap target. Padding: 10-20px
- **Best practices**: send from a real person (name@company.com, not no-reply@). Use segmentation (targeted = higher open rates). A/B test subject lines, CTAs, send times, content. Send consistently (weekly = 2-4x/month). Welcome sequence for new subscribers (3-5 emails over first 2 weeks)
  - Spacing: build with tables, not divs (most email clients ignore CSS). Use inline CSS styles (not <style> tag or external) for broadest compatibility. Dark mode: use `@media (prefers-color-scheme: dark)`

## Metrics
- **Open rate**: 20-40% average (varies by industry, list quality, subject line). Education/health: higher. E-commerce/retail: lower. Industry average benchmark tool: Mailchimp has benchmark reports. Calculate: unique opens ÷ delivered. Track over time
- **Click-through rate (CTR)**: 2-5% average. Click-to-open rate (CTOR): clicks ÷ opens — measures content effectiveness (independent of subject line). Conversion rate: from email click to signup/purchase
- **Unsubscribe rate**: <0.5% per campaign. If >1%: review list source (did they opt in?) + content + frequency
- **List growth**: net new subscribers per month. Aim: 1-3% growth rate. Organic growth (website signup form, content upgrade, lead magnet) yields most engaged subscribers. Avoid purchased lists (illegal in many countries + poor engagement + high spam complaints + spikes of unsubscribes/quarantine)
- **Revenue attribution**: UTM parameters on links (email, campaign, content) — then track in Google Analytics/your analytics. Value per email opened/ subscriber. Email ROI: $36 per $1 spent according to multiple industry reports (big ROI for many)

## Legal Compliance
- **CAN-SPAM** (US): must include physical address, clear opt-out method, honor opt-out within 10 days, subject line not deceptive, identify as advertisement (not strongly required for commercial). Max $46,517 per violation
- **GDPR** (EU): explicit consent (opt-in, not pre-checked). Right to access + erasure (delete data). Data processing agreement with email provider. Cookie consent + privacy policy for signup forms. Must identify as marketing communication
- **CASL** (Canada): express consent for commercial electronic messages. Implied consent from existing business relationship lasts 2 years. Must include unsubscribe + sender ID. Clear identification of sender. Stricter than CAN-SPAM

## Automation Flows
- **Welcome series**: immediate after signup → day 2 → day 5 → day 10 → day 30. First email: deliver lead magnet (free PDF/course). Increase engagement. Re-engagement: "We miss you" after 3 months of no opens
- **Abandoned cart**: e-commerce, 1 hr after leaving checkout → 24 hr → 48 hr → 4-6 days later. Flag: include product reminder, social proof ("5 other people recently bought this"). Offer discount (10-15%) in second email
- **Post-purchase**: thank you (immediate) → upsell (3-5 days later) → review request (7 days) → repeat purchase (30 days)
- **Birthday**: automated yearly, send coupon or freebie. Segment members by birthday month for more efficient sending
- **Re-engagement/win-back**: 3-6 months of no opens. Offer incentive. If no response: suppress from list (remove subscription) — better for sender reputation
