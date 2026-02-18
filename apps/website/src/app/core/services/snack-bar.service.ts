import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SnackBarConfirmOptions {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    verticalPosition: 'top',
    horizontalPosition: 'center',
    panelClass: ['snackbar-default'],
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Displays a success message with customizable configuration.
   * @param message The message to display.
   * @param config Optional configuration to override defaults.
   */
  success(message: string, config: Partial<MatSnackBarConfig> = {}): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-success', ...(config.panelClass || [])],
    });
  }

  /**
   * Displays an error message with customizable configuration.
   * @param message The message to display.
   * @param config Optional configuration to override defaults.
   */
  error(message: string, config: Partial<MatSnackBarConfig> = {}): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-error', ...(config.panelClass || [])],
    });
  }

  /**
   * Displays an info message with customizable configuration.
   * @param message The message to display.
   * @param config Optional configuration to override defaults.
   */
  info(message: string, config: Partial<MatSnackBarConfig> = {}): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      ...config,
      panelClass: ['snackbar-info', ...(config.panelClass || [])],
    });
  }

  /**
   * Displays a confirmation dialog and returns an Observable with the user's response.
   * @param options Configuration for the confirmation dialog.
   * @returns Observable<boolean> resolving to true if confirmed, false if cancelled.
   */
  confirm(options: SnackBarConfirmOptions): Observable<boolean> {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: options.duration || 10000, // Longer duration for confirmation
      panelClass: ['snackbar-confirm'],
      data: options,
    };

    const snackBarRef: MatSnackBarRef<SimpleSnackBar> = this.snackBar.open(
      `${options.title}\n${options.text}`,
      `${options.confirmText || 'Confirm'} / ${options.cancelText || 'Cancel'}`,
      config
    );

    return snackBarRef.afterDismissed().pipe(
      map((dismissal) => {
        const action = dismissal.dismissedByAction ? 'Confirm' : 'Cancel';
        return action === 'Confirm';
      })
    );
  }
}