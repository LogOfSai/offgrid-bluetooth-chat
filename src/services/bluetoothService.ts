import { BleClient, BleDevice, ScanMode, numbersToDataView, dataViewToNumbers } from '@capacitor-community/bluetooth-le';
import CryptoJS from 'crypto-js';

export interface ChatDevice {
  id: string;
  name: string;
  rssi: number;
  connected: boolean;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  deviceId: string;
  message: string;
  timestamp: Date;
  sent: boolean;
  encrypted: boolean;
}

class BluetoothService {
  private devices: Map<string, ChatDevice> = new Map();
  private connections: Map<string, BleDevice> = new Map();
  private encryptionKey = 'MeshChat_Secret_Key_2024'; // In production, use proper key exchange
  
  // Custom service UUID for MeshChat
  private readonly SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  private readonly MESSAGE_CHARACTERISTIC_UUID = '87654321-4321-4321-4321-cba987654321';

  async initialize(): Promise<void> {
    try {
      await BleClient.initialize();
      console.log('Bluetooth LE initialized');
    } catch (error) {
      console.error('Failed to initialize Bluetooth LE:', error);
      throw error;
    }
  }

  async startScanning(): Promise<ChatDevice[]> {
    try {
      await BleClient.requestLEScan(
        {
          services: [this.SERVICE_UUID],
          scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
          allowDuplicates: false,
        },
        (result) => {
          const device: ChatDevice = {
            id: result.device.deviceId,
            name: result.device.name || `Device_${result.device.deviceId.slice(-4)}`,
            rssi: result.rssi,
            connected: false,
            lastSeen: new Date(),
          };
          
          this.devices.set(device.id, device);
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await this.stopScanning();
      }, 10000);

      return Array.from(this.devices.values());
    } catch (error) {
      console.error('Failed to start scanning:', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    try {
      await BleClient.stopLEScan();
      console.log('Stopped scanning');
    } catch (error) {
      console.error('Failed to stop scanning:', error);
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      await BleClient.connect(deviceId);
      
      // Discover services
      const services = await BleClient.getServices(deviceId);
      console.log('Discovered services:', services);

      this.connections.set(deviceId, { deviceId } as BleDevice);
      device.connected = true;
      this.devices.set(deviceId, device);

      return true;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      return false;
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      await BleClient.disconnect(deviceId);
      this.connections.delete(deviceId);
      
      const device = this.devices.get(deviceId);
      if (device) {
        device.connected = false;
        this.devices.set(deviceId, device);
      }
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
    }
  }

  async sendMessage(deviceId: string, message: string): Promise<boolean> {
    try {
      if (!this.connections.has(deviceId)) {
        throw new Error('Device not connected');
      }

      // Encrypt the message
      const encryptedMessage = CryptoJS.AES.encrypt(message, this.encryptionKey).toString();
      const messageData = new TextEncoder().encode(encryptedMessage);
      const dataView = numbersToDataView(Array.from(messageData));

      await BleClient.write(
        deviceId,
        this.SERVICE_UUID,
        this.MESSAGE_CHARACTERISTIC_UUID,
        dataView
      );

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  async startMessageListener(deviceId: string, onMessage: (message: ChatMessage) => void): Promise<void> {
    try {
      await BleClient.startNotifications(
        deviceId,
        this.SERVICE_UUID,
        this.MESSAGE_CHARACTERISTIC_UUID,
        (value) => {
          try {
            const messageData = dataViewToNumbers(value);
            const encryptedMessage = new TextDecoder().decode(new Uint8Array(messageData));
            
            // Decrypt the message
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedMessage, this.encryptionKey);
            const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);

            const chatMessage: ChatMessage = {
              id: Date.now().toString(),
              deviceId,
              message: decryptedMessage,
              timestamp: new Date(),
              sent: false,
              encrypted: true,
            };

            onMessage(chatMessage);
          } catch (error) {
            console.error('Failed to process received message:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start message listener:', error);
    }
  }

  async checkContentModeration(message: string): Promise<{ flagged: boolean; reason?: string }> {
    // Simple content moderation - in production, use more sophisticated filtering
    const sensitivePatterns = [
      /\b(?:password|ssn|social security|credit card|bank account)\b/i,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card pattern
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        return {
          flagged: true,
          reason: 'Message contains potentially sensitive information',
        };
      }
    }

    return { flagged: false };
  }

  getConnectedDevices(): ChatDevice[] {
    return Array.from(this.devices.values()).filter(device => device.connected);
  }

  getAllDevices(): ChatDevice[] {
    return Array.from(this.devices.values());
  }

  async cleanup(): Promise<void> {
    try {
      // Disconnect all devices
      for (const deviceId of this.connections.keys()) {
        await this.disconnectFromDevice(deviceId);
      }
      
      // Stop scanning if active
      await this.stopScanning();
      
      console.log('Bluetooth service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const bluetoothService = new BluetoothService();