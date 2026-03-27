import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Contact, SendWhatsAppDto, SendEmailDto } from '../models/contact.model';

export interface ContactsResponse {
  contacts: Contact[];
}

export interface WhatsAppResponse {
  whatsappUrl: string;
  contact: Contact;
}

@Injectable({ providedIn: 'root' })
export class ContactsService extends ApiService {

  getContactHistory(candidateId: string): Observable<ContactsResponse> {
    return this.get<ContactsResponse>(`/candidates/${candidateId}/contacts`);
  }

  sendWhatsApp(candidateId: string, data: SendWhatsAppDto): Observable<WhatsAppResponse> {
    return this.post<WhatsAppResponse>(`/candidates/${candidateId}/whatsapp`, data);
  }

  sendEmail(candidateId: string, data: SendEmailDto): Observable<Contact> {
    return this.post<Contact>(`/candidates/${candidateId}/email`, data);
  }
}
