import Link from 'next/link';
import { Smartphone, Download, Star, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MobileDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Wysa Mobile</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Wysa Mobile App
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get help with everyday tasks from verified people nearby in Mangalore. 
              Now optimized for mobile with a native-like experience.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/mobile">
              <Button className="bg-teal-600 hover:bg-teal-700 px-8 py-3 text-lg">
                <Smartphone className="h-5 w-5 mr-2" />
                Open Mobile App
              </Button>
            </Link>
            <Button variant="outline" className="px-8 py-3 text-lg">
              <Download className="h-5 w-5 mr-2" />
              Add to Home Screen
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">500+</h3>
                <p className="text-gray-600">Active Users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">1,200+</h3>
                <p className="text-gray-600">Tasks Completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
                <p className="text-gray-600">Average Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mobile-First Experience
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Touch-optimized interface
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Bottom navigation for easy access
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Swipe gestures and native feel
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Offline support for basic features
                </li>
              </ul>
            </div>
            
            <div className="text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                All Features Available
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Post and find tasks easily
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Secure payment processing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Real-time chat and notifications
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Complete profile management
                </li>
              </ul>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="bg-gray-900 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Try it on your phone!
            </h3>
            <p className="text-gray-300 mb-6">
              Open this link on your mobile device for the best experience
            </p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <code className="text-sm text-gray-700">
                {typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}/mobile
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold">Wysa</span>
          </div>
          <p className="text-gray-400 mb-6">
            Connecting people in Mangalore for everyday help and companionship
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link href="/safety" className="hover:text-white">Safety</Link>
            <Link href="/become-a-wysa" className="hover:text-white">Become a Wysa</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}