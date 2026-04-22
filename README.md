# HIVIEX - Autonomous Creation Ecosystem

A modern, interactive website built with Next.js 14, TypeScript, React Three Fiber, and Tailwind CSS. Features 3D animations, smooth interactions, and a beautiful Apple-inspired design.

## 🚀 Features

- **3D Background**: Interactive 3D scene with animated sphere and floating particles
- **Custom Cursor**: Smooth, theme-aware cursor that follows mouse movement
- **Theme Toggle**: Light and dark mode with smooth transitions
- **Responsive Design**: Fully responsive layout that works on all devices
- **Smooth Animations**: Framer Motion animations throughout
- **Modern UI**: Clean, minimal design inspired by Apple and Vercel

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: React Three Fiber + Three.js
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📁 Project Structure

```
hiviex/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── privacy/            # Privacy policy page
│   ├── terms/              # Terms & conditions page
│   └── cookies/            # Cookie policy page
├── components/             # React components
│   ├── Hero.tsx           # Hero section with main content
│   ├── Scene3D.tsx        # 3D background scene
│   ├── Cursor.tsx         # Custom cursor component
│   ├── Header.tsx          # Navigation header
│   ├── ContentSection.tsx # Features section
│   ├── AboutSection.tsx    # About section
│   ├── PricingSection.tsx  # Pricing plans
│   └── Footer.tsx         # Site footer
├── hooks/                  # Custom React hooks
│   ├── useThemeDetection.ts    # Theme detection hook
│   ├── useMousePosition.ts     # Mouse position tracking
│   ├── useElementMouse3D.ts    # 3D mouse interaction
│   └── useScrollVisibility.ts  # Scroll-based visibility
├── lib/                    # Utilities and constants
│   ├── constants.ts       # Application constants
│   └── types/             # TypeScript type definitions
│       └── index.ts
└── contexts/               # React contexts
    └── ThemeContext.tsx    # Theme management context
```

## 🏗️ Code Quality & Best Practices

This project follows clean code principles and best practices:

### ✅ Clean Code Principles
- **Single Responsibility**: Each component has one clear purpose
- **DRY (Don't Repeat Yourself)**: Reusable hooks and utilities
- **Meaningful Names**: Clear, descriptive variable and function names
- **Small Functions**: Functions are focused and do one thing well
- **Separation of Concerns**: Logic separated from presentation

### 📝 Code Organization
- **Constants**: All magic numbers and configuration values in `lib/constants.ts`
- **Custom Hooks**: Reusable logic extracted into custom hooks
- **TypeScript**: Strong typing throughout the codebase
- **Documentation**: JSDoc comments for all major functions and components

### 🎯 Best Practices Implemented
- Type-safe code with TypeScript
- Proper error handling
- Performance optimizations (memoization, requestAnimationFrame)
- Accessibility considerations (aria-labels, semantic HTML)
- Responsive design patterns
- Clean component structure

## 🚦 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Key Dependencies

- `next`: ^14.2.0
- `react`: ^18.2.0
- `typescript`: ^5.3.3
- `@react-three/fiber`: ^8.15.19
- `@react-three/drei`: ^9.104.3
- `three`: ^0.168.0
- `framer-motion`: ^10.16.16
- `tailwindcss`: ^3.4.1

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize color scheme.

### 3D Scene Settings
Modify constants in `lib/constants.ts` under `SCENE_3D` section.

### Animation Timing
Adjust animation durations in `lib/constants.ts` under `ANIMATION_DURATION`.

## 📚 Documentação (SaaS, dashboard, ops)

Toda a documentação técnica vive em **[docs/README.md](./docs/README.md)** (índice em português): setup, troubleshooting, auth, integrações sociais, workers e vídeo.

Comandos úteis:

```bash
npm run ci       # typecheck + lint + test + build
npm run worker   # processos em fila (Redis)
```

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contributions are not accepted at this time.

---

Built with ❤️ using modern web technologies
