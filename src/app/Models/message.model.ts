export interface Message {
   senderEmail: string;
  senderDisplayName: string;
  text: string;
  sentAt: Date;
  receiverEmail?: string; // Optional: receiver's email for direct messages
}