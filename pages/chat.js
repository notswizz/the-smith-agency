import Head from 'next/head';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>Smith AI Assistant</title>
        <meta name="description" content="AI Assistant for Smith Agency - Manage bookings, clients and staff" />
      </Head>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ChatInterface />
      </div>
    </>
  );
} 