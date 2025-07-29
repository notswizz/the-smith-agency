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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600 mt-2">
              Manage your Smith Agency data using natural language. Ask questions, create records, and get insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ChatInterface />
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Commands</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700">View Data</h4>
                    <p className="text-gray-500">"Show me all bookings"</p>
                    <p className="text-gray-500">"List staff members"</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Create Records</h4>
                    <p className="text-gray-500">"Create a new booking for..."</p>
                    <p className="text-gray-500">"Add a staff member named..."</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Search & Filter</h4>
                    <p className="text-gray-500">"Find bookings for this week"</p>
                    <p className="text-gray-500">"Show pending bookings"</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Updates</h4>
                    <p className="text-gray-500">"Update booking status to confirmed"</p>
                    <p className="text-gray-500">"Change the show date to..."</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be specific with dates and names</li>
                  <li>• Ask for summaries and insights</li>
                  <li>• Use natural language - no need for commands</li>
                  <li>• Ask "What can you help me with?" for more ideas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}