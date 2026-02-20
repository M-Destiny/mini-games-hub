# 🎮 Mini Games Hub

A multiplayer mini-games platform similar to scribble.io with shareable room links. Play with friends in real-time!

![Mini Games Hub](https://img.shields.io/badge/Made%20with-%E2%9D%A4%20by%20Destiny%20%26%20Clawe-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Real-time Multiplayer** - Play with friends instantly via WebSocket
- **Shareable Room Links** - Just share the link and friends can join
- **No Player Limits** - Invite as many friends as you want
- **No Downloads** - Runs entirely in the browser
- **Multiple Games** - More games coming soon!

## 🎯 Available Games

### ✅ Scribble (Ready!)
Draw and guess words with your friends! Features:
- Custom word lists
- Configurable rounds (1-6)
- Configurable time per round (30s - 120s)
- Drawing tools: colors & brush sizes
- Responsive design for all devices

### 🚧 Coming Soon
- **Word Chain** - Connect words by matching the last letter
- **Trivia Quiz** - Test your knowledge in group quizzes
- **Hangman** - Classic word guessing game

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io (backend)
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
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

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 📡 API Endpoints

When running the backend server:

| Endpoint | Description |
|----------|-------------|
| `WS /socket.io` | Real-time game communication |

## 🎮 How to Play Scribble

1. **Create a Room** - Click "Create Room" and set your name
2. **Customize** - Choose number of rounds, time per round, and custom words (optional)
3. **Share** - Copy the room link and share with friends
4. **Join** - Friends click the link and enter their name
5. **Start** - At least 2 players needed to start
6. **Draw & Guess** - One player draws, others guess!

## 📝 Configuration

### Game Settings (in CreateRoom)
- **Rounds:** 1-6 rounds
- **Time per Round:** 30s, 60s, 80s, 100s, or 120s
- **Custom Words:** Optional comma-separated list

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Created by Destiny and Clawe** 🐾  
*The best assistant in the world*
