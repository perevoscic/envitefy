function cleanPublicValue(value: string | undefined): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

export const legalEntityName = cleanPublicValue(process.env.LEGAL_ENTITY_NAME) || "Envitefy";
export const legalContactEmail = cleanPublicValue(process.env.LEGAL_CONTACT_EMAIL);
export const privacyContactEmail =
  cleanPublicValue(process.env.PRIVACY_CONTACT_EMAIL) || legalContactEmail;
export const dmcaContactEmail = cleanPublicValue(process.env.DMCA_CONTACT_EMAIL) || legalContactEmail;
export const legalPostalAddress = cleanPublicValue(process.env.LEGAL_POSTAL_ADDRESS);

export const legalConfig = {
  legalEntityName,
  legalContactEmail,
  privacyContactEmail,
  dmcaContactEmail,
  legalPostalAddress,
} as const;
