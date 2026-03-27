import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';

      if (error.status === 0) {
        message = 'Unable to connect to server. Please check your connection.';
      } else if (error.status === 400) {
        message = error.error?.message || error.error?.detail || 'Invalid request';
      } else if (error.status === 401) {
        message = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        message = error.error?.message || 'Resource not found';
      } else if (error.status === 409) {
        message = error.error?.message || 'Conflict: resource already exists';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      } else if (error.error?.message) {
        message = error.error.message;
      }

      notification.error(message);
      return throwError(() => error);
    })
  );
};
