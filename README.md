# GST Invoice Management System

A professional, full-stack GST Invoice Management System designed for Indian trading businesses. Generate GST-compliant invoices, manage them securely, and download professional PDFs with ease.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js + JWT |
| Database | MongoDB + Mongoose |
| Security | BCrypt (Password Hashing) |
| PDF | PDFKit |

## Features

- **✅ User Authentication**: Secure username-based login and registration (JWT).
- **✅ Private Invoices**: Data isolation ensures users can only see and manage their own invoices.
- **✅ GST-compliant Generation**: Automatic tax calculation for IGST/CGST/SGST.
- **✅ Professional UI**: Dark glassmorphism design with responsive tables and optimized product inputs.
- **✅ Live Preview**: Real-time invoice preview while you type.
- **✅ Professional PDF**: Clean, industry-standard PDF downloads.
- **✅ Indian Business Logic**: Full support for HSN codes, number-to-words (Lakhs/Crores), and state-code mapped tax logic.
- **✅ Smart GSTIN Verification**: In-app GSTIN lookup with CAPTCHA support to auto-fill business details.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Local or Atlas)

### 1. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_random_secret_string
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

The app will be available at **http://localhost:5173**. You'll need to register an account first to access the dashboard.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing session tokens |
| `GST_API_KEY` | No | Optional GST verification API key |

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── index.js           # Express entry
│   │   ├── models/            # User & Invoice schemas
│   │   ├── routes/            # Auth & Invoice API routes
│   │   ├── controllers/       # Auth & Invoice logic
│   │   ├── services/          # GST calc, PDF gen, GSTIN verify
│   │   └── middleware/        # JWT Auth & Error handlers
├── client/
│   ├── src/
│   │   ├── App.jsx            # Protected Routes + Logic
│   │   ├── context/           # AuthContext (JWT management)
│   │   ├── components/        # InvoiceForm, ProductTable, Dashboard
│   │   ├── pages/             # Login, Register, CreateInvoice, List
│   │   └── api/               # Axios with Auth Interceptor
└── README.md
```

## API Endpoints (Protected)

| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | `/api/auth/register` | No | User signup |
| POST | `/api/auth/login` | No | User signin |
| POST | `/api/invoices` | Yes | Create invoice + PDF |
| GET | `/api/invoices` | Yes | List user's invoices |
| GET | `/api/invoices/:id` | Yes | Get single invoice detail |
| PUT | `/api/invoices/:id` | Yes | Update invoice |
| DELETE | `/api/invoices/:id` | Yes | Delete invoice |
| GET | `/api/invoices/:id/pdf` | Yes | Download PDF |
| POST | `/api/gst/verify` | Yes | Verify GSTIN |
