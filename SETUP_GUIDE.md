- Install **Python 3.11 or 3.12**.
- Install **Node.js (LTS version)**.
- Open the project folder in **VS Code** or **Cursor**.

- Open **Terminal 1** and run:

  ```bash
  cd backend
  ```

- *(First time only)* Create a virtual environment:

  ```bash
  python -m venv .venv
  ```

- Activate the virtual environment:

  ```powershell
  .\.venv\Scripts\activate
  ```

- *(First time only)* Install backend dependencies:

  ```bash
  pip install -r requirements.txt
  ```

- *(First time only)* Create the environment file:

  ```powershell
  copy .env.example .env
  ```

- Start the backend server:

  ```bash
  uvicorn app:app --reload --port 8000
  ```

- Open **Terminal 2** and run:

  ```bash
  cd frontend
  ```

- *(First time only)* Install frontend dependencies:

  ```bash
  npm install
  ```

- Start the frontend:

  ```bash
  npm run dev
  ```

- Open your browser and visit:

  ```
  http://localhost:5173
  ```

- To stop the application, press **Ctrl + C** in both terminals.

> **Note:** The setup steps marked **(First time only)** are only required once. For future runs, simply activate the backend virtual environment, start the backend server, and run `npm run dev` in the frontend.

---

**Deploying online?** See **[DEPLOY.md](./DEPLOY.md)** for Vercel (frontend) + Render (backend).
