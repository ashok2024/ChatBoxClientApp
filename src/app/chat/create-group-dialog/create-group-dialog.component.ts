import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MaterialModule } from '../../material/material.module';
import { GroupService } from '../../Services/group.service';
@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatLabel, FormsModule, MatListModule, MaterialModule],
  templateUrl: './create-group-dialog.component.html',
})
export class CreateGroupDialogComponent {
  dialogRef = inject(MatDialogRef<CreateGroupDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { onlineUsers: any[], currentUserEmail: string };
  groupService = inject(GroupService);
  groupName = '';
  selectedUsers: any[] = [];
  selectedImage: File | null = null;
  onSelectionChange(event: any) {
    this.selectedUsers = event.source.selectedOptions.selected.map((opt: any) => opt.value);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onCreate() {
    debugger;
    const selectedEmails = this.selectedUsers.map(user => user.email);

    if (!selectedEmails.includes(this.data.currentUserEmail)) {
      selectedEmails.push(this.data.currentUserEmail);
    }

    const formData = new FormData();
    formData.append('groupName', this.groupName);
    formData.append('members', JSON.stringify(selectedEmails));

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }
    this.groupService.createGroup(formData).subscribe({
      next: (response) => {
        console.log('Group created:', response);
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Error creating group:', err);
      }
    });
    this.dialogRef.close({
      groupName: this.groupName,
      selectedUsers: this.selectedUsers
    });
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }
}

