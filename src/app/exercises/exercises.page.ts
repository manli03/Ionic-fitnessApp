import { Component, OnInit, ViewChild } from '@angular/core';
import { ExercisesService } from '../../services/exercises.service';
import { Exercise } from '../../models/exercise.model';
import { Chart, ChartConfiguration } from 'chart.js';
import { ModalController, AlertController, LoadingController, ToastController, IonModal } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage implements OnInit {
  @ViewChild('exerciseForm') exerciseForm!: NgForm;
  @ViewChild(IonModal) modal!: IonModal;

  nutritionixExercises: any[] = [];
  exercises: Exercise[] = [];
  filterStartDate: string = new Date().toISOString();
  filterEndDate: string = new Date().toISOString();
  filterCategory: string = 'all';

  totalExercises: number = 0;
  totalDuration: number = 0;
  totalCalories: number = 0;
  caloriesPerMinute: number = 0;

  chart: Chart | null = null;

  newExercise: Omit<Exercise, 'id'> = {
    name: '',
    category: '',
    duration: 0,
    caloriesBurned: 0,
    date: new Date().toISOString()
  };
  isEditing: boolean = false;
  editingExerciseId: number | null = null;

  isStartDatePickerOpen: boolean = false;
  isEndDatePickerOpen: boolean = false;
  isOpenModal: boolean = false;  // State for modal

  selectedExerciseType: string = '';
  selectedSuggestedExercise: string = '';
  customExerciseName: string = '';
  suggestedExercises: string[] = [];
  selectedExerciseResult: { name: string, duration: number, calories: number } | null = null;

  exerciseSuggestions = {
    cardio: ['Running', 'Jogging', 'Cycling', 'Swimming', 'Jumping Rope', 'Brisk Walking'],
    strength: ['Push-ups', 'Squats', 'Lunges', 'Dumbbell Curls', 'Bench Press', 'Deadlifts'],
    flexibility: ['Yoga', 'Stretching', 'Pilates', 'Dynamic Stretching', 'Static Stretching'],
    balance: ['Yoga Balance Poses', 'Single-Leg Stands', 'Bosu Ball Exercises', 'Tai Chi']
  };

  constructor(
    private exercisesService: ExercisesService,
    private modalController: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    console.log('Component initialized');
    this.setInitialDateRange();
    this.loadExercises();
  }

  setInitialDateRange() {
    const startDate = new Date(new Date().getFullYear(), 0, 1); // January 1st of the current year
    const endDate = new Date(new Date().getFullYear(), 11, 31); // December 31st of the current year
  
    this.filterStartDate = startDate.toISOString();
    this.filterEndDate = endDate.toISOString();
  }

  openModal(isEditing: boolean = false, exercise?: Exercise) {
    this.isEditing = isEditing;
    if (isEditing && exercise) {
      this.editingExerciseId = exercise.id;
      this.newExercise = {
        name: exercise.name,
        category: exercise.category,
        duration: exercise.duration,
        caloriesBurned: exercise.caloriesBurned,
        date: exercise.date
      };
      this.caloriesPerMinute = exercise.caloriesBurned / exercise.duration;
    } else {
      this.resetExerciseForm();
    }
    this.isOpenModal = true;
  }

  closeModal() {
    this.isOpenModal = false;  // Close modal
  }

  openStartDatePicker() {
    this.isStartDatePickerOpen = true;
  }
  
  openEndDatePicker() {
    this.isEndDatePickerOpen = true;
  }

  async loadExercises() {
    const loading = await this.loadingController.create({
      message: 'Loading exercises...',
    });
    await loading.present();
  
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id;
  
    console.log('User ID:', userId); // Log the user ID
  
    this.exercisesService.getExercises(userId, this.filterStartDate, this.filterEndDate, this.filterCategory).subscribe(
      (exercises: any[]) => {  // Use any[] to access the raw response
        console.log('Fetched exercises:', exercises); // Log fetched exercises
        if (exercises && exercises.length > 0) {
          this.exercises = exercises.map(ex => ({
            id: ex.id,
            user_id: ex.user_id,
            name: ex.name,
            category: ex.category || '',  // Ensure default category
            duration: ex.duration || 0,  // Ensure default duration
            caloriesBurned: ex.calories_burned || 0,  // Explicitly map and ensure a default value
            date: ex.date || new Date().toISOString()  // Ensure default date
          }));
          this.calculateSummary();
          this.loadExerciseChart();
        } else {
          console.log('No exercises found.');
          this.exercises = []; // Make sure to reset exercises to an empty array
          this.loadExerciseChart(); // Ensure chart is updated when no exercises are found
        }
        loading.dismiss();
      },
      async (error) => {
        console.error('Error loading exercises:', error);
        loading.dismiss();
        const toast = await this.toastController.create({
          message: 'Failed to load exercises. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      }
    );
  }

  calculateSummary() {
    console.log('Calculating summary with exercises:', this.exercises);
    this.totalExercises = this.exercises.length;
    this.totalDuration = this.exercises.reduce((sum, ex) => sum + ex.duration, 0);
    this.totalCalories = this.exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0); // Ensure caloriesBurned is a number
    
    console.log('Summary calculated:', this.totalExercises, this.totalDuration, this.totalCalories);
    
    this.exercises.forEach(exercise => {
      console.log(`Exercise: ${exercise.name}, Calories Burned: ${exercise.caloriesBurned}`);
    });
  }

  applyFilter() {
    this.filterStartDate = new Date(this.filterStartDate).toISOString();
    this.filterEndDate = new Date(this.filterEndDate).toISOString();
    console.log(`Applying filter: Start Date: ${this.filterStartDate}, End Date: ${this.filterEndDate}, Category: ${this.filterCategory}`);
    this.loadExercises();
  }

  async addOrUpdateExercise() {
    if (this.exerciseForm.invalid) {
      return;
    }
  
    const loading = await this.loadingController.create({
      message: this.isEditing ? 'Updating exercise...' : 'Adding exercise...',
    });
    await loading.present();
  
    // Capture the current date and time in local time
    const currentDate = new Date();
    this.newExercise.date = currentDate.toISOString(); // Ensure the date is in ISO format
  
    const exerciseData = { ...this.newExercise, user_id: JSON.parse(localStorage.getItem('user') || '{}').id };
  
    const operation = this.isEditing && this.editingExerciseId !== null
      ? this.exercisesService.updateExercise({ ...exerciseData, id: this.editingExerciseId })
      : this.exercisesService.addExercise(exerciseData);
  
    operation.subscribe(
      async (result) => {
        loading.dismiss();
        if (result.success) {
          const toast = await this.toastController.create({
            message: this.isEditing ? 'Exercise updated successfully' : 'Exercise added successfully',
            duration: 3000,
            color: 'success'
          });
          toast.present();
          this.closeModal();
          this.resetForm();
          this.loadExercises(); // Load exercises and update summary
        } else {
          const alert = await this.alertController.create({
            header: 'Error',
            message: `Failed to ${this.isEditing ? 'update' : 'add'} exercise: ${result.message}`,
            buttons: ['OK']
          });
          alert.present();
        }
      },
      async (error) => {
        loading.dismiss();
        console.error(`Error ${this.isEditing ? 'updating' : 'adding'} exercise:`, error);
        const alert = await this.alertController.create({
          header: 'Error',
          message: `An unexpected error occurred. Please try again. Error: ${error.message}`,
          buttons: ['OK']
        });
        alert.present();
      }
    );
  }

  async deleteExercise(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this exercise?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting exercise...',
            });
            await loading.present();
  
            this.exercisesService.deleteExercise(id).subscribe(
              async (result) => {
                loading.dismiss();
                if (result.success) {
                  const toast = await this.toastController.create({
                    message: 'Exercise deleted successfully',
                    duration: 3000,
                    color: 'success'
                  });
                  toast.present();
                  this.exercises = this.exercises.filter(exercise => exercise.id !== id); // Update the state
                  this.calculateSummary(); // Recalculate summary
                  this.loadExerciseChart(); // Update the chart
                } else {
                  const errorAlert = await this.alertController.create({
                    header: 'Error',
                    message: 'Failed to delete exercise: ' + result.message,
                    buttons: ['OK']
                  });
                  errorAlert.present();
                }
              },
              async (error) => {
                loading.dismiss();
                console.error('Error deleting exercise:', error);
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'An unexpected error occurred. Please try again.',
                  buttons: ['OK']
                });
                errorAlert.present();
              }
            );
          }
        }
      ]
    });
  
    await alert.present();
  }

  editExercise(exercise: Exercise) {
    this.openModal(true, exercise);
  }

  resetForm() {
    this.isEditing = false;
    this.editingExerciseId = null;
    this.newExercise = {
      name: '',
      category: '',
      duration: 0,
      caloriesBurned: 0,
      date: new Date().toISOString()
    };
    if (this.exerciseForm) {
      this.exerciseForm.resetForm();
    }
  }

  loadExerciseChart() {
    const ctx = document.getElementById('exerciseChart') as HTMLCanvasElement;
  
    if (!ctx) {
        console.error('Chart context not found');
        return;
    }
  
    // Prepare data for the chart
    const dates = this.exercises.map(ex => new Date(ex.date).toLocaleDateString());
    const calories = this.exercises.map(ex => {
        const caloriesBurned = ex.caloriesBurned || 0;
        console.log(`Date: ${ex.date}, Calories Burned: ${caloriesBurned}`);
        return caloriesBurned;
    });
  
    console.log('Plotting chart with dates:', dates); // Log chart data
    console.log('Plotting chart with calories:', calories); // Log chart data
  
    if (this.chart) {
        this.chart.destroy();
    }
  
    const chartConfig: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Calories Burned',
                    data: calories,
                    backgroundColor: 'rgba(255, 87, 34, 0.6)', // Semi-transparent orange
                    borderColor: 'rgba(255, 87, 34, 1)', // Solid orange
                    borderWidth: 1,
                    barThickness: 40 // Increase bar thickness for better visibility
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1, // Set the step size to 1 to ensure small values are visible
                        precision: 0, // Ensure the ticks are integer
                        callback: function(value) { // Add this callback to display integer values correctly
                            return Number(value).toFixed(0);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y;
                            return label;
                        }
                    }
                }
            }
        }
    };
  
    this.chart = new Chart(ctx, chartConfig);
  }

  onDateChange(type: 'start' | 'end') {
    if (type === 'start') {
      this.isStartDatePickerOpen = false;
    } else {
      this.isEndDatePickerOpen = false;
    }
    this.applyFilter();  // Update exercises and chart when date is changed
  }

  updateExerciseDetails(exercise: any) {
    this.newExercise.duration = exercise.duration_min;
    this.newExercise.caloriesBurned = Math.round(exercise.nf_calories) || 0;  // Ensure a default value of 0
    this.caloriesPerMinute = (exercise.nf_calories / exercise.duration_min) || 0;
  }

  selectNutritionixExercise(exercise: any) {
    this.newExercise.name = exercise.name;
    this.newExercise.duration = exercise.duration_min;
    this.caloriesPerMinute = exercise.nf_calories / exercise.duration_min;
    console.log('Calories per minute set to:', this.caloriesPerMinute);
    
    this.newExercise.category = this.selectedExerciseType !== 'custom' ? this.selectedExerciseType : this.inferCategory(exercise.name);
    this.updateCalories();
    this.isCaloriesReadonly = true;
  }

  inferCategory(exerciseName: string): string {
    exerciseName = exerciseName.toLowerCase();
    if (exerciseName.includes('run') || exerciseName.includes('jog') || 
        exerciseName.includes('walk') || exerciseName.includes('swim') || 
        exerciseName.includes('cycle') || exerciseName.includes('bike') || 
        exerciseName.includes('cardio')) {
      return 'cardio';
    } else if (exerciseName.includes('lift') || exerciseName.includes('push') || 
               exerciseName.includes('pull') || exerciseName.includes('weight') || 
               exerciseName.includes('strength')) {
      return 'strength';
    } else if (exerciseName.includes('stretch') || exerciseName.includes('yoga') || 
               exerciseName.includes('flexibility')) {
      return 'flexibility';
    } else if (exerciseName.includes('balance') || exerciseName.includes('pose') || 
               exerciseName.includes('pilates')) {
      return 'balance';
    }
    return 'other';
  }

  isCaloriesReadonly: boolean = true;

  updateCalories() {
    console.log('Updating calories...');
    console.log('Duration:', this.newExercise.duration);
    console.log('Calories per minute:', this.caloriesPerMinute);
    
    if (this.caloriesPerMinute > 0 && this.newExercise.duration > 0) {
      this.newExercise.caloriesBurned = Math.round(this.newExercise.duration * this.caloriesPerMinute);
      console.log('Updated calories burned:', this.newExercise.caloriesBurned);
    } else {
      console.log('Cannot update calories: invalid caloriesPerMinute or duration');
    }
  }

  onCaloriesFocus() {
    this.isCaloriesReadonly = false;
  }

  onExerciseTypeSelect(event: any) {
    const selectedType = event.detail.value;
    if (selectedType !== 'custom') {
      this.suggestedExercises = this.exerciseSuggestions[selectedType as keyof typeof this.exerciseSuggestions] || [];
      this.selectedSuggestedExercise = '';
      this.selectedExerciseResult = null;
    } else {
      this.suggestedExercises = [];
      this.customExerciseName = '';
      this.selectedExerciseResult = null;
    }
  }

  onSuggestedExerciseSelect() {
    if (this.selectedSuggestedExercise) {
      this.searchNutritionixExercises(this.selectedSuggestedExercise);
    }
  }

  onCustomExerciseInput(event: any) {
    const query = event.target.value.trim();
    if (query.length >= 2) {
      this.searchNutritionixExercises(query);
    } else {
      this.nutritionixExercises = [];
    }
  }

  async searchNutritionixExercises(query: string) {
    this.exercisesService.searchExercises(query).subscribe(
      (data) => {
        if (data.exercises && data.exercises.length > 0) {
          const exercise = data.exercises[0];
          this.selectedExerciseResult = {
            name: exercise.name,
            duration: exercise.duration_min,
            calories: Math.round(exercise.nf_calories)
          };
          console.log('Selected exercise result:', this.selectedExerciseResult);
        } else {
          this.selectedExerciseResult = null;
          this.showToast('No exercise details found. You can enter custom details.');
        }
      },
      async (error) => {
        console.error('Error searching exercises:', error);
        this.showToast('Failed to fetch exercise details. You can enter custom details.');
      }
    );
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color
    });
    toast.present();
  }

  populateExerciseDetails() {
    if (this.selectedExerciseResult) {
      this.newExercise.name = this.selectedExerciseResult.name;
      this.newExercise.duration = this.selectedExerciseResult.duration;
      this.caloriesPerMinute = this.selectedExerciseResult.calories / this.selectedExerciseResult.duration;
      console.log('Calories per minute set to:', this.caloriesPerMinute);
      
      this.newExercise.category = this.selectedExerciseType === 'custom' ? this.inferCategory(this.selectedExerciseResult.name) : this.selectedExerciseType;
      this.updateCalories();
      this.isCaloriesReadonly = true;
    }
  }

  resetExerciseForm() {
    this.newExercise = {
      name: '',
      category: '',
      duration: 0,
      caloriesBurned: 0,
      date: new Date().toISOString()
    };
    this.caloriesPerMinute = 0;
    this.isCaloriesReadonly = false;
    this.selectedExerciseResult = null;
  }

  onDurationChange() {
    if (this.caloriesPerMinute > 0) {
      this.updateCalories();
    } else {
      console.log('No valid calories per minute set. Select an exercise first.');
    }
  }
}
