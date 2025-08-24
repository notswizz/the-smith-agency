import Head from 'next/head';
import ChatInterface from '@/components/chat/ChatInterface';
import DashboardLayout from '@/components/ui/DashboardLayout';

export default function ChatbotPage() {
  return (
    <>
      <Head>
        <title>AI Assistant - Smith Agency</title>
        <meta name="description" content="AI Assistant for Smith Agency - Manage bookings, clients, staff and shows with natural language" />
      </Head>
      
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6">
       
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ChatInterface />
            </div>
            
           
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}