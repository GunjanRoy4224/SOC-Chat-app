# Pulse — Real-Time Chat Application

**Pulse** is a sleek, modern, and secure messaging application built for the **Season of Code (SOC)**. Built on **React 19** and **Vite**, and integrated with **Supabase** for secure authentication, Pulse offers a premium user experience with elegant styling, real-time-like simulations, and multi-view navigation.

---

## 🚀 Features

### 🔐 Secure Authentication & Route Protection
- **User Signup & Login:** Email-based account registration and login powered by **Supabase Auth**.
- **Interactive Validation:** Inline error reporting for email validation, password length, and matching credentials.
- **Route Guarding:** A custom [ProtectedRoute](file:///C:/Users/gunjan/Desktop/chat-app/src/components/ProtectedRoute.jsx) component prevents unauthenticated access to the main dashboard `/home`.

### 💬 Rich Chat Experience
- **Simulated Conversational AI:** Send messages to contacts and watch them type and respond dynamically with automated replies.
- **Typing Indicator:** Smooth micro-animations showing typing activity before messages are received.
- **Modern Message Bubbles:** Styled text bubbles differentiating sent and received messages with timestamps.
- **Quick Filters:** Instantly filter chats using tabs: *All*, *Unread*, *Groups*, and *Favorites (Fav)*.
- **Real-Time Search:** Instantly find conversations and contacts by name.

### 🎨 Premium UI & Design
- **Theme Switching:** Sleek **Light** and **Dark** theme compatibility powered by CSS variables.
- **Responsive Layout:** Adaptive sidebar and chat screen transitions optimised for both desktop and mobile viewports.
- **Rich Aesthetics:** Dark modes, modern typography, glassmorphism, responsive navigation bars, and smooth transitions.

---

## 🛠️ Tech Stack

- **Core Framework:** [React (v19)](https://react.dev/)
- **Build Tool:** [Vite (v8)](https://vite.dev/)
- **Routing:** [React Router DOM (v7)](https://reactrouter.com/)
- **Backend-as-a-Service:** [Supabase](https://supabase.com/) (Authentication & Client setup)
- **Styling:** Custom Vanilla CSS (located in [index.css](file:///C:/Users/gunjan/Desktop/chat-app/src/index.css))
- **Icons:** FontAwesome (v6+)

---

## 📂 Project Structure

```text
chat-app/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images & Logos (e.g. pulse-logo.png)
│   ├── components/         # Reusable React UI Components
│   │   ├── AuthLayout.jsx      # Core wrapper layout for Login/Signup
│   │   ├── ChatWindow.jsx      # Message viewport & response simulation
│   │   ├── MessageBubble.jsx   # Individual message layout with status/time
│   │   ├── MessageInput.jsx    # Text input, emojis, and send action
│   │   ├── ProfileView.jsx     # User settings, information edit, and Logout
│   │   ├── ProtectedRoute.jsx  # Route protector using AuthContext
│   │   └── Sidebar.jsx         # Chat listing, filters, search, and navigation
│   ├── context/            # React Contexts
│   │   └── AuthContext.jsx     # Global authentication state provider
│   ├── lib/                # Third-party configurations
│   │   └── supabase.js         # Supabase Client Initialization
│   ├── pages/              # Application View Pages
│   │   ├── Home.jsx            # Main app wrapper (Sidebar + ChatWindow / ProfileView)
│   │   ├── Login.jsx           # Sign in page
│   │   └── Signup.jsx          # Register account page
│   ├── App.jsx             # Main routing registry
│   ├── index.css           # Styling system & theme definitions
│   └── main.jsx            # React application entry point
├── package.json            # Node dependencies and project scripts
└── vite.config.js          # Vite compilation settings
```

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally:

### 1. Prerequisites
- Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).
- A [Supabase](https://supabase.com/) account and project.

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
The application is pre-configured with a default demo Supabase project in [supabase.js](file:///C:/Users/gunjan/Desktop/chat-app/src/lib/supabase.js). 

To connect to your own Supabase project:
1. Open [supabase.js](file:///C:/Users/gunjan/Desktop/chat-app/src/lib/supabase.js).
2. Replace `supabaseUrl` and `supabaseAnonKey` with your own project credentials from your Supabase dashboard (**Project Settings** -> **API**).

### 5. Run the Local Development Server
```bash
npm run dev
```
Once the dev server starts, open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔮 Future Enhancements
- **Persistent Database Storage:** Connect messaging states to Supabase PostgreSQL instead of mock states.
- **Supabase Realtime:** Enable instantaneous text broadcasting across different devices/browsers.
- **Live Calls & Community:** Enable functional audio calling and community group setups.
