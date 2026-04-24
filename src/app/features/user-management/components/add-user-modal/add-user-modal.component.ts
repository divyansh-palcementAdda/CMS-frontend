import { Component, EventEmitter, Output, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { CreateUserDTO, BulkUserUploadResponse } from '../../../../core/models/user.model';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

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

  @Input() userId: number | null = null;
  @Input() userToEdit: any | null = null;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);

  userForm: FormGroup;
  isSubmitting = false;
  roles: any[] = [];
  originalEmail: string = '';
  isEmailChanged = false;
  
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
  

  constructor() {
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
    console.log('AddUserModal initialized. UserId:', this.userId, 'UserToEdit:', this.userToEdit);
    this.loadRoles();
    
    if (this.userToEdit) {
      this.userId = this.userToEdit.id;
      this.patchFormData(this.userToEdit);
    } else if (this.userId) {
      this.loadUserData(this.userId);
    }

    // Monitor email changes
    this.userForm.get('email')?.valueChanges.subscribe(value => {
      if (this.userId) {
        this.isEmailChanged = value !== this.originalEmail;
      }
    });
  }

  patchFormData(user: any): void {
    console.log('Patching form with data:', user);
    this.originalEmail = user.email;
    // Map roles objects to raw names for checkbox matching
    const roleNames = user.roles?.map((r: any) => r.rawName || r.name) || [];
    
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      mobile: user.mobile,
      roles: roleNames
    });

    // Make password optional for edit mode
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    // Ensure form state is updated
    this.userForm.markAsPristine();
  }

  loadUserData(id: number): void {
    console.log('Fetching data for user:', id);
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.patchFormData(user);
      },
      error: (err) => console.error('Error loading user data', err)
    });
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
        this.toastr.success('OTP sent to your email!', 'OTP Sent');
      },
      error: (err) => {
        this.isOtpSending = false;
        this.toastr.error(err.error?.message || 'Failed to send OTP', 'Error');
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
      this.toastr.warning('Please fill all required fields correctly', 'Form Invalid');
      return;
    }
    
    // Check if we need OTP:
    // 1. New user registration
    // 2. Existing user changing their email
    const needsOtp = !this.userId || this.isEmailChanged;

    if (needsOtp) {
      this.showOtpModal = true;
      this.otpError = '';
      this.otpCode = '';
    } else {
      this.confirmUpdateUser();
    }
  }

  confirmUpdateUser(otp?: string): void {
    this.isSubmitting = true;
    const updateData = { ...this.userForm.value };
    if (otp) updateData.otp = otp;

    this.userService.updateUser(this.userId!, updateData)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.toastr.success('User updated successfully', 'Success');
          this.showOtpModal = false;
          this.success.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Error updating user', err);
          if (err.error?.errors) {
            this.backendErrors = err.error.errors;
            this.showOtpModal = false;
            this.toastr.error('Validation failed', 'Error');
          } else {
            this.toastr.error(err.error?.detail || err.error?.message || 'Update failed', 'Error');
            this.otpError = err.error?.message || 'Update failed';
          }
        }
      });
  }

  confirmCreateUser(): void {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.otpError = 'Please enter a valid 6-digit OTP';
      return;
    }

    if (this.userId && this.isEmailChanged) {
      this.confirmUpdateUser(this.otpCode);
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
          this.toastr.success('User created successfully', 'Success');
          this.showOtpModal = false;
          this.success.emit();
          this.onClose();
        },
        error: (err) => {
          console.error('Error creating user', err);
          if (err.error?.errors) {
            this.backendErrors = err.error.errors;
            this.showOtpModal = false;
            this.toastr.error('Validation failed', 'Error');
          } else {
            this.toastr.error(err.error?.detail || err.error?.message || 'Creation failed', 'Error');
            this.otpError = err.error?.message || 'Verification failed. Please try again.';
          }
        }
      });
  }

  onClose(): void {
    this.close.emit();
  }

}
