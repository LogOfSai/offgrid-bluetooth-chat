import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.16bb76a8afda4c5e969a943b4d64e32a',
  appName: 'MeshChat',
  webDir: 'dist',
  server: {
    url: 'https://16bb76a8-afda-4c5e-969a-943b4d64e32a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for devices...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No BLE device found"
      }
    }
  }
};

export default config;