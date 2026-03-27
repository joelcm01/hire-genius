export interface Contact {
  contactId: string;
  candidateId: string;
  vacancyId: string;
  contactMethod: 'Email' | 'WhatsApp' | 'Phone';
  contactDate: string;
  responsible: string;
  notes?: string;
  whatsappUrl?: string;
}

export interface SendWhatsAppDto {
  vacancyId: string;
  message?: string;
}

export interface SendEmailDto {
  vacancyId: string;
  subject?: string;
  body?: string;
}
