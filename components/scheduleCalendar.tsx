import React from 'react';
import { LogOut, User, Calendar, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CalendarioTelefono = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-3 mb-4">
      <Calendar className="w-6 h-6 text-blue-500" />
      <h2 className="text-xl font-semibold">Calendario Telefono</h2>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-600">Contenuto del calendario telefono</p>
    </div>
  </Card>
);

const CalendarioChat = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-3 mb-4">
      <Calendar className="w-6 h-6 text-green-500" />
      <h2 className="text-xl font-semibold">Calendario Chat</h2>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-600">Contenuto del calendario chat</p>
    </div>
  </Card>
);

const AppLayout = () => {
  const username = "Mario Rossi";

  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">{username}</span>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="chat" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Telefono</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="chat" className="w-full">
          <TabsContent value="phone">
            <CalendarioTelefono />
          </TabsContent>
          <TabsContent value="chat">
            <CalendarioChat />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AppLayout;