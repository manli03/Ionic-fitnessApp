import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarService } from '../../services/navbar.service';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-signin',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private navbarService: NavbarService,
    private toastController: ToastController,
    private loadingController: LoadingController // Inject LoadingController
  ) { }

  ngOnInit() {
    this.navbarService.setNavbarVisible(false);
  }

  // Display a toast message
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    toast.present();
  }

  // Sign in the user and show a loading spinner while processing
  async signIn(event: Event) {
    event.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    const loading = await this.loadingController.create({
      message: 'Signing in...',
    });
    await loading.present();

    this.authService.signIn(email, password).subscribe({
      next: async (data) => {
        await loading.dismiss();
        if (data && data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          this.navbarService.setNavbarVisible(true);
          this.showToast('Sign-in successful!', 'success');
          this.router.navigate(['/home']);
        } else {
          this.showToast('Sign in failed: ' + (data && data.message ? data.message : 'Unknown error'), 'danger');
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.showToast('Sign in failed: ' + (error.message || 'An unknown error occurred'), 'danger');
      }
    });
  }

  // Navigate to the specified page
  loadPage(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
