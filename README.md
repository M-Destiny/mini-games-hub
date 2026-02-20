# 🎮 Mini Games Hub

A multiplayer mini-games platform with shareable room links. Play with friends in real-time!

![Mini Games Hub](https://img.shields.io/badge/Made%20with-%E2%9D%A4%20by%20Destiny%20%26%20Clawe-purple)

## ✨ Features

- **Real-time Multiplayer** - Play with friends via Socket.io
- **Shareable Room Links** - Just share the link and friends can join
- **No Player Limits** - Invite as many friends as you want
- **No Downloads** - Runs entirely in the browser
- **Auto-reconnect** - Reload page and stay in room
- **Host Controls** - Only host can start game

## 🎯 Available Games

### ✅ Scribble (Ready!)
Draw and guess words with your friends!
- Custom word lists
- Configurable rounds (1-6)
- Configurable time per round (30-120s)
- 12 colors & 5 brush sizes
- Smooth drawing for all players
- Time-based hints
- Points = time remaining × 10

### ✅ Hangman (Ready!)
Classic word guessing game!
- 5 categories: Animals, Fruits, Countries, Movies, Sports
- Configurable rounds (1-6)
- 100 points per correct guess
- Multiplayer support
- Round tracking

### 🚧 Coming Soon
- Word Chain
- Trivia Quiz

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Socket.io (Node.js)
- **Deployment:** Vercel (Frontend) + Render (Backend)

## 🚀 Live Demo

**Frontend:** https://mini-games-hub-rouge.vercel.app

**Backend:** https://mini-games-hub.onrender.com

## 🎮 How to Play

### Scribble
1. Create a room or join existing
2. Share room link with friends
3. Host starts the game
4. One player draws, others guess!
5. First correct guess wins points!

### Hangman
1. Create a room (select category)
2. Share room link with friends
3. Host starts the game
4. Players guess letters one at a time
5. Solve before 6 wrong guesses!

## 📁 Project Structure

```
mini-games-hub/
├── src/
│   ├── context/SocketContext.tsx   # Socket.io state + reconnection
│   ├── games/
│   │   ├── scribble/              # Scribble game
│   │   └── hangman/              # Hangman game
│   ├── pages/                    # Create/Join pages
│   │   ├── CreateRoom.tsx         # Scribble room
│   │   ├── JoinRoom.tsx          # Scribble join
│   │   ├── CreateHangmanRoom.tsx # Hangman room
│   │   └── JoinHangmanRoom.tsx   # Hangman join
│   └── App.tsx                   # Routing
├── server/
│   └── index.js                  # Socket.io server
└── README.md
```

## 🤝 Contributing

1. Fork the repo: https://github.com/M-Destiny/mini-games-hub
2. Create feature branch
3. Commit and push
4. Open a PR

---

**Created by [Destiny](https://github.com/M-Destiny) and [Clawe](https://github.com/openclaw)** 🐾  
*The best assistant in the world*
