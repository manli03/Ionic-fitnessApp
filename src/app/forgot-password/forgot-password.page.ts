import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {
  securityQuestions = [
    'What is your mother’s maiden name?',
    'What was the name of your first pet?',
    'What was your first car?',
    'What elementary school did you attend?',
    'What is the name of the town where you were born?'
  ];
  showToast = false;
  toastMessage = '';
  toastColor = 'danger';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {}

  forgotPassword(event: Event) {
    event.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const securityQuestion = (document.getElementById('securityQuestion') as HTMLSelectElement).value;
    const securityAnswer = (document.getElementById('securityAnswer') as HTMLInputElement).value.trim();
    const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value.trim();

    if (!email || !securityQuestion || !securityAnswer || !newPassword) {
      this.showToastMessage('Please fill out all fields.', 'danger');
      return;
    }

    this.authService.resetPassword(email, securityQuestion, securityAnswer, newPassword).subscribe(data => {
      if (data.success) {
        this.showToastMessage('Password reset successful.', 'success');
        setTimeout(() => {
          this.loadPage('signin');
        }, 2000); // Redirect to sign-in after 2 seconds
      } else {
        this.showToastMessage(data.message || 'Password reset failed.', 'danger');
      }
    }, error => {
      this.showToastMessage('An error occurred. Please try again.', 'danger');
    });
  }

  loadPage(page: string) {
    this.router.navigate([`/${page}`]);
  }

  private showToastMessage(message: string, color: string) {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 2000);
  }
}