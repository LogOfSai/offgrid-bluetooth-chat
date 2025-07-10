import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2, Smartphone, Signal } from 'lucide-react';
import { ChatDevice, bluetoothService } from '@/services/bluetoothService';
import { useToast } from '@/hooks/use-toast';

interface DeviceScannerProps {
  onDeviceConnect: (device: ChatDevice) => void;
}

export function DeviceScanner({ onDeviceConnect }: DeviceScannerProps) {
  const [devices, setDevices] = useState<ChatDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeBluetooth();
    return () => {
      bluetoothService.cleanup();
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      await bluetoothService.initialize();
      toast({
        title: "Bluetooth Ready",
        description: "Bluetooth LE has been initialized successfully.",
      });
    } catch (error) {
      toast({
        title: "Bluetooth Error",
        description: "Failed to initialize Bluetooth LE. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setDevices([]);
      
      toast({
        title: "Scanning Started",
        description: "Looking for nearby MeshChat users...",
      });

      const foundDevices = await bluetoothService.startScanning();
      setDevices(foundDevices);
      
      // Update devices every second while scanning
      const interval = setInterval(() => {
        const allDevices = bluetoothService.getAllDevices();
        setDevices([...allDevices]);
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        setScanning(false);
        toast({
          title: "Scan Complete",
          description: `Found ${foundDevices.length} nearby devices.`,
        });
      }, 10000);

    } catch (error) {
      setScanning(false);
      toast({
        title: "Scan Failed",
        description: "Failed to scan for devices. Please try again.",
        variant: "destructive",
      });
    }
  };

  const connectToDevice = async (device: ChatDevice) => {
    try {
      setConnecting(device.id);
      
      const success = await bluetoothService.connectToDevice(device.id);
      
      if (success) {
        toast({
          title: "Connected",
          description: `Successfully connected to ${device.name}`,
        });
        onDeviceConnect({ ...device, connected: true });
        
        // Update the device in our list
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, connected: true } : d
        ));
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${device.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const getSignalStrengthIcon = (rssi: number) => {
    if (rssi > -50) return <Signal className="h-4 w-4 text-success" />;
    if (rssi > -70) return <Signal className="h-4 w-4 text-warning" />;
    return <Signal className="h-4 w-4 text-muted-foreground" />;
  };

  const getSignalStrengthText = (rssi: number) => {
    if (rssi > -50) return 'Excellent';
    if (rssi > -70) return 'Good';
    if (rssi > -90) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-glow mb-4">
          <Wifi className="h-10 w-10 text-primary-foreground" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            MeshChat Discovery
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Find and connect to nearby MeshChat users without internet connectivity
          </p>
        </div>

        <Button
          variant="glow"
          size="lg"
          onClick={startScanning}
          disabled={scanning}
          className="min-w-[200px]"
        >
          {scanning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-5 w-5" />
              Start Scanning
            </>
          )}
        </Button>
      </div>

      {devices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">
            Discovered Devices ({devices.length})
          </h2>
          
          <div className="grid gap-4">
            {devices.map((device) => (
              <Card key={device.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{device.name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {getSignalStrengthIcon(device.rssi)}
                          <span>{getSignalStrengthText(device.rssi)}</span>
                          <span>•</span>
                          <span>{device.rssi} dBm</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {device.lastSeen.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {device.connected ? (
                        <Badge variant="outline" className="border-success text-success">
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectToDevice(device)}
                          disabled={connecting === device.id}
                        >
                          {connecting === device.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!scanning && devices.length === 0 && (
        <Card className="bg-gradient-card border-border/50 text-center">
          <CardContent className="p-8">
            <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Devices Found</h3>
            <p className="text-muted-foreground">
              Make sure other MeshChat users are nearby and have their Bluetooth enabled.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}