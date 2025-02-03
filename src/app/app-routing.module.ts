import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'signin', loadChildren: () => import('./sign-in/sign-in.module').then(m => m.SignInPageModule) },
      { path: 'signup', loadChildren: () => import('./sign-up/sign-up.module').then(m => m.SignUpPageModule) },
      { path: 'forgot-password', loadChildren: () => import('./forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule) },
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomePageModule) },
      { path: 'exercises', loadChildren: () => import('./exercises/exercises.module').then(m => m.ExercisesPageModule) },
      { path: 'meals', loadChildren: () => import('./meals/meals.module').then(m => m.MealsPageModule) },
      { path: 'profile', loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule) },
      { path: 'search', loadChildren: () => import('./search/search.module').then(m => m.SearchPageModule) }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
