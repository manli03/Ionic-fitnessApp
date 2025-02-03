import { Component, OnInit } from '@angular/core';
import { MealsService } from '../../services/meals.service';
import { Meal } from '../../models/meal.model';
import { AuthService } from '../../services/auth.service';  // Import AuthService
import { AlertController, ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-meals',
  templateUrl: './meals.page.html',
  styleUrls: ['./meals.page.scss'],
})
export class MealsPage implements OnInit {
  todaysMeals: Meal[] = [];
  searchQuery: string = '';
  searchResults: any[] = [];
  newMeal: Partial<Meal> = {};
  userId: number;  // Declare userId

  constructor(
    private mealsService: MealsService, 
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.userId = this.authService.getUserData().id;  // Initialize userId
  }

  ngOnInit() {
    this.loadTodaysMeals();
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    toast.present();
  }

  async presentAlertConfirm(mealId: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this meal?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Delete canceled');
          }
        }, {
          text: 'Delete',
          handler: () => {
            this.deleteMeal(mealId);
          }
        }
      ]
    });

    await alert.present();
  }

  async loadTodaysMeals() {
    const loading = await this.loadingController.create({
      message: 'Loading meals...',
    });
    await loading.present();

    const today = new Date().toISOString().split('T')[0];
    this.mealsService.getMealsByDate(this.userId, today).subscribe(
      async meals => {
        this.todaysMeals = meals;
        if (meals.length === 0) {
          this.presentToast('No meals for today', 'warning');
        }
        await loading.dismiss();
      },
      async error => {
        console.error('Error loading meals:', error);
        await loading.dismiss();
        this.presentToast('Error loading meals', 'danger');
      }
    );
  }

  searchFood() {
    if (this.searchQuery.trim()) {
      this.mealsService.searchFood(this.searchQuery).subscribe(
        response => {
          this.searchResults = response.foods;
          if (this.searchResults.length === 0) {
            this.presentToast('No food items found', 'warning');
          }
        },
        error => {
          if (error.status === 404) {
            this.presentToast('Food item not found: ' + this.searchQuery, 'warning');
          } else {
            console.error('Error searching food:', error);
            this.presentToast('Error searching food', 'danger');
          }
        }
      );
    }
  }

  selectFood(food: any) {
    this.newMeal = {
      name: food.food_name,
      calories: food.nf_calories,
      protein: food.nf_protein,
      carbs: food.nf_total_carbohydrate,
      fat: food.nf_total_fat,
      date: new Date().toISOString() // Ensure date is correct
    };
  }

  logMeal() {
    if (this.newMeal.name && this.newMeal.calories) {
      const mealToAdd = {
        ...this.newMeal,
        user_id: this.userId,
        date: this.newMeal.date || new Date().toISOString()
      } as Omit<Meal, 'id'> & { user_id: number };

      this.mealsService.addMeal(mealToAdd).subscribe(
        response => {
          if (response && response.success) {
            this.loadTodaysMeals();
            this.newMeal = {};
            this.presentToast('Meal logged successfully');
          } else {
            console.error('Error logging meal:', response?.message || 'Unknown error');
            this.presentToast('Error logging meal', 'danger');
          }
        },
        error => {
          console.error('Error logging meal:', error);
          this.presentToast('Error logging meal', 'danger');
        }
      );
    }
  }

  deleteMeal(id: number) {
    this.mealsService.deleteMeal(id).subscribe(
      response => {
        if (response && response.success) {
          this.loadTodaysMeals();
          this.presentToast('Meal deleted successfully');
        } else {
          console.error('Error deleting meal:', response);
          this.presentToast('Error deleting meal', 'danger');
        }
      },
      error => {
        console.error('Error deleting meal:', error);
        this.presentToast('Error deleting meal', 'danger');
      }
    );
  }
}
