/**
 * PII Redaction Utility
 * 
 * Redacts personally identifiable information (PII) from text before sending to AI.
 * Protects: SSN, SIN, emails, phones, names, addresses, account numbers
 */

// Types
export interface RedactionMapping {
  [key: string]: string;
}

export interface RedactionResult {
  redactedText: string;
  mapping: RedactionMapping;
  detectedPII: {
    ssn: number;
    sin: number;
    email: number;
    phone: number;
    name: number;
    address: number;
    account: number;
  };
}

/**
 * Main redaction function
 * Redacts all PII from text and returns mapping for potential restoration
 */
export function redactPII(
  text: string,
  knownNames: string[] = [],
  knownAddresses: string[] = []
): RedactionResult {
  let redactedText = text;
  const mapping: RedactionMapping = {};
  const detectedPII = {
    ssn: 0,
    sin: 0,
    email: 0,
    phone: 0,
    name: 0,
    address: 0,
    account: 0
  };

  // 1. Redact US SSN (XXX-XX-XXXX or XXXXXXXXX)
  const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
  const ssns = text.match(ssnPattern) || [];
  ssns.forEach((ssn, index) => {
    const placeholder = `[SSN_${index + 1}]`;
    mapping[placeholder] = ssn;
    redactedText = redactedText.replace(ssn, placeholder);
    detectedPII.ssn++;
  });

  // 2. Redact Canadian SIN (XXX-XXX-XXX or XXX XXX XXX)
  const sinPattern = /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g;
  const sins = text.match(sinPattern) || [];
  sins.forEach((sin, index) => {
    const placeholder = `[SIN_${index + 1}]`;
    mapping[placeholder] = sin;
    redactedText = redactedText.replace(sin, placeholder);
    detectedPII.sin++;
  });

  // 3. Redact email addresses
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailPattern) || [];
  emails.forEach((email, index) => {
    const placeholder = `[EMAIL_${index + 1}]`;
    mapping[placeholder] = email;
    redactedText = redactedText.replace(email, placeholder);
    detectedPII.email++;
  });

  // 4. Redact phone numbers (various formats)
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 416-555-1234
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,     // (416) 555-1234
    /\b1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g // 1-416-555-1234
  ];
  
  phonePatterns.forEach(pattern => {
    const phones = text.match(pattern) || [];
    phones.forEach((phone, index) => {
      const placeholder = `[PHONE_${detectedPII.phone + index + 1}]`;
      mapping[placeholder] = phone;
      redactedText = redactedText.replace(phone, placeholder);
    });
    detectedPII.phone += phones.length;
  });

  // 5. Redact known borrower names
  knownNames.forEach((name, index) => {
    if (name && name.trim()) {
      const placeholder = `[BORROWER_${index + 1}]`;
      mapping[placeholder] = name;
      // Case-insensitive replacement
      const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      redactedText = redactedText.replace(regex, placeholder);
      detectedPII.name++;
    }
  });

  // 6. Redact known addresses
  knownAddresses.forEach((address, index) => {
    if (address && address.trim()) {
      const placeholder = `[ADDRESS_${index + 1}]`;
      mapping[placeholder] = address;
      // Case-insensitive replacement
      const regex = new RegExp(address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      redactedText = redactedText.replace(regex, placeholder);
      detectedPII.address++;
    }
  });

  // 7. Redact common street address patterns (fallback)
  const addressPattern = /\b\d+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way)\b/gi;
  const addresses = text.match(addressPattern) || [];
  addresses.forEach((address, index) => {
    const placeholder = `[ADDRESS_${knownAddresses.length + index + 1}]`;
    if (!Object.values(mapping).includes(address)) {
      mapping[placeholder] = address;
      redactedText = redactedText.replace(address, placeholder);
      detectedPII.address++;
    }
  });

  // 8. Redact account numbers (various patterns)
  const accountPattern = /\b(?:Account|Acct|A\/C)[\s#:]*\d{4,}\b/gi;
  const accounts = text.match(accountPattern) || [];
  accounts.forEach((account, index) => {
    const placeholder = `[ACCOUNT_${index + 1}]`;
    mapping[placeholder] = account;
    redactedText = redactedText.replace(account, placeholder);
    detectedPII.account++;
  });

  return {
    redactedText,
    mapping,
    detectedPII
  };
}

/**
 * Restore PII from redacted text (use sparingly and with caution)
 */
export function restorePII(redactedText: string, mapping: RedactionMapping): string {
  let restoredText = redactedText;
  
  Object.entries(mapping).forEach(([placeholder, original]) => {
    restoredText = restoredText.replace(new RegExp(placeholder, 'g'), original);
  });
  
  return restoredText;
}

/**
 * Get human-readable summary of PII detected
 */
export function getPIISummary(result: RedactionResult): string {
  const items: string[] = [];
  
  if (result.detectedPII.ssn > 0) items.push(`${result.detectedPII.ssn} SSN`);
  if (result.detectedPII.sin > 0) items.push(`${result.detectedPII.sin} SIN`);
  if (result.detectedPII.email > 0) items.push(`${result.detectedPII.email} email${result.detectedPII.email > 1 ? 's' : ''}`);
  if (result.detectedPII.phone > 0) items.push(`${result.detectedPII.phone} phone${result.detectedPII.phone > 1 ? 's' : ''}`);
  if (result.detectedPII.name > 0) items.push(`${result.detectedPII.name} name${result.detectedPII.name > 1 ? 's' : ''}`);
  if (result.detectedPII.address > 0) items.push(`${result.detectedPII.address} address${result.detectedPII.address > 1 ? 'es' : ''}`);
  if (result.detectedPII.account > 0) items.push(`${result.detectedPII.account} account${result.detectedPII.account > 1 ? 's' : ''}`);
  
  if (items.length === 0) return 'No PII detected';
  
  return `Detected and redacted: ${items.join(', ')}`;
}

/**
 * Validate that redaction was successful
 */
export function validateRedaction(text: string): { isClean: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check for common PII patterns that might have been missed
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
    warnings.push('Potential SSN found');
  }
  
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
    warnings.push('Potential email address found');
  }
  
  if (/\(\d{3}\)\s?\d{3}-\d{4}/.test(text)) {
    warnings.push('Potential phone number found');
  }
  
  return {
    isClean: warnings.length === 0,
    warnings
  };
}
