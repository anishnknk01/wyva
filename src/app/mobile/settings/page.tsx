"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  User, 
  Shield, 
  CreditCard,
  Smartphone,
  Globe,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { MobileLayout } from '@/components/mobile/mobile-layout';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationSettings } from '@/components/mobile/notification-settings';
import { CacheStatusCard } from '@/components/mobile/offline-banner';
import { withAuth } from '@/lib/auth-guard';

type SettingsSection = 'main' | 'notifications' | 'account' | 'privacy' | 'about';

const settingsItems = [
  {
    id: 'notifications' as const,
    icon: Bell,
    label: 'Notifications',
    description: 'Push, email, and sound settings',
  },
  {
    id: 'account' as const,
    icon: User,
    label: 'Account',
    description: 'Profile, email, and password',
  },
  {
    id: 'privacy' as const,
    icon: Shield,
    label: 'Privacy & Security',
    description: 'Data and security settings',
  },
  {
    id: 'about' as const,
    icon: HelpCircle,
    label: 'About',
    description: 'App version and help',
  },
];

function MobileSettingsPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');

  const handleBack = () => {
    if (currentSection === 'main') {
      router.back();
    } else {
      setCurrentSection('main');
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'notifications':
        return <NotificationSettings />;
      
      case 'account':
        return (
          <div className="p-4 space-y-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/mobile/profile/edit')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Edit profile</p>
                    <p className="text-sm text-gray-600">Name, photo, phone, and bio</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'privacy':
        return (
          <div className="p-4 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Privacy & Security</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Data Collection</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      We collect data to provide and improve our services. This includes:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Profile information you provide</li>
                      <li>• Task and message data</li>
                      <li>• Usage analytics</li>
                      <li>• Device information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Data Security</h4>
                    <p className="text-sm text-gray-600">
                      Your data is encrypted in transit and at rest. We use industry-standard security practices to protect your information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'about':
        return (
          <div className="p-4 space-y-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Wysa Mobile</h3>
                <p className="text-gray-600 mb-4">Version 1.0.0</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Your companion assistance platform</p>
                  <p>Made with ❤️ in Mangalore, India</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Help & Support</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">FAQ</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Contact Support</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Terms of Service</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Privacy Policy</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
            
            {/* Cache Status for debugging */}
            <CacheStatusCard />
          </div>
        );
      
      default:
        return (
          <div className="p-4 space-y-4">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCurrentSection(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (currentSection) {
      case 'notifications':
        return 'Notifications';
      case 'account':
        return 'Account';
      case 'privacy':
        return 'Privacy & Security';
      case 'about':
        return 'About';
      default:
        return 'Settings';
    }
  };

  return (
    <MobileLayout 
      title={getTitle()}
      showBack={true}
      onBack={handleBack}
    >
      {renderContent()}
    </MobileLayout>
  );
}

export default withAuth(MobileSettingsPage);