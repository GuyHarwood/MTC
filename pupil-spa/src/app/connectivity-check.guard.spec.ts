import { TestBed, inject } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ConnectivityCheckGuard } from './connectivity-check.guard';
import { APP_CONFIG, IAppConfig } from './services/config/config.service';


let mockRouter;

describe('ConnectivityCheckGuard', () => {
  mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  let initialConnectivityCheckFlag;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConnectivityCheckGuard,
        { provide: Router, useValue: mockRouter }
      ]
    });
    initialConnectivityCheckFlag = APP_CONFIG.connectivityCheckEnabled;
  });

  afterEach( () => {
    (<IAppConfig>APP_CONFIG).connectivityCheckEnabled = initialConnectivityCheckFlag;
  });

  it('should instantiate', inject([ConnectivityCheckGuard], (guard: ConnectivityCheckGuard) => {
    expect(guard).toBeTruthy();
  }));
  describe('when the connectivity check enabled flag is enabled', () => {
    beforeEach(() => {
      (<IAppConfig>APP_CONFIG).connectivityCheckEnabled = true;
    });
    it('should redirect to connectivity check page', inject([ConnectivityCheckGuard], (guard: ConnectivityCheckGuard) => {
      const result = guard.canActivate();
      expect(mockRouter.navigate).not.toHaveBeenCalledWith();
      expect(result).toBeTruthy();
    }));
  });

  describe('when the connectivity check enabled flag is disabled', () => {
    beforeEach(() => {
      (<IAppConfig>APP_CONFIG).connectivityCheckEnabled = false;
    });
    it('should redirect to sign in page', inject([ConnectivityCheckGuard], (guard: ConnectivityCheckGuard) => {
      const result = guard.canActivate();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
      expect(result).toBeFalsy();
    }));
  });
});
