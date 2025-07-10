import { useState } from 'react';
import { DeviceScanner } from '@/components/DeviceScanner';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatDevice } from '@/services/bluetoothService';

const Index = () => {
  const [selectedDevice, setSelectedDevice] = useState<ChatDevice | null>(null);

  const handleDeviceConnect = (device: ChatDevice) => {
    setSelectedDevice(device);
  };

  const handleBackToScanner = () => {
    setSelectedDevice(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {selectedDevice ? (
        <ChatInterface 
          device={selectedDevice} 
          onBack={handleBackToScanner}
        />
      ) : (
        <DeviceScanner onDeviceConnect={handleDeviceConnect} />
      )}
    </div>
  );
};

export default Index;
