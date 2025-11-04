# BlogPad - Professional Blogging Platform

A modern, feature-rich blogging platform built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication** - Secure login/register system
- **Rich Text Editor** - Advanced blog post editor with formatting
- **AI Writing Assistant** - OpenAI-powered writing help
- **Subscription Plans** - Premium and Business tiers
- **Social Features** - Follow bloggers, like posts, comments
- **Gamification** - Writing streaks, achievements, XP system
- **Typing Practice** - Built-in typing speed trainer
- **Dark Mode** - Toggle between light and dark themes
- **Mobile Responsive** - Works on all devices
- **Payment Integration** - UPI and card payment support

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Frontend:** HTML5, CSS3, JavaScript
- **Authentication:** Passport.js, bcrypt
- **AI Integration:** OpenAI API
- **Deployment:** Vercel/Heroku ready

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blogpad.git
cd blogpad
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
OPENAI_API_KEY=your_openai_api_key
PORT=5000
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

5. Open `http://localhost:5000` in your browser

## 🌐 Live Demo

Visit: [Your Live URL Here]

## 📱 Screenshots

[Add screenshots of your application here]

## 🔧 Configuration

### MongoDB Setup
1. Create MongoDB Atlas account
2. Create new cluster
3. Get connection string
4. Add to `.env` file

### OpenAI Setup
1. Get API key from OpenAI
2. Add to `.env` file
3. AI features will be enabled

## 🚀 Deployment

### Vercel
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Heroku
1. Create new Heroku app
2. Connect GitHub repository
3. Add environment variables
4. Deploy

## 📄 API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /api/posts` - Get user posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/public-posts` - Get public posts
- `POST /api/process-payment` - Process payments

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- OpenAI for AI writing assistance
- MongoDB Atlas for database hosting
- Font Awesome for icons
- All contributors and users

## 📊 Project Stats

- **Language:** JavaScript
- **Framework:** Express.js
- **Database:** MongoDB
- **Lines of Code:** 10,000+
- **Features:** 15+

---

⭐ Star this repository if you found it helpful!