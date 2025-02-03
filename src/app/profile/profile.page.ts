import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastController, AlertController, LoadingController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';

type ActivityLevel = 'Sedentary' | 'Lightly active' | 'Moderately active' | 'Very active' | 'Super active';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  profile: {
    fullname: string;
    age: number;
    weight: number;
    height: number;
    gender: string;
    activity_level: ActivityLevel;
    daily_calorie_goal: number;
  } = {
    fullname: '',
    age: 0,
    weight: 0,
    height: 0,
    gender: '',
    activity_level: 'Sedentary',  // Provide a default value
    daily_calorie_goal: 2000  // Default value
  };
  profilePicture: string | null = null;
  tempProfilePicture: File | null = null;
  userId: number;

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {
    const user = this.authService.getUserData();
    this.userId = user.id;
    this.profile.fullname = user.username;
  }

  ngOnInit() {
    this.loadProfile();
  }

  // Display a toast message
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  // Update the profile, including the profile picture if present
  async updateProfile(event: Event) {
    event.preventDefault();
    this.profile.daily_calorie_goal = this.calculateCalorieGoal();
    console.log('Updating profile with data:', this.profile);

    const loading = await this.loadingController.create({
      message: 'Updating profile...',
    });
    await loading.present();

    // Upload profile picture if it has been updated
    if (this.tempProfilePicture) {
      console.log('Uploading new profile picture:', this.tempProfilePicture);
      this.profileService.uploadProfilePicture(this.userId, this.tempProfilePicture).subscribe(
        async result => {
          console.log('Profile picture upload response:', result);
          if (result.success) {
            this.profilePicture = result.profile_picture_url;
            console.log('Profile picture updated successfully:', this.profilePicture);
            this.updateProfileDetails(loading);
          } else {
            await loading.dismiss();
            this.presentToast('Failed to update profile picture: ' + result.message, 'danger');
          }
        },
        async error => {
          await loading.dismiss();
          console.error('Error uploading profile picture:', error);
          this.presentToast('Error uploading profile picture', 'danger');
        }
      );
    } else {
      this.updateProfileDetails(loading);
    }
  }

  // Update profile details in the backend
  async updateProfileDetails(loading: HTMLIonLoadingElement) {
    this.profileService.updateProfile(this.userId, this.profile).subscribe(
      async result => {
        console.log('Profile update response:', result);
        await loading.dismiss();
        if (result.success) {
          this.presentToast('Profile updated successfully', 'success');
          // Delay for 3 seconds before reloading the page
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          this.presentToast('Failed to update profile: ' + result.message, 'danger');
        }
      },
      async error => {
        await loading.dismiss();
        console.error('Error updating profile:', error);
        this.presentToast('Failed to update profile. Please try again.', 'danger');
      }
    );
  }

  // Load the profile data from the backend
  async loadProfile() {
    const loading = await this.loadingController.create({
      message: 'Loading profile...',
    });
    await loading.present();

    this.profileService.getProfile(this.userId).subscribe(
      async response => {
        console.log('Profile load response:', response);
        await loading.dismiss();
        if (response.success) {
          console.log('Profile data received from server:', response.profile);
          this.profile = response.profile;
          this.profile.daily_calorie_goal = this.profile.daily_calorie_goal || 2000;
          this.profile.activity_level = response.profile.activity_level || 'Sedentary';
          if (response.profile.profile_picture) {
            this.profilePicture = `data:image/jpeg;base64,${response.profile.profile_picture}`;
            console.log('Profile picture data:', this.profilePicture);
          }
        } else {
          console.log('Failed to load profile: ', response.message);
          this.presentToast('Failed to load profile', 'danger');
        }
      },
      async error => {
        await loading.dismiss();
        console.error('Error loading profile:', error);
        this.presentToast('Error loading profile', 'danger');
      }
    );
  }

  // Capture a new profile picture using the camera or gallery
  async takePicture() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => {
            this.getPicture(CameraSource.Camera);
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'images',
          handler: () => {
            this.getPicture(CameraSource.Photos);
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async getPicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source
      });

      if (image.dataUrl) {
        this.profilePicture = image.dataUrl;
        console.log('Base64 encoded image:', this.profilePicture);

        const blob = this.dataURItoBlob(image.dataUrl);
        this.tempProfilePicture = new File([blob], 'profile_picture.jpg', { type: 'image/jpeg' });
      } else {
        console.error('Error: image.dataUrl is undefined');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  }

  // Handle file selection for profile picture
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      console.log('File selected:', file);
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePicture = reader.result as string;
        console.log('Base64 encoded image:', this.profilePicture);
      };
      reader.readAsDataURL(file);

      this.tempProfilePicture = file;
    }
  }

  // Convert data URI to Blob
  dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  // Show a confirmation alert before logging out
  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Logout',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  // Log out the user and reload the page
  async logout() {
    try {
      this.authService.logout();
      this.presentToast('Logged out successfully', 'success');
      this.router.navigateByUrl('/signin', { replaceUrl: true }).then(() => {
        window.location.reload(); // Reload the page after navigation
      });
    } catch (error) {
      console.error('Logout error:', error);
      this.presentToast('Failed to logout. Please try again.', 'danger');
    }
  }

  // Calculate the daily calorie goal based on profile data
  calculateCalorieGoal(): number {
    const { age, weight, height, gender, activity_level } = this.profile;

    if (!age || !weight || !height || !gender || !activity_level) {
      return 2000; // Default value if any field is missing
    }

    const bmr = this.calculateBMR(age, weight, height, gender);
    const tdee = this.calculateTDEE(bmr, activity_level);
    return tdee;
  }

  // Calculate the Basal Metabolic Rate (BMR)
  calculateBMR(age: number, weight: number, height: number, gender: string): number {
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  // Calculate the Total Daily Energy Expenditure (TDEE)
  calculateTDEE(bmr: number, activity_level: ActivityLevel): number {
    const activityMultiplier: { [key in ActivityLevel]: number } = {
      'Sedentary': 1.2,
      'Lightly active': 1.375,
      'Moderately active': 1.55,
      'Very active': 1.725,
      'Super active': 1.9
    };
    return Math.round(bmr * activityMultiplier[activity_level]);
  }

  // Update the daily calorie goal when profile data changes
  onProfileChange() {
    this.profile.daily_calorie_goal = this.calculateCalorieGoal();
  }
}
