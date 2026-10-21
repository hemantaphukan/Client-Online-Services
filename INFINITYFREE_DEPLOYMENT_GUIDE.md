# 🚀 Complete Deployment Guide: Hosting ServiceMaster Pro on InfinityFree with MySQL & phpMyAdmin

This step-by-step guide walks you through hosting **ServiceMaster Pro** online on [InfinityFree.com](https://www.infinityfree.com) for free with PHP 8.x, Apache, and MySQL database management via **phpMyAdmin**.

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Step 1: Create Your Free InfinityFree Account](#step-1-create-your-free-infinityfree-account)
3. [Step 2: Create MySQL Database in InfinityFree VistaPanel](#step-2-create-mysql-database-in-infinityfree-vistapanel)
4. [Step 3: Import `database.sql` into phpMyAdmin](#step-3-import-databasesql-into-phpmyadmin)
5. [Step 4: Configure `api/config.php`](#step-4-configure-apiconfigphp)
6. [Step 5: Build and Upload Files to `htdocs/`](#step-5-build-and-upload-files-to-htdocs)
7. [Step 6: Verify and Test Your Live Site](#step-6-verify-and-test-your-live-site)
8. [Default Login Credentials](#default-login-credentials)
9. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Architecture Overview

InfinityFree is an Apache + PHP + MySQL hosting provider. Node.js cannot run directly as a background service on InfinityFree. Therefore, ServiceMaster Pro is engineered as a **high-performance hybrid architecture**:

```
+-------------------------------------------------------------+
|                      InfinityFree Server                     |
|                                                             |
|  /htdocs/                                                   |
|    ├── index.html            (Vite React Frontend SPA)      |
|    ├── assets/               (Compiled CSS, JS, SVGs)       |
|    ├── .htaccess             (Apache SPA Routing & Headers) |
|    ├── database.sql          (Full SQL Backup & Schema)     |
|    └── api/                  (Native PHP PDO REST Backend)  |
|          ├── config.php      <- MySQL Database Credentials  |
|          ├── db.php          <- PDO Connection Helper       |
|          ├── test_db.php     <- Connection Diagnostic Tool  |
|          ├── setup.php       <- 1-Click Database Installer  |
|          ├── auth.php        <- Login, Register, Users      |
|          ├── services.php    <- Packages & Attachments      |
|          ├── orders.php      <- Order Processing & Ledger   |
|          ├── wallet.php      <- Top-up & Approvals          |
|          ├── settings.php    <- Company Bank & UPI Settings |
|          └── notifications.php                              |
|                                                             |
|  MySQL Database Server (sqlXXX.infinityfree.com)            |
|    └── phpMyAdmin Management Console                        |
+-------------------------------------------------------------+
```

---

## Step 1: Create Your Free InfinityFree Account

1. Go to **[https://www.infinityfree.com](https://www.infinityfree.com)** and click **Sign Up Now**.
2. Verify your email and log in to the InfinityFree Client Area.
3. Click **+ Create Account**.
4. Choose a **Domain Type**:
   - **Subdomain (Free)**: e.g. `servicemaster.infinityfreeapp.com` or `servicemaster.epizy.com`
   - **Custom Domain**: if you bought a domain from Namecheap/GoDaddy (point nameservers to `ns1.epizy.com` and `ns2.epizy.com`).
5. Choose an Account Label and click **Create Account**.
6. Wait 1-2 minutes until your account status shows **Active**.

---

## Step 2: Create MySQL Database in InfinityFree VistaPanel

1. In your InfinityFree Client Area, click **Control Panel** (or **Manage -> Control Panel**). This opens **VistaPanel / vPanel**.
2. Scroll to the **DATABASES** section and click on **MySQL Databases**.
3. Under **Create New Database**, enter a database name extension, e.g. `servicemaster`.
4. Click **Create Database**.
5. You will now see your MySQL details on that page:
   - **MySQL Hostname**: e.g., `sql308.infinityfree.com` *(Do NOT use `localhost` on InfinityFree; you must use the specific `sqlXXX` host provided)*
   - **MySQL Database Name**: e.g., `epiz_34567890_servicemaster`
   - **MySQL Username**: e.g., `epiz_34567890`
   - **MySQL Password**: This is your **vPanel Account Password** (found under Account Details in the client area).
   - **Port**: `3306`

---

## Step 3: Import `database.sql` into phpMyAdmin

You have two convenient ways to set up the database:

### Option A: Via phpMyAdmin (Recommended)
1. On the **MySQL Databases** page in VistaPanel, find your created database in the list.
2. Click the **phpMyAdmin** button next to it.
3. phpMyAdmin will open in a new browser tab.
4. Click on your database name on the left sidebar (e.g., `epiz_34567890_servicemaster`).
5. Click on the **Import** tab at the top menu.
6. Click **Choose File** and select `database.sql` from the project root or `/public/database.sql`.
7. Keep character set as `utf-8` and format as `SQL`.
8. Scroll down and click **Go** (or **Import**).
9. You will see a green checkmark: *"Import has been successfully finished, 8 tables created."*

### Option B: Via Built-in 1-Click Web Installer
Once your files are uploaded to the server (Step 5), you can simply open:
```
https://your-domain.infinityfreeapp.com/api/setup.php
```
This automatically runs `database.sql` directly on your MySQL database and returns a success message!

---

## Step 4: Configure `api/config.php`

Open `api/config.php` (or edit it directly inside InfinityFree's File Manager) and update lines 24–27 with your credentials from Step 2:

```php
// ==============================================================================
// EDIT THESE 4 VALUES WITH YOUR INFINITYFREE CPANEL / MYSQL CREDENTIALS:
// ==============================================================================
define('DB_HOST', 'sql308.infinityfree.com');           // Your MySQL Hostname
define('DB_NAME', 'epiz_34567890_servicemaster');       // Your Full Database Name
define('DB_USER', 'epiz_34567890');                     // Your MySQL Username
define('DB_PASS', 'YourInfinityFreeVPanelPassword');   // Your vPanel Password
define('DB_PORT', '3306');
define('DB_CHARSET', 'utf8mb4');
```

Save the file.

---

## Step 5: Build and Upload Files to `htdocs/`

### 1. Build the Production Files
Run in your terminal:
```bash
npm run build
```
This compiles the React SPA into the `dist/` folder and automatically bundles:
- `dist/index.html`
- `dist/assets/`
- `dist/.htaccess`
- `dist/database.sql`
- `dist/api/` (all PHP backend endpoints)

### 2. Upload to InfinityFree
You can upload using either **Monsta Online File Manager** or **FileZilla FTP**:

#### Method A: InfinityFree Online File Manager
1. In the InfinityFree Client Area, click **File Manager**.
2. Navigate into the **`htdocs/`** directory.
3. If there is a default `index2.html` or `default.php` file, you can delete it.
4. Upload all files and folders from the `dist/` directory into `htdocs/`.
   *(Make sure `index.html` is directly inside `htdocs/index.html`, not inside `htdocs/dist/index.html`!)*

#### Method B: FileZilla FTP
1. In InfinityFree Client Area, get your **FTP Hostname** (e.g., `ftpupload.net`), **FTP Username**, and **FTP Password**.
2. Connect using FileZilla on port `21`.
3. Open the `htdocs/` folder on the remote server.
4. Drag and drop all files from your local `dist/` directory into `htdocs/`.

---

## Step 6: Verify and Test Your Live Site

1. Open your browser and navigate to:
   ```
   https://your-domain.infinityfreeapp.com/api/test_db.php
   ```
   You should see a JSON response:
   ```json
   {
     "success": true,
     "message": "Database connected and all tables ready!",
     "tables_found": [
       "company_payment_settings",
       "file_attachments",
       "notifications",
       "orders",
       "services",
       "users",
       "wallet_requests",
       "wallet_transactions"
     ],
     "is_schema_ready": true
   }
   ```

2. Now visit your homepage:
   ```
   https://your-domain.infinityfreeapp.com/
   ```
   Your ServiceMaster Pro application is now fully live with real MySQL database persistence!

---

## Default Login Credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| **System Admin** | `admin` | `admin123` | Full access to approvals, wallet requests, orders, and bank settings |
| **Demo Customer** | `john_doe` | `pass123` | Active customer with ₹2,500 pre-loaded wallet balance |
| **Pending Customer** | `sarah_smith` | `pass123` | Demonstrates pending registration workflow |

---

## Troubleshooting & FAQs

### 1. "Page Not Found / 404" when refreshing routes
**Fix**: Ensure `.htaccess` exists in your `htdocs/` directory. On InfinityFree, files starting with a dot might be hidden. Ensure "Show Hidden Files" is turned on in your FTP client.

### 2. "Database connection failed: Connection refused" or "Access denied"
- Check that `DB_HOST` is NOT `localhost`. InfinityFree requires the host format `sqlXXX.infinityfree.com` or `sqlXXX.epizy.com`.
- Check that `DB_USER` matches your vPanel username (starts with `epiz_`).
- Check that `DB_NAME` includes your account prefix (e.g. `epiz_34567890_servicemaster`).
- Verify `DB_PASS` is your InfinityFree vPanel password.

### 3. phpMyAdmin file size upload limit
If your `database.sql` is larger than phpMyAdmin's upload limit, simply open `database.sql` in a text editor, copy all the SQL text, click the **SQL** tab in phpMyAdmin, paste the text into the box, and click **Go**. Or use `/api/setup.php`.

### 4. Free SSL / HTTPS on InfinityFree
InfinityFree provides free SSL certificates:
1. In InfinityFree Client Area, click **Free SSL Certificates**.
2. Click **New SSL Certificate**, enter your domain.
3. Follow the DNS CNAME verification (takes ~5 minutes).
4. Click **Install SSL Certificate Automatically**.
