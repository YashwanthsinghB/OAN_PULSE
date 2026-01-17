# OAN Pulse - Frontend

Time tracking application frontend built with React.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## API Configuration

The API base URL is configured in `.env`:

```
VITE_API_BASE_URL=https://oracleapex.com/ords/oan_trial
```

## Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── services/       # API service functions
└── utils/          # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
