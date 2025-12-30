# Vercel S3 API

Framework-agnostic Vercel API routes for authentication and S3 file storage.

## Why This Approach?

This solution offers a **vendor-independent, framework-agnostic backend** that's perfect for smaller personal and small-business sites. Here's what makes it special:

- **🔄 No Vendor Lock-in**: Works with any S3-compatible storage (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, etc.). Switch providers anytime without changing your code.

- **🎨 Framework Freedom**: Use any frontend framework (Next.js, Vue, React, Svelte, vanilla JS) or switch between them. The backend is completely framework-agnostic.

- **💰 Cost-Effective**: Pay-as-you-go storage pricing. No database server costs or complex infrastructure to manage.

- **📦 Simple & Portable**: No database setup, migrations, or ORMs. Your data is just files in S3, making backup and migration straightforward.

- **🔒 Data Ownership**: Your data lives in your S3 bucket. You control it, can export it easily, and aren't tied to proprietary database services.

- **🚀 Perfect for Small Sites**: Ideal for personal sites, small business websites, prototypes, and projects where simplicity and flexibility matter more than complex querying capabilities.

This approach solves storage and simple database needs while giving you the freedom to choose your storage provider and frontend framework independently.

## Features

- ✅ Login endpoint with JWT authentication
- ✅ Save JSON data and base-64 images to S3-compatible storage
- ✅ User-specific folders (`/{username}/data.json` and `/{username}/img/{filename}`)
- ✅ Vercel-styled login page (light mode)
- ✅ Works with any framework (Next.js, Vue, vanilla, etc.)

## Quick Start

Use degit to quickly get started:

```bash
npx degit dashpilot/s3-universal-backend my-s3-api
cd my-s3-api
npm install
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` (for local development) or configure in Vercel dashboard:

```bash
cp .env.example .env.local
```

Required environment variables:

- `LOGIN_USERNAME` - Username for login
- `LOGIN_PASSWORD` - Password for login
- `JWT_SECRET` - Secret key for JWT tokens (use a strong random string in production)
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_REGION` - AWS region (default: us-east-1)
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name
- `S3_FORCE_PATH_STYLE` - Set to 'true' for S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
- `LIVE_URL` - (Optional) Base URL for constructing public image URLs. Example: `https://your-bucket.s3.amazonaws.com` or `https://pub-xxx.r2.cloudflarestorage.com`

### 3. Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## API Endpoints

### POST `/api/login`

Authenticates a user and returns a JWT token.

**Request:**

```json
{
	"username": "admin",
	"password": "password"
}
```

**Response:**

```json
{
	"success": true,
	"message": "Login successful",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The token is also set as an HTTP-only cookie named `auth_token`.

### GET `/api/verify`

Checks if the user is currently authenticated. Useful for checking login status on page load.

**Headers:**

- `Cookie: auth_token=<token>` (automatically sent by browser)
- OR `Authorization: Bearer <token>`

**Response (authenticated):**

```json
{
	"authenticated": true,
	"username": "admin"
}
```

**Response (not authenticated):**

```json
{
	"authenticated": false,
	"error": "Not authenticated"
}
```

### POST `/api/logout`

Logs out the current user by clearing the authentication cookie.

**Response:**

```json
{
	"success": true,
	"message": "Logged out successfully"
}
```

### POST `/api/save`

Saves JSON data and/or base-64 encoded images to S3 storage. Requires authentication.

**Headers:**

- `Cookie: auth_token=<token>` (automatically sent by browser)
- OR `Authorization: Bearer <token>`

**Request:**

```json
{
	"data": { "key": "value", "nested": { "data": 123 } },
	"image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

Both `data` and `image` are optional, but at least one must be provided. The backend will automatically generate a random filename for images.

**Response:**

```json
{
	"success": true,
	"message": "Data saved successfully",
	"results": {
		"json": {
			"key": "username/data.json",
			"backup": "username/data.json.backup.2025-01-15_10-30-45",
			"saved": true
		},
		"image": {
			"key": "username/img/abc123xyz456.png",
			"filename": "abc123xyz456.png",
			"url": "https://your-bucket.s3.amazonaws.com/username/img/abc123xyz456.png",
			"saved": true
		}
	}
}
```

**Notes:**

- The `url` field in the image result is only included if `LIVE_URL` is configured in your environment variables.
- JSON data is automatically backed up on every save with a timestamp (e.g., `data.json.backup.2025-01-15_10-30-45`).
- Backups older than 30 days are automatically cleaned up to prevent excessive storage usage.

## File Structure

Files are saved to S3 in the following structure:

```
bucket/
  ├── {username}/
  │   ├── data.json                    # Current JSON data
  │   ├── data.json.backup.2025-01-15_10-30-45  # Timestamped backups
  │   ├── data.json.backup.2025-01-14_15-20-10  # (auto-cleaned after 30 days)
  │   └── img/
  │       └── {filename}               # Images
```

## Usage Examples

### Login (JavaScript)

```javascript
const response = await fetch('/api/login', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		username: 'admin',
		password: 'password'
	})
});

const { token } = await response.json();
// Token is also stored in cookie automatically
```

### Save Data (JavaScript)

```javascript
// Save JSON data
const response = await fetch('/api/save', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	credentials: 'include', // Include cookies
	body: JSON.stringify({
		data: { message: 'Hello World', timestamp: Date.now() }
	})
});

// Save image (filename is automatically generated)
const response = await fetch('/api/save', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	credentials: 'include',
	body: JSON.stringify({
		image: canvas.toDataURL('image/png') // Base-64 encoded image
	})
});

// Response includes the generated filename and URL
const { results } = await response.json();
console.log('Image saved:', results.image.filename);
console.log('Image URL:', results.image.url);

// Save both
const response = await fetch('/api/save', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	credentials: 'include',
	body: JSON.stringify({
		data: { metadata: 'value' },
		image: imageDataUrl
	})
});
```

### Using Authorization Header (alternative)

```javascript
const response = await fetch('/api/save', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	},
	body: JSON.stringify({
		data: { message: 'Hello' }
	})
});
```

## Login Page

A pre-styled login page is available at `/login.html` (accessible via `/login` rewrite). The HTML files are located in the `public/` directory and are automatically served by Vercel as static files.

You can:

1. Access it directly at `/login.html`
2. Access it via the rewrite route `/login`
3. Use it as a template for your framework's routing

## Example File

A complete working example (`example-save.html`) demonstrates the full flow:

1. Login with username/password
2. Save JSON data to S3
3. Upload and save images to S3
4. View API responses

To test the complete flow:

1. Open `/example-save.html` or `/example` in your browser after deployment
2. Log in with your credentials
3. Enter JSON data (or click "Load JSON Example") and/or upload an image
4. Click "Save to S3" to save the data

**Image Upload Features:**

- Select images from your computer using file input
- Image preview before uploading
- Supports PNG, JPG, GIF, WebP, and SVG formats
- Random filename generation on the backend
- Full image URL returned in response (if LIVE_URL is configured)
- Can save both JSON data and images in a single request

This example shows exactly how to use the API endpoints with vanilla JavaScript. The example file is located in the `public/` directory.

## S3-Compatible Services

This API works with:

- AWS S3
- **Cloudflare R2** (see configuration below)
- DigitalOcean Spaces
- MinIO
- Wasabi
- Backblaze B2
- Any S3-compatible storage service

For S3-compatible services, set `S3_FORCE_PATH_STYLE=true` in your environment variables.

### Cloudflare R2 Configuration

For Cloudflare R2, you have two options:

**Option 1: Use R2_ACCOUNT_ID (Recommended)**

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_BUCKET=your-bucket-name
S3_REGION=auto
# R2_JURISDICTION=eu  # Optional: 'eu' for EU jurisdiction, 'fedramp' for FedRAMP
```

The endpoint will be automatically constructed as: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

**Option 2: Set S3_ENDPOINT manually**

```env
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-r2-access-key-id
S3_SECRET_ACCESS_KEY=your-r2-secret-access-key
S3_BUCKET=your-bucket-name
S3_REGION=auto
S3_FORCE_PATH_STYLE=true
```

**For EU or FedRAMP jurisdictions:**

- EU: `https://your-account-id.eu.r2.cloudflarestorage.com`
- FedRAMP: `https://your-account-id.fedramp.r2.cloudflarestorage.com`

**Notes:**

- R2 requires `forcePathStyle=true` (automatically set when using `R2_ACCOUNT_ID`)
- R2 region should be set to `auto`
- Get your Account ID from the Cloudflare dashboard → R2 section
- Create API tokens in Cloudflare dashboard → R2 → Manage R2 API Tokens

## Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Use strong passwords for `LOGIN_PASSWORD`
- Consider implementing rate limiting for production
- The JWT token expires after 7 days (configurable in `api/login.js`)
- Tokens are stored in HTTP-only cookies to prevent XSS attacks

## License

MIT
