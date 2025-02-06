# Brilliant Plus Ambassador Portal

This repository contains the frontend code for the Brilliant Plus Ambassador signup portal.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/AlarmclockUSA/BplusAm.git
cd BplusAm
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API credentials in `.env`

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm start
```

## Environment Variables

The following environment variables are required:

- `API_PERSON_IDENTIFIER`: Your API username
- `API_PERSON_TYPE_ID`: Your person type ID
- `API_ACCESS_TOKEN`: Your API access token
- `API_REFRESH_TOKEN`: Your API refresh token
- `API_TOKEN_EXPIRES`: Access token expiry date
- `API_REFRESH_TOKEN_EXPIRES`: Refresh token expiry date

## API Authentication

The application uses token-based authentication. The authentication flow is as follows:

1. Initial authentication using person identifier and type ID
2. Automatic token refresh when the access token is about to expire
3. Secure storage of tokens in memory (not persisted)

## Security Notes

- Never commit the `.env` file to version control
- Keep your API credentials secure
- The application uses secure headers and sanitizes sensitive data in logs
- SSN information is handled securely and never logged

## Development

- The application uses ES6 modules
- Authentication is handled in `auth.js`
- Main application logic is in `script.js`
- Styles are in `styles.css`

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved 