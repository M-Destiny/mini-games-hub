# 🎮 Mini Games Hub

A collection of multiplayer mini games that can be played with friends via shareable links. No downloads, no accounts - just play!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vercel](https://vercelbadge.vercel.app/api/M-Destiny/mini-games-hub)
![Status](https://img.shields.io/badge/status-In%20Development-yellow)

## ✨ Features

- 🎯 **Real-time Multiplayer** - Play with friends in real-time
- 🔗 **Shareable Links** - Just share the room link to invite friends
- 👥 **No Player Limit** - Anyone can join!
- 🎨 **Beautiful UI** - Clean, modern design
- 📱 **Responsive** - Works on desktop and mobile

## 🎮 Available Games

### 1. Scribble (Coming Soon)
- Draw and guess words with your friends
- Multiple rounds with different drawers
- Timer-based gameplay
- Score tracking

### 2. Word Chain (Coming Soon)
- Connect words by matching last letter
- Fast-paced group game
- Multiple difficulty levels

### 3. Trivia Quiz (Coming Soon)
- Group quiz competitions
- Multiple categories
- Score leaderboards

### 4. Hangman (Coming Soon)
- Classic word guessing game
- Play together in groups
- Hint system

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/M-Destiny/mini-games-hub.git
cd mini-games-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
mini-games-hub/
├── src/
│   ├── components/        # Shared components
│   │   ├── GameCard.tsx
│   │   ├── Lobby.tsx
│   │   ├── Room.tsx
│   │   └── Navbar.tsx
│   ├── games/            # Game-specific code
│   │   ├── scribble/
│   │   ├── wordchain/
│   │   ├── trivia/
│   │   └── hangman/
│   ├── hooks/            # Custom React hooks
│   │   ├── useSocket.ts
│   │   └── useGameState.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Game.tsx
│   │   └── CreateRoom.tsx
│   ├── styles/           # Global styles
│   └── utils/            # Utility functions
├── server/               # Backend server
│   ├── index.js
│   ├── rooms.js
│   └── games/
└── public/              # Static assets
```

## 🎯 How to Play

### Creating a Room
1. Visit the homepage
2. Click on a game you want to play
3. Click "Create Room"
4. Share the generated link with friends

### Joining a Room
1. Open the room link shared by a friend
2. Enter your display name
3. Wait for the host to start the game

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io
- **Backend:** Node.js, Express
- **Deployment:** Vercel (frontend), Render (backend)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-game`)
3. Commit your changes (`git commit -m 'Add amazing game'`)
4. Push to the branch (`git push origin feature/amazing-game`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Vercel](https://vercel.com/) for hosting
- All contributors and players!

---

<p align="center">Made with ❤️ by Destiny & Clawe 🐾</p>
