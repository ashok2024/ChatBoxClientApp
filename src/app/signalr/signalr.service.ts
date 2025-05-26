import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Message } from '../Models/message.model';
import { AuthService } from '../Services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: HubConnection;
  public messages$ = new BehaviorSubject<Message[]>([]);
  private isConnected: boolean = false;

  constructor(private auth: AuthService) { }

  async startConnection() {
    debugger;
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5191/chatHub', {
        accessTokenFactory: () => this.auth.token!
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveMessage', (user: string, text: string) => {
      const msg: Message = { sender: user, text, sentAt: new Date().toISOString() };
      this.messages$.next([...this.messages$.value, msg]);
    });

    try {
      await this.hubConnection.start();
      this.isConnected = true;
      console.log("SignalR connected.");
    } catch (err) {
      console.error("SignalR connection failed:", err);
    }
  }

  async sendMessage(text: string) {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.warn("SignalR connection not established.");
      return;
    }

    const decoded: any = jwtDecode(this.auth.token!);
    const user = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

    if (!user) {
      console.warn("User claim not found in token.");
      return;
    }
    try {
      await this.hubConnection.invoke('SendMessage', user, text);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }
   get currentUser(): string | null {
    if (!this.auth.token) return null;
    try {
      const decoded: any = jwtDecode(this.auth.token);
      return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || null;
    } catch {
      return null;
    }
  }
}
