import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Message } from '../Models/message.model';
import { User } from '../Models/user.model';
import { AuthService } from '../Services/auth.service';
import { environment } from '../../environments/environment';
export interface GroupMessage {
  id?: number;
  senderEmail: string;
  senderDisplayName: string;
  text: string;
  sentAt: Date;
  groupId: number;
}
@Injectable({
  providedIn: 'root'
})

export class ChatService {
     private apiUrl = environment.apiBaseUrlHub;
  private hubConnection: signalR.HubConnection;
  private messageReceived = new Subject<Message>();

  private userConnected = new Subject<User>();
  private userDisconnected = new Subject<string>(); // Email of disconnected user
  private chatHistoryLoaded = new Subject<Message[]>();

  groupMessageReceived = new Subject<GroupMessage>();
  groupChatHistoryLoaded = new Subject<GroupMessage[]>();

  // private groupMessagesSubject = new Subject<any[]>();
  // groupMessages$ = this.groupMessagesSubject.asObservable();


  messageReceived$ = this.messageReceived.asObservable();
  userConnected$ = this.userConnected.asObservable();
  userDisconnected$ = this.userDisconnected.asObservable();
  chatHistoryLoaded$ = this.chatHistoryLoaded.asObservable();
  private connectionStarted = false;


  constructor(private authService: AuthService) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.apiUrl, {
        accessTokenFactory: () => this.authService.getToken() || ''
      })
      .withAutomaticReconnect()
      .build();

    this.startConnection();

    this.hubConnection.on('ReceiveGroupMessage', (messages: GroupMessage) => {
      this.groupMessageReceived.next(messages);
    });
    this.addChatEventListeners();
  }

  // private async startConnection(): Promise<void> {
  //   try {
  //     await this.hubConnection.start();
  //     console.log('SignalR Connection Started!');
  //   } catch (err) {
  //     console.error('Error while starting SignalR connection: ' + err);
  //     setTimeout(() => this.startConnection(), 5000); // Retry connection
  //   }
  // }

  // startConnection(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.hubConnection = new signalR.HubConnectionBuilder()
  //       .withUrl('http://localhost:5191/chatHub', {
  //         accessTokenFactory: () => this.authService.getToken() || ''
  //       })
  //       .withAutomaticReconnect()
  //       .build();
  //     this.hubConnection
  //       .start()
  //       .then(() => {
  //         console.log('SignalR Connected.');
  //         this.connectionStarted = true;
  //         this.addChatEventListeners();
  //         resolve();
  //       })
  //       .catch(err => {
  //         console.error('SignalR Connection Error:', err);
  //         reject(err);
  //       });
  //   });
  // }
  startConnection(): Promise<void> {
    if (this.connectionStarted) {
      return Promise.resolve();
    }

    return this.hubConnection.start()
      .then(() => {
        this.connectionStarted = true;
        console.log('SignalR Connected.');
      })
      .catch(err => {
        console.error('SignalR Connection Error:', err);
        throw err;
      });
  }

  isConnected(): boolean {
    return this.connectionStarted;
  }

  private addChatEventListeners(): void {
    debugger;
    this.hubConnection.on('ReceiveMessage', (senderEmail: string, senderDisplayName: string, text: string, sentAt: string, receiverEmail: string | null) => {
      this.messageReceived.next({

        senderEmail: senderEmail,
        senderDisplayName: senderDisplayName,
        text: text,
        sentAt: new Date(sentAt),
        receiverEmail: receiverEmail || undefined
      });
    });

    // this.hubConnection.on('ReceiveGroupMessage', (message: any) => {
    //   this.groupMessageReceived.next({
    //     ...message,
    //     sentAt: new Date(message.sentAt)
    //   });
    // });
    this.hubConnection.on('UserConnected', (userEmail: string, displayName: string) => {
      this.userConnected.next({ email: userEmail, displayName: displayName, isOnline: true, profileImageUrl: "" });
    });

    this.hubConnection.on('UserDisconnected', (userEmail: string) => {
      this.userDisconnected.next(userEmail);
    });

    this.hubConnection.on('LoadMessages', (messages: Message[]) => {
      // Map sentAt strings to Date objects
      debugger;
      const formattedMessages = messages.map(msg => ({
        
        ...msg,
        sentAt: new Date(msg.sentAt)
      }));
      this.chatHistoryLoaded.next(formattedMessages);
    });
    // this.hubConnection.on('LoadGroupMessages', (messages: any[]) => {
    //   const formattedGroupMessages = messages.map(msg => ({
    //     ...msg,
    //     sentAt: new Date(msg.sentAt)
    //   }));

    //   this.groupChatHistoryLoaded.next(formattedGroupMessages);
    // });
    this.hubConnection.on('ReceiveError', (error: string) => {
      console.error('SignalR Error:', error);
      // You can also show this error to the user via a snackbar
    });
  }

  // Method to send direct messages
  public sendDirectMessage(receiverEmail: string, message: string): Promise<void> {
    return this.hubConnection.invoke('SendDirectMessage', receiverEmail, message);
  }

  // Method to send public messages (if you keep public chat)
  public sendPublicMessage(message: string): Promise<void> {
    return this.hubConnection.invoke('SendMessage', message);
  }

  public getDirectMessagesHistory(otherUserEmail: string): Promise<void> {
    debugger;
    return this.hubConnection.invoke('GetDirectMessagesHistory', otherUserEmail);
  }

  public getPublicMessagesHistory(): Promise<void> {
    return this.hubConnection.invoke('GetPublicMessagesHistory');
  }

  public stopConnection(): Promise<void> {
    return this.hubConnection.stop();
  }
  sendGroupMessage(groupId: number, text: string): Promise<void> {
    return this.hubConnection.invoke('SendGroupMessage', groupId, text);
  }

  // Load group messages
  getGroupMessagesHistory(groupId: number): Promise<any[]> {
    return this.hubConnection.invoke<any[]>('GetGroupMessagesHistory', groupId);
  }
}