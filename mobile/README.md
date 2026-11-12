# UniSwap mobile app

The UniSwap phone app, built with Expo (React Native + TypeScript, SDK 58).
It talks to the same Express API (`backend/`) as the website. It sends the login token as
`Authorization: Bearer <token>`.

Phase 1 (12 Nov 2026) has:

- Log in, and sign up with the 6-digit code from the email (AUPP emails only).
- Browse with search and category chips, and pull to refresh.
- The item page: photos you can swipe, price, status, facts, seller with stars, and auction details (read only).
- Saved items: the heart on the item page and the Saved tab.
- Account: name, email and Sign out.

There are no payments in the app. Bids, messages and selling are on the website (messages and selling come in phase 2).

## Run it

You need the API running first (`npm run dev` in `backend/`, on http://localhost:4000).

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Then press `i` to open the app in the iPhone simulator (Xcode must be installed).
The first time, Expo installs the Expo Go app in the simulator.

### On a real phone

1. Install Expo Go from the App Store.
2. Put the phone and the laptop on the same Wi-Fi.
3. In `mobile/.env`, set `EXPO_PUBLIC_API_URL=http://<laptop-ip>:4000` (find the IP with `ipconfig getifaddr en0`).
4. Run `npx expo start` again and scan the QR code with the phone camera.

## Where things are

- `src/app/`: one file is one screen (Expo Router, like the Next.js App Router).
  - `(tabs)/`: the three tabs, Browse (`index.tsx`), Saved and Account.
  - `listings/[id].tsx`: the item page.
  - `login.tsx`, `register.tsx`, `verify.tsx`: log in, sign up, and the 6-digit code.
- `src/lib/api.ts`: one `fetch` wrapper (API address, JSON, Bearer token, error message from `{ error }`).
- `src/lib/auth.tsx`: who is signed in. The token is kept in `expo-secure-store` only.
- `src/lib/format.ts`, `src/types.ts`, `src/theme.ts`: labels, prices, types and colours, copied from `frontend/`.
- `src/components/`: small parts (cards, search box, heart, photo pager, seller card...).
- `src/hooks/use-listings.ts`: loads the Browse list.

## Rules

- The login token goes only in `expo-secure-store` (key `uniswap_token`). Never in AsyncStorage or a file.
- `EXPO_PUBLIC_*` values are built into the app, so anyone can read them. `mobile/.env` holds only
  `EXPO_PUBLIC_API_URL`. Never put a secret there. `.env` is git-ignored.
- Add packages only after the team agrees, and only with `npx expo install <name>`.
- Check the code with `npx tsc --noEmit`. Do not run `npx expo lint` (it would install ESLint).
- One component per file, about 80 lines at most. Each file starts with a short comment.
- No Android SDK on the team laptop: test in the iPhone simulator.
