# Setting up Google OAuth

To enable Google Sign-In for the application and allow users to attach their Gmail accounts via OAuth, you must configure a Google Cloud Project with the appropriate credentials and APIs enabled.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top and select **"New Project"**.
3. Name your project (e.g., "Cold Email Platform") and click **"Create"**.

## 2. Enable the Gmail API
1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**.
2. Search for "Gmail API".
3. Click on the **Gmail API** result and then click **"Enable"**.

## 3. Configure the OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Choose **External** (unless you have a Google Workspace organization and want to restrict it) and click **Create**.
3. Fill in the required application information:
   - App name (e.g., "Cold Email Platform")
   - User support email
   - Developer contact email
4. Click **"Save and Continue"**.
5. Under **Scopes**, click **Add or Remove Scopes**.
   - Add the basic scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   - Search for Gmail scopes and add: `https://mail.google.com/` (This is required for full sending access via the engine)
   - Click **Update**, then **Save and Continue**.
6. Add test users if your app is in "Testing" mode. Only added users will be able to log in. Provide your Gmail or testing accounts.

## 4. Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **"Create Credentials"** at the top and select **"OAuth client ID"**.
3. Set **Application type** to **Web application**.
4. Important: Under **Authorized redirect URIs**, add the following URLs (modify the domain if deployed):
   - `http://localhost:3000/api/auth/google/callback` (for standard application login)
   - `http://localhost:3000/api/gmail/oauth/callback` (for adding a Gmail account in the app)
5. Click **"Create"**.

## 5. Add Credentials to Environment
You will be provided a **Client ID** and a **Client Secret**. Add these to your project's `.env` file!

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Once those variables are set, the "Continue with Google" button on the login page will work, and you will be able to add Gmail accounts using the central app credentials. Users can optionally provide their own custom Client ID/Secret directly in the **Add Gmail Account** form if they prefer to use their own project.
