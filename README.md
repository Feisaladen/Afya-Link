# Afya-Link 🏥

**Your Personal Health Assistant - Powered by AI, Works Offline**

Afya-Link is an intelligent health assistant web application that helps you understand your symptoms, identify possible causes, and discover potential remedies. With advanced AI capabilities and offline functionality, healthcare guidance is always within reach.

## 🌐 Live Demo

**[Try Afya-Link Now →](https://afya-link-health.netlify.app/)**

## ✨ Features

### 🔍 Symptom Analysis
- Input your symptoms and receive detailed analysis
- Multi-symptom tracking and correlation
- Severity assessment and timeline tracking

### 🤖 AI-Powered Insights
- Advanced AI diagnostic assistance
- Personalized health recommendations
- Natural language interaction for easy communication

### 💊 Remedy Suggestions
- Evidence-based remedy recommendations
- Home care tips and lifestyle modifications
- When to seek professional medical help

### 📴 Offline Capability
- Full functionality without internet connection
- Local data storage and processing
- Sync when connection is restored

### 🔒 Privacy First
- Your health data stays on your device
- No unnecessary data collection
- HIPAA-compliant design principles

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Supabase account ([Sign up here](https://supabase.com))
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/Feisaladen/afya-link.git

# Navigate to project directory
cd afya-link

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Application Settings
SESSION_SECRET=your_random_session_secret
```

### Running the Application

```bash
# Start development server
npm run dev

# Start production server
npm start
```

Visit `http://localhost:3000` to see the application running.

### Building for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 📦 Project Structure

```
afya-link/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── symptoms.js
│   │   └── offline.js
│   └── sw.js (Service Worker)
├── server/
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── symptoms.js
│   │   └── ai.js
│   ├── middleware/
│   │   └── auth.js
│   └── services/
│       ├── gemini.js
│       └── supabase.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 📱 Usage

1. **Sign Up / Login**: Create an account using Supabase authentication
2. **Enter Your Symptoms**: Describe what you're experiencing in the symptom checker
3. **Get AI Analysis**: Gemini AI provides intelligent analysis of your symptoms
4. **Review Causes**: Understand possible conditions related to your symptoms
5. **Explore Remedies**: Discover home remedies and when to seek medical care
6. **Track Progress**: Monitor your symptoms over time (saved to Supabase)
7. **Offline Access**: Continue using core features even without internet

## 🔧 Configuration

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create the following tables in your Supabase database:

```sql
-- Users symptoms history
CREATE TABLE symptoms_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  ai_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  language VARCHAR(10) DEFAULT 'en',
  notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE symptoms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own symptoms" ON symptoms_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" ON symptoms_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

### Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add the key to your `.env` file

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, Vanilla JavaScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Offline Storage**: json file
- **PWA**: Progressive Web App capabilities

## ⚠️ Medical Disclaimer

**IMPORTANT**: Afya-Link is designed to provide health information and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns. In case of emergency, call your local emergency services immediately.

This application:
- Does NOT provide medical diagnoses
- Should NOT be used for medical emergencies
- Is NOT a substitute for professional healthcare
- Provides general information only


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Feisal yakub** - *Initial work* - [Github](https://github.com/Feisaladen)

## 🙏 Acknowledgments

- Google Gemini AI for intelligent health analysis
- Supabase for authentication and database services
- Medical databases and health information providers
- Tailwind CSS for beautiful UI components
- Open-source community
- Healthcare professionals who provided guidance
- All contributors who help improve Afya-Link

## 📞 Support

For support, email feisaladen32@gmail.com





Made with ❤️ for better healthcare accessibility

**Remember**: Your health matters. Always prioritize professional medical care when needed.
