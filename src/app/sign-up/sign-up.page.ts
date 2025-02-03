import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {
  signUpForm: FormGroup;
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signUpForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      securityQuestion: ['', Validators.required],
      securityAnswer: ['', Validators.required]
    });
  }

  ngOnInit() {}

  signUp() {
    if (this.signUpForm.valid) {
      const { username, email, password, securityQuestion, securityAnswer } = this.signUpForm.value;
      this.authService.signUp(username, email, password, securityQuestion, securityAnswer).subscribe(data => {
        if (data.success) {
          this.showToastMessage('Sign up successful!', 'success');
          localStorage.setItem('user', JSON.stringify(data.user));
          setTimeout(() => {
            this.router.navigate(['/home']).then(() => {
              window.location.reload(); // Reload the page after navigation
            });
          }, 2000);
        } else {
          this.showToastMessage(data.message || 'Sign up failed.', 'danger');
        }
      }, error => {
        this.showToastMessage('An error occurred. Please try again.', 'danger');
      });
    } else {
      this.showToastMessage('Please fill out all fields.', 'danger');
    }
  }

  signIn() {
    this.router.navigate(['/signin']);
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