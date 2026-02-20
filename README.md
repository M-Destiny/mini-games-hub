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
- Drawing tools: 12 colors & 5 brush sizes
- Clear canvas option
- Real-time drawing sync
- Score tracking
- Responsive design for all devices

### 🚧 Coming Soon
- **Word Chain** - Connect words by matching the last letter
- **Trivia Quiz** - Test your knowledge in group quizzes
- **Hangman** - Classic word guessing game

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io (backend needed for multiplayer)
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

## 📱 Quick Start

1. **Create a Room** - Click "Create Room" and enter your name
2. **Customize** - Choose rounds, time per round, and add custom words (optional)
3. **Share** - Copy the room link and share with friends
4. **Join** - Friends click the link and enter their name
5. **Start** - At least 1 player needed to start (demo mode)
6. **Draw & Guess** - Draw the word, others guess!

## 🎮 How to Play Scribble

### As Drawer:
1. You'll see the word to draw
2. Use colors and brush sizes to draw
3. Players will guess in the chat
4. Correct guesses earn points!

### As Guesser:
1. Watch the drawing carefully
2. Type your guess in the chat
3. First to guess correctly wins points!
4. Points = time remaining × 10

## ⚙️ Game Settings

| Setting | Options | Default |
|---------|---------|---------|
| Rounds | 1, 2, 3, 4, 5, 6 | 3 |
| Time per Round | 30s, 60s, 80s, 100s, 120s | 80s |
| Custom Words | Any comma-separated list | Default word list |

## 📁 Project Structure

```
mini-games-hub/
├── src/
│   ├── context/
│   │   └── SocketContext.tsx    # Real-time state management
│   ├── games/
│   │   └── scribble/
│   │       └── ScribbleGame.tsx # Main game component
│   ├── pages/
│   │   ├── Home.tsx            # Game selection hub
│   │   ├── CreateRoom.tsx      # Room creation + settings
│   │   └── JoinRoom.tsx        # Join existing room
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main app with routing
│   └── main.tsx                # Entry point
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔧 Backend (For Real Multiplayer)

To enable real multiplayer across different devices, you'll need to set up a Socket.io backend. A separate server will handle:
- Room management
- Player synchronization
- Drawing broadcast
- Game state management
- Score tracking

### Quick Deploy Backend Options:
- **Render** - Free tier available
- **Railway** - Pay as you go
- **Fly.io** - Global deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

**Created by Destiny and Clawe** 🐾  
*The best assistant in the world*
