# DhanVayu 💸

**DhanVayu** is a modern, Gen-Z focused personal finance tracker built with **Expo** and **React Native**. It goes beyond simple expense logging by offering AI-powered financial "roasts" (insights), recurring bill management, and investment tracking, all wrapped in a sleek, neon-themed UI.

<div align="center">
  <img src="./assets/images/icon.png" width="100" />
  <br/>
  <b>Track. Save. Invest. Vibe.</b>
</div>

## 🚀 Features

* **Vibe-Based Tracking**: Log expenses and income with categories like "Munchies" ☕, "Drip" 🛍️, and "Vibes" 🎬.
* **AI Financial Advisor 🤖**: Integrated with **Google Gemini** to provide roasted insights and advice based on your spending habits.
* **Smart Security 🔒**: Biometric authentication (Fingerprint/FaceID) and PIN lock support.
* **Offline First 📶**: Full offline support. Transactions sync seamlessly to Firebase when internet connectivity returns.
* **Recurring Payments 🔄**: Automatic detection and processing of recurring bills with "Due Tomorrow" notifications.
* **Budget & Limits 🎯**: Set monthly category limits and get alerted when you're about to break the bank.
* **Multi-Language Support 🌐**: Switch instantly between English and Hindi.
* **Authentication**: Secure login via Email/Password or **Google Sign-In**.

## 🛠️ Tech Stack

* **Framework**: [Expo](https://expo.dev/) (React Native)
* **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
* **Backend & Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Cloud Functions)
* **AI Engine**: Google Gemini (via Cloud Functions/Proxy)
* **UI/UX**: `lucide-react-native` icons, `expo-linear-gradient`, `expo-haptics`
* **Ads**: `react-native-google-mobile-ads` (AdMob integration ready)

## 📂 Project Structure

```bash
dhanvayu/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Main tab navigation (Home, Explore, Insights, Profile)
│   ├── _layout.tsx       # Root layout & Theme provider
│   └── ...
├── components/           # Reusable UI components (ThemedText, GradientCards)
├── context/              # React Context (User data, Settings)
├── services/             # Background services (Notifications)
├── functions/            # Firebase Cloud Functions (TypeScript)
├── assets/               # Images and Fonts
└── firebaseConfig.js     # Firebase client configuration


⚡ Getting Started
Prerequisites
Node.js (LTS recommended)

npm or yarn

Expo CLI (npm install -g expo-cli)

A Firebase Project

Installation
Clone the repository

Bash

git clone [https://github.com/Samyakub21/my-expo-app.git](https://github.com/Samyakub21/my-expo-app.git)
cd my-expo-app
Install dependencies

Bash

npm install
# or
yarn install
Configure Environment Variables Create a .env file in the root directory and add your Google Auth Client IDs:

Code snippet

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
Setup Firebase

Create a project in the Firebase Console.

Enable Authentication (Email/Password & Google).

Enable Firestore Database.

Add your firebaseConfig.js file to the root directory.

Run the App

Bash

npx expo start
Press a for Android Emulator.

Press i for iOS Simulator.

Scan the QR code with the Expo Go app on your physical device.

📱 Build & Deploy
This project is configured for EAS Build.

Install EAS CLI

Bash

npm install -g eas-cli
Login to Expo

Bash

eas login
Build for Android/iOS

Bash

eas build --profile development --platform android
# or
eas build --profile development --platform ios
🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the ISC License.
