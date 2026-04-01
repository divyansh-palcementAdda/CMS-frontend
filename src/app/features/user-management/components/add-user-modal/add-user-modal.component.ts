import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { CreateUserDTO, BulkUserUploadResponse } from '../../../../core/models/user.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.scss']
})
export class AddUserModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  activeTab: 'single' | 'bulk' = 'single';
  userForm: FormGroup;
  isSubmitting = false;
  roles: any[] = [];
  
  // New UI states
  passwordVisible = false;
  showOtpModal = false;
  otpCode = '';
  otpError = '';
  isVerifyingOtp = false;
  backendErrors: { [key: string]: string } = {};

  // OTP Cooldown
  isOtpSending = false;
  otpCooldown = 0;
  private cooldownInterval: any;
  
  // Bulk Upload states
  selectedFile: File | null = null;
  isDragging = false;
  uploadProgress = 0;
  isUploading = false;
  bulkUploadResult: BulkUserUploadResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(80),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/)
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.maxLength(64)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.maxLength(200)
      ]],
      fullName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        Validators.pattern(/^[a-zA-Z ]+$/)
      ]],
      mobile: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      roles: [[], [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles.map(r => ({
          name: r.name,
          displayName: r.name.replace('ROLE_', '').replace(/_/g, ' ')
        }));
      },
      error: (err) => console.error('Error loading roles', err)
    });
  }

  setTab(tab: 'single' | 'bulk'): void {
    this.activeTab = tab;
    this.bulkUploadResult = null;
    this.showOtpModal = false;
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onRoleChange(roleName: string, event: any): void {
    const selectedRoles = this.userForm.get('roles')?.value as string[];
    if (event.target.checked) {
      if (!selectedRoles.includes(roleName)) {
        this.userForm.patchValue({ roles: [...selectedRoles, roleName] });
      }
    } else {
      this.userForm.patchValue({ roles: selectedRoles.filter(r => r !== roleName) });
    }
  }

  isRoleSelected(roleName: string): boolean {
    return (this.userForm.get('roles')?.value as string[])?.includes(roleName) || false;
  }

  sendOtp(): void {
    const email = this.userForm.get('email')?.value;
    if (!email || this.userForm.get('email')?.invalid) {
      this.userForm.get('email')?.markAsTouched();
      return;
    }

    this.isOtpSending = true;
    this.userService.sendOtp(email).subscribe({
      next: () => {
        this.isOtpSending = false;
        this.startCooldown();
        alert('OTP sent to your email!');
      },
      error: (err) => {
        this.isOtpSending = false;
        alert(err.error?.message || 'Failed to send OTP');
      }
    });
  }

  private startCooldown(): void {
    this.otpCooldown = 60;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.otpCooldown--;
      if (this.otpCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  onSubmit(): void {
    this.backendErrors = {};
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    
    // Open OTP Verification Modal
    this.showOtpModal = true;
    this.otpError = '';
    this.otpCode = '';
  }

  confirmCreateUser(): void {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.otpError = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.isVerifyingOtp = true;
    this.otpError = '';

    const dto: CreateUserDTO = {
      ...this.userForm.value,
      otp: this.otpCode
    };

    this.userService.createUser(dto)
      .pipe(finalize(() => this.isVerifyingOtp = false))
      .subscribe({
        next: () => {
          this.showOtpModal = false;
          this.success.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Error creating user', err);
          if (err.status === 400 && err.error?.errors) {
            this.backendErrors = err.error.errors;
            this.showOtpModal = false; // Close OTP modal to show field errors
          } else {
            this.otpError = err.error?.message || 'Verification failed. Please try again.';
          }
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

  // Bulk Upload Methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  validateAndSetFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      this.selectedFile = file;
      this.bulkUploadResult = null;
    } else {
      alert('Please select only Excel files (.xlsx or .xls)');
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.userService.bulkUpload(this.selectedFile)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (result) => {
          this.bulkUploadResult = result;
          if (result.successCount > 0) {
            this.success.emit();
          }
        },
        error: (err) => {
          console.error('Upload failed', err);
          alert(err.error?.message || 'Bulk upload failed');
        }
      });
  }

  downloadTemplate(): void {
    this.userService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_upload_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Template download failed', err)
    });
  }
}
