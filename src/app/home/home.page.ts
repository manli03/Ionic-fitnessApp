import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { ProfileService } from '../../services/profile.service';
import { Router } from '@angular/router';
import { ViewWillEnter } from '@ionic/angular';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, ViewWillEnter {
  caloriesBurned: number = 0;
  caloriesConsumed: number = 0;
  remainingCalories: number = 0;
  calorieGoalPercentage: number = 0;
  weeklyData: number[] = [];
  dailyCalorieGoal: number = 2000;  // Default value, will be overwritten

  progressChart: Chart<'doughnut', number[], string> | null = null;
  weeklyChart: Chart<'line', number[], string> | null = null;

  constructor(
    private dashboardService: DashboardService,
    private profileService: ProfileService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  ngOnInit() {
    // Remove loadProfileAndData from ngOnInit to avoid conflicts
  }

  ionViewWillEnter() {
    this.resetCharts();
    this.loadProfileAndData();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  async loadProfileAndData() {
    const loading = await this.loadingController.create({
      message: 'Loading profile and data...',
    });
    await loading.present();

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      await loading.dismiss();
      this.presentToast('No user data found, please log in again.', 'danger');
      this.router.navigate(['/signin']);
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.id) {
      await loading.dismiss();
      this.presentToast('Invalid user data, please log in again.', 'danger');
      this.router.navigate(['/signin']);
      return;
    }

    const userId = user.id;
    this.profileService.getProfile(userId).subscribe(
      async (data: any) => {
        console.log('Profile Data:', data);  // Log the profile data
        if (data && data.profile) {
          this.dailyCalorieGoal = data.profile.daily_calorie_goal || 2000; // Update the daily calorie goal
          this.loadDailySummary(userId, this.dailyCalorieGoal);
          this.loadWeeklySummary(userId);
        } else {
          console.warn('Profile data is undefined or invalid');
        }
        await loading.dismiss();
      },
      async (error) => {
        console.error('Error fetching profile:', error);
        await loading.dismiss();
        this.presentToast('Error fetching profile', 'danger');
      }
    );
  }

  loadDailySummary(userId: number, dailyCalorieGoal: number) {
    this.dashboardService.getDailySummary(userId, dailyCalorieGoal).subscribe(
      (data: any) => {
        console.log('Daily Summary Data:', data);  // Log the data
        if (data) {
          this.caloriesBurned = +data.caloriesBurned || 0;  // Ensure number type
          this.caloriesConsumed = +data.caloriesConsumed || 0;  // Ensure number type
          this.remainingCalories = +data.remainingCalories || 0;  // Ensure number type
          this.calorieGoalPercentage = ((this.caloriesConsumed + this.caloriesBurned) / dailyCalorieGoal) * 100;
          this.loadProgressChart();
        } else {
          console.warn('No data received for daily summary');
        }
      },
      (error) => {
        console.error('Error fetching daily summary:', error);
        this.presentToast('Error fetching daily summary', 'danger');
      }
    );
  }

  loadWeeklySummary(userId: number) {
    this.dashboardService.getWeeklySummary(userId).subscribe(
      (data: any) => {
        console.log('Weekly Summary Data:', data);  // Log the data
        if (data && data.caloriesBurned) {
          this.weeklyData = data.caloriesBurned.map((val: any) => +val || 0);  // Ensure number type
          this.loadWeeklyChart();
        } else {
          console.warn('No data received for weekly summary');
        }
      },
      (error) => {
        console.error('Error fetching weekly summary:', error);
        this.presentToast('Error fetching weekly summary', 'danger');
      }
    );
  }

  // Reset charts to avoid "Canvas is already in use" errors
  resetCharts() {
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
      this.weeklyChart = null;
    }
  }

  // Load and render the progress chart
  loadProgressChart() {
    const ctx = document.getElementById('progressChart') as HTMLCanvasElement;
    if (ctx) {
      this.progressChart = new Chart<'doughnut', number[], string>(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Calories Burned', 'Calories Remaining'],
          datasets: [
            {
              data: [this.caloriesBurned, this.remainingCalories],
              backgroundColor: ['#FF5722', '#FFCCBC'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
  }

  // Load and render the weekly chart
  loadWeeklyChart() {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    if (ctx) {
      this.weeklyChart = new Chart<'line', number[], string>(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Calories Burned',
              data: this.weeklyData,
              backgroundColor: 'rgba(255, 87, 34, 0.2)',
              borderColor: 'rgba(255, 87, 34, 1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  }
}
