# Getting Started Guide

Welcome to the **Deriverse Analytics Dashboard**! This guide is designed for developers who are new to React, Next.js, or Solana. We'll walk you through what this project is made of and how to get it running.

## 🛠️ The Tech Stack (What we use)

### 1. Next.js (The Framework)
We use [Next.js 14](https://nextjs.org/) with the **App Router**.
- **Why?** It handles all the complex setup for a React app (bundling, routing, optimization) out of the box.
- **Key Concept**: Files in `src/app/` automatically become routes. `src/app/page.tsx` is the home page (`/`), and `src/app/journal/page.tsx` is the journal page (`/journal`).

### 2. TypeScript (The Language)
This project is written in **TypeScript** (`.ts` and `.tsx` files).
- **Why?** It's JavaScript with "types". It helps catch bugs like "undefined is not a function" before you even run the code.
- **Key Concept**: You'll see interfaces like `interface Trade { price: number; ... }`. This defines exactly what a "Trade" object must look like.

### 3. Tailwind CSS (The Styling)
We use **Tailwind CSS** for styling.
- **Why?** Instead of writing separate `.css` files, we add classes directly to elements.
- **Example**: `className="flex items-center gap-2"` creates a flexbox container with centered items and a small gap.

### 4. Solana & @deriverse/kit (The Blockchain)
- **Solana**: The high-speed blockchain where Deriverse runs.
- **@deriverse/kit**: A specific library (SDK) provided by Deriverse to interact with their smart contracts. We use this to decode transaction data from the blockchain into readable trade history.

---

## 🚀 Setting Up Your Environment

### Prerequisites
Before you start, make sure you have:
1.  **Node.js**: Download and install [Node.js](https://nodejs.org/) (Version 18 or higher recommended).
2.  **Git**: For downloading ("cloning") the code.
3.  **A Code Editor**: We highly recommend [VS Code](https://code.visualstudio.com/).

### Installation

1.  **Clone the repository** (download the code):
    ```bash
    git clone https://github.com/t0n1zz/deriverse.git
    cd deriverse
    ```

2.  **Install Dependencies** (download the libraries we use):
    ```bash
    npm install
    ```
    *This might take a minute as it downloads Next.js, React, and other tools.*

3.  **Set up Environment Variables**:
    Create a file named `.env.local` in the root folder. Paste the following into it:
    ```env
    NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
    NEXT_PUBLIC_DERIVERSE_PROGRAM_ID=YourDeriverseProgramIdHere
    ```
    *Note: Ask the team for the correct Program ID if you don't have it.*

4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open in Browser**:
    Visit `http://localhost:3000` to see the app!

---

## 🧭 Navigating the Code

- **`src/app`**: The pages of your application.
- **`src/components`**: Reusable UI blocks (like `StatsCard`, `PnLChart`).
- **`src/lib`**: Helper functions and logic (e.g., fetching data from Solana).
- **`src/stores`**: State management (keeping track of trades loaded in memory).
- **`public`**: Static assets like images.

## 🆘 Common Issues

- **"Hydration Error"**: Usually happens if the HTML generated on the server doesn't match the browser. Refreshing often fixes it in dev.
- **"Module not found"**: Did you run `npm install`?
- **Charts look empty**: Ensure you have entered a wallet address that actually has trade history on Deriverse, or use `?mode=mock` in the URL to see sample data.
