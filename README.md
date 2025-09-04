# Cocoon Next.js Application

A modern, full-stack web application for managing aluminium profiles and generating quotes for curtain wall systems.

## 🚀 Features

### Core Functionality
- **Profile Management**: Comprehensive aluminium profile database with search and filtering
- **Quote Generation**: Advanced quote generator with profile selection and pricing calculation
- **User Authentication**: Secure Firebase-based authentication system
- **Dashboard Analytics**: Real-time data visualization and reporting
- **Responsive Design**: Mobile-first approach with modern UI components

### Profile Selection System
- **Search & Filter**: Find profiles by name, code, brand, or system type
- **Visual Selection**: Click-to-select interface with profile cards
- **Pricing Integration**: Automatic price calculation based on selected profiles
- **System Type Filtering**: Filter profiles by curtain wall system type

### Quote Generator Features
- **Multi-Item Quotes**: Add multiple items to a single quote
- **Profile Integration**: Select aluminium profiles for each quote item
- **Real-time Pricing**: Automatic cost calculation with material and labor costs
- **Export Functionality**: Export quotes to PDF format
- **Settings Management**: Customizable pricing and calculation parameters

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Firebase Authentication
- **Database**: Firestore (Firebase)
- **Build Tool**: Turbopack
- **Package Manager**: npm

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cocoon-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── analytics/         # Analytics and reporting
│   ├── dashboard/         # Main dashboard
│   ├── login/             # Authentication
│   ├── profile-manager/   # Profile management
│   ├── quote-generator/   # Quote generation
│   ├── quotes/            # Quote management
│   └── settings/          # Application settings
├── components/            # Reusable UI components
│   ├── profile/           # Profile-related components
│   ├── quote/             # Quote-related components
│   └── ui/                # Base UI components (shadcn/ui)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── auth-context.tsx   # Authentication context
│   ├── firebase.ts        # Firebase configuration
│   └── pricing-calculator.ts # Pricing calculations
└── types/                 # TypeScript type definitions
```

## 🔧 Key Components

### Profile Management
- **ProfileManager**: Full-featured profile management interface
- **ProfileSelector**: Dedicated component for profile selection in quotes

### Quote System
- **QuoteItemEditor**: Individual quote item editor with profile selection
- **QuotePreview**: Real-time quote preview with pricing
- **CurtainWallDesigner**: Visual curtain wall design interface

### Authentication
- **ProtectedRoute**: Route protection component
- **AuthContext**: Global authentication state management

## 🎯 Usage

### Profile Selection in Quote Generator
1. Navigate to the Quote Generator page
2. Add a new quote item
3. Click "Select Profile" in the Profile Information section
4. Use the search and filter options to find the desired profile
5. Click on a profile card to select it
6. The profile information and pricing will be automatically applied

### Creating Quotes
1. Start with the Quote Generator
2. Add items with specific dimensions and glass types
3. Select appropriate aluminium profiles for each item
4. Review the real-time pricing calculations
5. Export the final quote as needed

## 🔒 Environment Variables

Make sure to set up your Firebase project and add the required environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ using Next.js, TypeScript, and Firebase**
