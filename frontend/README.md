# NASA Space Biology Engine Frontend

A modern React frontend for the NASA Space Biology Engine, built with TypeScript, Tailwind CSS, and Framer Motion.

## Features

- 🔍 **Semantic Search**: Search through 600+ NASA publications
- 🤖 **AI-Powered Q&A**: Ask questions and get intelligent answers using Google Gemini
- 🕸️ **Knowledge Graph**: Explore research connections with Neo4j
- 📊 **Analytics Dashboard**: View research trends and insights
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Main navigation header
│   └── Sidebar.tsx     # Navigation sidebar
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview and stats
│   ├── Search.tsx      # Publication search
│   ├── QAndA.tsx       # AI question answering
│   ├── KnowledgeGraph.tsx # Graph visualization
│   └── Analytics.tsx   # Research analytics
├── services/           # API integration
│   └── api.ts         # API client and types
├── App.tsx            # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## API Integration

The frontend connects to the FastAPI backend running on port 8000. The API proxy is configured in `vite.config.ts` to forward `/api/*` requests to the backend.

### Available Endpoints

- `GET /api/search` - Search publications
- `GET /api/qa` - Ask questions
- `GET /api/neo4j/stats` - Knowledge graph statistics
- `GET /api/trends` - Publication trends
- `GET /api/knowledge-graph/entities` - Research entities
- `GET /api/knowledge-graph/topics` - Research topics

## Customization

### Colors

The app uses NASA-inspired colors defined in `tailwind.config.js`:

- NASA Blue: `#0B3D91`
- NASA Red: `#FC3D21`
- NASA Gray: `#F5F5F5`

### Components

All components are built with Tailwind CSS and follow a consistent design system. You can customize the styling by modifying the Tailwind classes or extending the theme.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the NASA Space Hacks initiative.
