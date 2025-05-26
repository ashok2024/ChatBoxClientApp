import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GroupsMember } from '../Models/groups.model';
import { Message } from '../Models/message.model';

export interface Group {
  id: number;
  groupName: string;
  membersEmails: string[];
  createdAt: string;  // Use string for DateTime (ISO string format)
}
@Injectable({
  providedIn: 'root'
})


export class GroupService {
  private apiUrl = 'http://localhost:5191/api/Groups'; // Backend API URL

  constructor(private http: HttpClient) { }

  createGroup(formData: FormData) {
    return this.http.post<Group>(`${this.apiUrl}/create`, formData);
  }
  getGroupsByEmail(userEmail: string): Observable<GroupsMember[]> {
    return this.http.get<GroupsMember[]>(`${this.apiUrl}/groups`, {
      params: { userEmail }
    });

  }
  
}