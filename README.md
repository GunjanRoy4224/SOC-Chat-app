# Pulse — Secure Real-Time Communication Platform

**Pulse** is a sleek, modern, and highly secure real-time messaging application built for the **Season of Code (SOC)**. Built on **React 19** and **Vite**, and powered by **Supabase**, Pulse delivers a premium user experience with elegant aesthetics, end-to-end encryption, WebRTC-based voice calls, and robust offline capabilities.

---

## 🚀 Key Features

### 🔐 Uncompromising Security & Privacy
- **End-to-End Encryption (E2EE):** All messages and shared files are encrypted client-side using the Web Crypto API (RSA & AES algorithms), ensuring that only intended recipients can read them.
- **Secure Authentication:** Robust user registration, login, and session management powered by **Supabase Auth**.
- **Protected Routes:** Comprehensive route guarding prevents unauthenticated access to the main dashboard and sensitive areas.

### 💬 Advanced Real-Time Messaging
- **Instant Delivery:** Sub-second message broadcasting across devices utilizing **Supabase Realtime Channels**.
- **Media & File Sharing:** Securely upload and share encrypted images, videos, audio, and documents.
- **Typing Indicators & Read Receipts:** Real-time micro-animations displaying typing activity and message read status.
- **Message Interactions:** Reply to specific messages to maintain context, and delete messages (with real-time optimistic UI updates).
- **Offline Support:** Local message caching via `localforage` (IndexedDB) ensures you can read past conversations even without an internet connection.

### 📞 WebRTC Voice & Video Calls
- **Peer-to-Peer Calling:** High-quality voice calling built directly into the app using **WebRTC**.
- **Real-Time Signaling:** Custom signaling mechanism leveraging Supabase Channels.
- **Call Logs:** Comprehensive history of incoming, outgoing, and missed calls integrated directly into a dedicated "Calls" view.

### 👥 Groups & Community
- **Group Chats:** Create multi-user channels with dynamic participant management.
- **Community View:** Dedicated spaces for larger communities and discussions.

### 🎨 Premium UI & Experience
- **Modern Aesthetics:** Features glassmorphism, responsive navigation bars, and smooth micro-animations.
- **Theme Engine:** Seamless switching between elegant **Light** and **Dark** modes via CSS variables.
- **Rich Interactivity:** Integrated emoji picker (`emoji-picker-react`), responsive sidebars, dropdown menus, and dynamic message bubbles with timestamps.

---

## 🏗️ Architecture & Design

Pulse follows a modern, component-driven architecture:

- **State Management:** React Context (`AuthContext`) is used to manage and distribute global authentication state and online user presence.
- **Real-Time Synchronization:** Subscriptions to Supabase PostgreSQL changes and broadcast channels keep the UI instantly updated across multiple clients.
- **Cryptography Layer:** A dedicated `crypto.js` library handles key pair generation, room key distribution, and AES-GCM encryption/decryption for messages and files.
- **Modular Hooks:** Complex logic, such as WebRTC connection handling, is abstracted into custom hooks (`useWebRTC.js`) for clean components.

---

## 🛠️ Technology Stack

- **Core Framework:** [React (v19)](https://react.dev/)
- **Build System:** [Vite (v8)](https://vite.dev/)
- **Routing:** [React Router DOM (v7)](https://reactrouter.com/)
- **Backend-as-a-Service:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Cryptography:** Web Crypto API (`SubtleCrypto`)
- **Offline Storage:** [localForage](https://localforage.github.io/localForage/)
- **Styling:** Custom Vanilla CSS with a comprehensive design system
- **Icons & Assets:** FontAwesome (v6+), Emoji Picker React

---

## 📂 Project Structure

```text
chat-app/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images & Logos
│   ├── components/         # Reusable React UI Components
│   │   ├── AuthLayout.jsx      # Wrapper for Login/Signup screens
│   │   ├── CallsView.jsx       # Dedicated call history interface
│   │   ├── ChatWindow.jsx      # Real-time messaging viewport with E2EE
│   │   ├── CommunityView.jsx   # Public/Group community spaces
│   │   ├── MessageBubble.jsx   # Individual message component (text/media)
│   │   ├── MessageInput.jsx    # Text input with emoji and file attachments
│   │   ├── ProfileView.jsx     # User settings and profile management
│   │   ├── ProtectedRoute.jsx  # Route protector
│   │   ├── SettingsView.jsx    # App configuration (themes, etc.)
│   │   └── Sidebar.jsx         # Navigation, recent chats, and search
│   ├── context/            # React Contexts (AuthContext)
│   ├── hooks/              # Custom React Hooks
│   │   └── useWebRTC.js        # WebRTC peer connection & signaling logic
│   ├── lib/                # Core Services & Utilities
│   │   ├── crypto.js           # E2EE cryptographic functions
│   │   ├── storage.js          # localForage wrapper for offline caching
│   │   └── supabase.js         # Supabase Client Initialization
│   ├── pages/              # Application Routes
│   │   ├── Home.jsx            # Main dashboard wrapper
│   │   ├── Login.jsx           # Sign in view
│   │   └── Signup.jsx          # Registration view
│   ├── App.jsx             # Main routing registry
│   ├── index.css           # Global design system & theme definitions
│   └── main.jsx            # Application entry point
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

---

## ⚙️ Installation & Setup

Follow these steps to run the Pulse client locally:

### 1. Prerequisites
- **Node.js**: Version 18+ is recommended.
- **Supabase Account**: A configured Supabase project.

### 2. Clone the Repository
```bash
git clone https://github.com/GunjanRoy4224/SOC-Chat-app.git
cd chat-app
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Supabase Configuration
To connect the application to your backend:
1. Create a `.env.local` file in the root directory.
2. Add your Supabase project URL and Anon Key:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Alternatively, update `src/lib/supabase.js` directly if using hardcoded environment variables.)*

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to start chatting.

---

## 🔮 Future Roadmap
- **Video Calling Integration:** Extend the existing WebRTC audio implementation to support high-definition video calls.
- **Push Notifications:** Implement service workers to receive offline alerts for new messages and incoming calls.
- **Advanced Message Search:** Full-text server-side search across all encrypted messages.
- **Themes Marketplace:** Allow users to upload and share custom CSS styling themes.
