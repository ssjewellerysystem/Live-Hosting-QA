# BharatBasket Local Run Guide

Follow these instructions to manually start and run the BharatBasket application (both Backend and Frontend) on your system.

---

## Prerequisites

Before starting, ensure you have:
1. **Python 3**: Installed and available in your environment.
2. **Node.js & npm**: Installed to run the frontend Vite server.
3. **MySQL**: Running locally with the `bharatbasket` database configured.

---

## 1. Run the Backend Server (Flask)

1. Open a new terminal window.
2. Navigate to the project root directory:
   ```bash
   cd /home/irshad-mohammad/Videos/BB
   ```
3. Activate the Python virtual environment:
   ```bash
   source venv/bin/activate
   ```
4. Start the backend:
   ```bash
   python -m backend.app
   ```
   *The backend will run on **`http://localhost:5000`**.*

---

## 2. Run the Frontend Server (Vite)

1. Open a second terminal window (keep the backend terminal open and running).
2. Navigate to the frontend directory:
   ```bash
   cd /home/irshad-mohammad/Videos/BB/frontend
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on **`http://localhost:5173`**.*

---

## Troubleshooting: "Address already in use" (Port 5000/5173)

If you get an error stating that port `5000` or `5173` is already in use, run the following commands in your terminal to stop the active processes:

* **To free port 5000 (Backend)**:
  ```bash
  kill -9 $(lsof -t -i:5000)
  ```
* **To free port 5173 (Frontend)**:
  ```bash
  kill -9 $(lsof -t -i:5173)
  ```

Once cleared, you can start the servers using the commands above.

---

## Application Access & Credentials

* **Web Application URL**: [http://localhost:5173](http://localhost:5173)
* **Backend API URL**: [http://localhost:5000](http://localhost:5000)
* **Admin Dashboard Login**:
  * **Email**: `admin@bharatbasket.com`
  * **Password**: `Admin@123`
