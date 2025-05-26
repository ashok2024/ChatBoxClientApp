import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Message } from '../../Models/message.model';
import { User } from '../../Models/user.model';
import { ChatService, GroupMessage } from '../../Services/chat.service';
import { UserService } from '../../Services/user.service';
import { AuthService } from '../../Services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { Console, debug } from 'console';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateGroupDialogComponent } from '../create-group-dialog/create-group-dialog.component'
import { GroupService } from '../../Services/group.service';
import { GroupsMember } from '../../Models/groups.model';
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatDialogModule],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageList') messageList!: ElementRef;

  messages: Message[] = [];
  newMsg: string = '';
  currentUserEmail: string | null = null;
  currentUserDisplayName: string | null = null;
  onlineUsers: User[] = [];
  selectedUser: User | null = null;
  selectedGroupMember: GroupsMember | null = null;
  private subscriptions: Subscription[] = [];
  private shouldScroll: boolean = false;
  groups: any[] = [];
  groupMessages: GroupMessage[] = [];
  groupImageProfile = "http://localhost:5191/uploads/Sample_User_Icon.png";

  private groupMessagesSubscription: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private groupService: GroupService
  ) {
    debugger;
    this.currentUserEmail = this.authService.getCurrentUserEmail();
    this.currentUserDisplayName = this.authService.getCurrentUserDisplayName();
  }

  ngOnInit(): void {
    // Subscribe to SignalR events via ChatService
    this.loadGroups();
    this.subscriptions.push(

      this.chatService.groupMessageReceived.subscribe(message => {
        debugger;

        if (Array.isArray(message)) {
          // This is probably from a batch like groupChatHistoryLoaded – handle as array
          if (this.selectedGroupMember) {
            const relevantMessages = message.filter(m => m.groupId === this.selectedGroupMember?.id);
            this.groupMessages = [...this.groupMessages, ...relevantMessages];
            if (relevantMessages.length > 0) {
              this.shouldScroll = true;
            }
          }
        } else {
          // This is a single real-time message
          if (this.selectedGroupMember && message.groupId === this.selectedGroupMember.id) {
            this.groupMessages = [...this.groupMessages, message];
            this.shouldScroll = true;
          }
        }
      }),

      this.chatService.groupChatHistoryLoaded.subscribe(messages => {
        if (this.selectedGroupMember) {
          this.groupMessages = messages.filter(m => m.id === this.selectedGroupMember?.id);
          this.shouldScroll = true;
        }
      }),            
      this.chatService.messageReceived$.subscribe(message => {
        debugger;
        // Filter messages to show only relevant ones based on selected chat
        const isMyMessage = message.senderEmail === this.currentUserEmail;
        const isSelectedUserDM = this.selectedUser &&
          ((isMyMessage && message.receiverEmail === this.selectedUser.email) ||
            (!isMyMessage && message.senderEmail === this.selectedUser.email && message.receiverEmail === this.currentUserEmail));
        const isPublicMessage = message.receiverEmail === null;

        if ((isPublicMessage && !this.selectedUser) || isSelectedUserDM) {
          this.messages.push(message);
          this.shouldScroll = true; // Mark for scrolling after view checked
        }
      }),
      this.chatService.userConnected$.subscribe(user => {
        if (user.email !== this.currentUserEmail && !this.onlineUsers.some(u => u.email === user.email)) {
          this.onlineUsers.push(user);
          this.onlineUsers.sort((a, b) => a.displayName.localeCompare(b.displayName));
          this.snackBar.open(`${user.displayName} is online!`, 'Dismiss', { duration: 2000 });
        }
        // Update status for already displayed users
        const existingUser = this.onlineUsers.find(u => u.email === user.email);
        if (existingUser) existingUser.isOnline = true;
        if (this.selectedUser?.email === user.email) this.selectedUser.isOnline = true;
      }),
      this.chatService.userDisconnected$.subscribe(userEmail => {
        this.onlineUsers = this.onlineUsers.filter(u => u.email !== userEmail);
        this.snackBar.open(`${userEmail} went offline.`, 'Dismiss', { duration: 2000 });
        // Update status for already displayed users
        const existingUser = this.onlineUsers.find(u => u.email === userEmail);
        if (existingUser) existingUser.isOnline = false;
        if (this.selectedUser?.email === userEmail) this.selectedUser.isOnline = false;
      }),
      this.chatService.chatHistoryLoaded$.subscribe(loadedMessages => {

        this.messages = loadedMessages;
        console.log(this.messages);
        this.shouldScroll = true; // Mark for scrolling after view checked
      })
    );
    
    this.authService.loginSuccess$.subscribe(() => {
      this.chatService.startConnection().then(() => {
        console.log('SignalR connection started after login.');
      });
    });

    this.subscriptions.push(
      
      // this.chatService.messageReceived$.subscribe(message => {
      //   debugger;
      //   // Filter messages to show only relevant ones based on selected chat
      //   const isMyMessage = message.senderEmail === this.currentUserEmail;
      //   const isSelectedUserDM = this.selectedUser &&
      //     ((isMyMessage && message.receiverEmail === this.selectedUser.email) ||
      //       (!isMyMessage && message.senderEmail === this.selectedUser.email && message.receiverEmail === this.currentUserEmail));
      //   const isPublicMessage = message.receiverEmail === null;

      //   if ((isPublicMessage && !this.selectedUser) || isSelectedUserDM) {
      //     this.messages.push(message);
      //     this.shouldScroll = true; // Mark for scrolling after view checked
      //   }
      // }),
      // this.chatService.userConnected$.subscribe(user => {
      //   if (user.email !== this.currentUserEmail && !this.onlineUsers.some(u => u.email === user.email)) {
      //     this.onlineUsers.push(user);
      //     this.onlineUsers.sort((a, b) => a.displayName.localeCompare(b.displayName));
      //     this.snackBar.open(`${user.displayName} is online!`, 'Dismiss', { duration: 2000 });
      //   }
      //   // Update status for already displayed users
      //   const existingUser = this.onlineUsers.find(u => u.email === user.email);
      //   if (existingUser) existingUser.isOnline = true;
      //   if (this.selectedUser?.email === user.email) this.selectedUser.isOnline = true;
      // }),
      // this.chatService.userDisconnected$.subscribe(userEmail => {
      //   this.onlineUsers = this.onlineUsers.filter(u => u.email !== userEmail);
      //   this.snackBar.open(`${userEmail} went offline.`, 'Dismiss', { duration: 2000 });
      //   // Update status for already displayed users
      //   const existingUser = this.onlineUsers.find(u => u.email === userEmail);
      //   if (existingUser) existingUser.isOnline = false;
      //   if (this.selectedUser?.email === userEmail) this.selectedUser.isOnline = false;
      // }),
      // this.chatService.chatHistoryLoaded$.subscribe(loadedMessages => {

      //   this.messages = loadedMessages;
      //   console.log(this.messages);
      //   this.shouldScroll = true; // Mark for scrolling after view checked
      // })

    );

    this.loadUsers();
    this.selectPublicChat(); // Start with public chat selected
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.stopConnection();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        debugger;
        // Filter out current user from the list
        this.onlineUsers = users.filter(u => u.email !== this.currentUserEmail);
        this.onlineUsers.sort((a, b) => a.displayName.localeCompare(b.displayName));
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Failed to load users.', 'Close', { duration: 3000 });
      }
    });
  }
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/test.png';
  }
  selectUser(user: User): void {
    debugger;
    this.selectedGroupMember = null;
    if (this.selectedUser?.email === user.email) return; // Already selected
    debugger;
    this.selectedUser = user;
    this.messages = []; // Clear current messages
    this.chatService.getDirectMessagesHistory(user.email)
      .catch(err => console.error('Error loading direct messages history:', err));
  }

  selectPublicChat(): void {
    if (this.selectedUser === null) return; // Already in public chat

    this.selectedUser = null; // Deselect user for public chat
    this.messages = []; // Clear current messages
    this.chatService.getPublicMessagesHistory()
      .catch(err => console.error('Error loading public messages history:', err));
  }

  send(): void {
    if (this.newMsg.trim()) {
      debugger;
      if (!this.chatService.isConnected()) {
        this.snackBar.open('Chat not connected yet. Please wait...', 'Dismiss', { duration: 3000 });
        return;
      }
      if (this.selectedUser) {
        this.chatService.sendDirectMessage(this.selectedUser.email, this.newMsg)
          .then(() => {
            this.newMsg = '';
            this.shouldScroll = true;
          })
          .catch(err => {
            console.error('Error sending direct message:', err);
            this.snackBar.open('Failed to send message.', 'Close', { duration: 3000 });
          });
      }
      else if (this.selectedGroupMember) {
        this.chatService.sendGroupMessage(this.selectedGroupMember.id, this.newMsg)
          .then(() => {
            this.newMsg = '';
            this.shouldScroll = true;
          })
          .catch(err => {
            console.error('Error sending group message:', err);
            this.snackBar.open('Failed to send group message.', 'Close', { duration: 3000 });
          });

      }
      else {
        // Send to public chat
        this.chatService.sendPublicMessage(this.newMsg)
          .then(() => {
            this.newMsg = '';
            this.shouldScroll = true;
          })
          .catch(err => {
            console.error('Error sending public message:', err);
            this.snackBar.open('Failed to send public message.', 'Close', { duration: 3000 });
          });
      }
    }
  }

  scrollToBottom(): void {
    try {

      this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  logout(): void {
    this.authService.logout();
  }
  isMyMessage(sender: string): boolean {
    return sender?.trim().toLowerCase() === this.currentUserEmail?.trim().toLowerCase();
  }

  openCreateGroupDialog() {
    console.log('Opening dialog with:', this.onlineUsers, this.currentUserEmail);
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '400px',
      data: {
        onlineUsers: this.onlineUsers, // your online user array here
        currentUserEmail: this.currentUserEmail // your current user email
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Group created:', result);
        // your code to handle group creation
      }
    });
  }

  loadGroups() {
    debugger;
    const email = this.currentUserEmail; // Ensure this is set during login
    if (!email) {
      console.error("Current user email is not available.");
      return;
    }
    this.groupService.getGroupsByEmail(email).subscribe({
      next: (res) => {
        debugger;
        this.groups = res;
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
      }
    });
  }
  selectGroup(group: GroupsMember) {
    this.selectedUser = null;
    debugger;
    this.selectedGroupMember = {
      id: group.id,
      groupName: group.groupName,
      membersEmails: group.membersEmails,
      createdAt: group.createdAt,
      imagePath: group.imagePath
    };

    this.loadGroupMessages(group.id);
  }
  loadGroupMessages(groupId: number) {

    this.messages = [];
    this.groupMessages = [];

    this.chatService.getGroupMessagesHistory(groupId); // just invokes the server call

    //Subscribe once to the observable (best done in ngOnInit for efficiency)
    // if (!this.groupMessagesSubscription) {
    //   this.groupMessagesSubscription = this.chatService.groupMessageReceived.subscribe(msgs => {
    //     this.groupMessages.push(msgs);
    //   });
    // }
  }

}