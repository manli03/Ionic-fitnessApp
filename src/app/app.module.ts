import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';  // Import this

import { AppComponent } from './app.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

import { AuthService } from '../services/auth.service';
import { ExercisesService } from '../services/exercises.service';
import { MealsService } from '../services/meals.service';
import { ProfileService } from '../services/profile.service';
import { SearchService } from '../services/search.service';
import { NutritionixService } from '../services/nutritionix.service';
import { DashboardService } from '../services/dashboard.service';
import { NavbarService } from '../services/navbar.service';
import { AuthGuard } from './auth.guard';

@NgModule({
  declarations: [
    AppComponent,
    AuthLayoutComponent,
    MainLayoutComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule // Add this line
  ],
  providers: [
    AuthService,
    ExercisesService,
    MealsService,
    ProfileService,
    SearchService,
    NutritionixService,
    DashboardService,
    NavbarService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
