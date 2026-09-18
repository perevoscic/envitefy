package com.envitefy.app;

import com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler;
import com.google.androidbrowserhelper.trusted.DelegationService;

/** Gives the verified TWA browser access to Android's foreground location permission flow. */
public final class EnvitefyDelegationService extends DelegationService {
    public EnvitefyDelegationService() {
        registerExtraCommandHandler(new LocationDelegationExtraCommandHandler());
    }
}
