# Mobile

Expo React Native app for the existing backend API.

## Setup

```sh
npm install
npx expo start --tunnel
```

Create a local `.env` file from `.env.example` and set `EXPO_PUBLIC_API_BASE_URL` to the backend URL, for example:

```sh
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

Do not add GitHub tokens or other private credentials to the mobile app.
