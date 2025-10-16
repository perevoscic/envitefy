plugins {
  id("com.android.application")
  kotlin("android")
}

android {
  namespace = "com.snapmydate.twa"
  compileSdk = 34

  defaultConfig {
    applicationId = "com.snapmydate.twa"
    minSdk = 24
    targetSdk = 34
    versionCode = 1
    versionName = "1.0"
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
  }
}

dependencies {
  implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
}
