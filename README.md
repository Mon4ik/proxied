# Proxied
Simple HTTP Proxy

## Setup
1. Clone repository
2. Install dependencies:
   ```bash
   npm i
   ```
3. Run:
   ```bash
   npm start
   ```

## Settings
### Authorization (`auth` field):
- `"type"`:
  + `"custom"`
  + `"creds"`
- `"data"` **(WITH `"custom"` TYPE)**
  + Token for authorization
  + Usage:
    - URL: `http://<token>@<ip>:<port>`
    - Header: `Proxy-Authorization: <token>`
- `"username"` **(WITH `"auth"` TYPE)**
- `"password"` **(WITH `"auth"` TYPE)**
  + Credentials for authorization
  + Usage:
    - URL: `http://<username>:<password>@<ip>:<port>`
    - Header: `Proxy-Authorization: <username:password in base64>`