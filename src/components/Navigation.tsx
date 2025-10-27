import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a 
              href="https://www.withfury.ai/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-3"
            >
              <img 
                src="https://www.withfury.ai/fury.webp" 
                alt="FURY Logo" 
                className="h-16 w-auto"
              />
            </a>
          </div>

          {/* Desktop Navigation - Removed per request */}

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-[#2c5aa0] text-[#2c5aa0] hover:bg-[#2c5aa0] hover:text-white font-semibold"
              onClick={() => window.open('https://www.withfury.ai/', '_blank')}
            >
              See the Calendar
            </Button>
            <Button 
              className="bg-[#2c5aa0] hover:bg-[#1e3f73] text-white font-semibold"
              onClick={() => window.open('https://www.withfury.ai/', '_blank')}
            >
              Talk to Expert
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#2c5aa0] transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full border-[#2c5aa0] text-[#2c5aa0] hover:bg-[#2c5aa0] hover:text-white font-semibold"
                  onClick={() => window.open('https://www.withfury.ai/', '_blank')}
                >
                  See the Calendar
                </Button>
                <Button 
                  className="w-full bg-[#2c5aa0] hover:bg-[#1e3f73] text-white font-semibold"
                  onClick={() => window.open('https://www.withfury.ai/', '_blank')}
                >
                  Talk to Expert
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;