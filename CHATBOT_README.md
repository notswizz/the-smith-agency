# Smith Agency AI Chatbot

This AI chatbot helps Smith Agency staff manage bookings, clients, and staff members through a conversational interface. The chatbot uses OpenAI's function calling capabilities to interact with your Firebase database.

## Features

- Natural language interface for managing agency data
- Create, read, update, and delete operations for:
  - Bookings
  - Clients
  - Staff
- Intuitive chat interface
- Secure data handling through Firebase

## Setup Instructions

1. **Environment Variables**

   Create a `.env.local` file in the root directory with the following variables:

   ```
   # Firebase configuration (these should match your Firebase project settings)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # OpenAI API key for the chatbot
   OPENAI_API_KEY=your-openai-api-key
   ```

2. **Install Dependencies**

   Make sure all required dependencies are installed:

   ```bash
   npm install
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Access the Chatbot**

   Open your browser and navigate to:

   ```
   http://localhost:3000/chat
   ```

## Usage Examples

The chatbot can understand natural language requests. Here are some example queries:

### Bookings

- "Show me all upcoming bookings"
- "Create a new booking for client ABC on July 15th for the Fashion Week show"
- "Edit booking ABC123 to add staff member John Doe"
- "Delete booking XYZ789"

### Clients

- "List all clients"
- "Create a new client named XYZ Company with email contact@xyz.com"
- "Update client ABC to change their contact info to new-email@abc.com"
- "Show me details for client DEF"

### Staff

- "Show me all staff members"
- "Create a new staff member named Jane Smith with role Photographer"
- "Update John Doe's availability for next week"
- "Show me all makeup artists available on July 20th"

## Architecture

The chatbot consists of the following components:

1. **Chat Interface (`components/chat/ChatInterface.js`)**
   - React component that provides the user interface
   - Handles message display and user input

2. **Chat API Endpoint (`pages/api/chat/index.js`)**
   - Serverless API endpoint that processes chat messages
   - Communicates with OpenAI API
   - Handles function calling for Firebase operations

3. **Chat Page (`pages/chat.js`)**
   - Next.js page that incorporates the chat interface
   - Provides context and usage tips

## Extending the Chatbot

To add more capabilities to the chatbot:

1. Define new functions in the API endpoint
2. Add the corresponding function definitions to the OpenAI function call list
3. Implement the function logic to interact with your Firebase database

## Troubleshooting

- **API Key Issues**: Ensure your OpenAI API key is correctly set in the environment variables
- **Firebase Connection**: Check that your Firebase configuration is correct
- **Function Calling**: If the chatbot doesn't respond correctly, check the function definitions in `pages/api/chat/index.js` 