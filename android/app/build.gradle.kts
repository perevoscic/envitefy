plugins {
    id("com.android.application")
    kotlin("android")
}

android {
    namespace = "com.snapmydate.twa"          // keep in sync with manifest
    compileSdk = 34

    defaultConfig {
        applicationId = "com.snapmydate.twa"  // keep in sync with assetlinks.json later
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        debug {
            // No special config; you'll verify TWA with debug fingerprint first.
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Configure signingConfig when you’re ready to ship (or use Play App Signing).
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    // Optional: if you get duplicate class warnings with other libs in future
    packaging {
        resources.excludes += setOf(
            "META-INF/LICENSE*",
            "META-INF/AL2.0",
            "META-INF/LGPL2.1"
        )
    }
}

dependencies {
    // Core TWA helper
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
