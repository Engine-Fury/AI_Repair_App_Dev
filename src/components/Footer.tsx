import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-start mb-6">
              <img 
                src="https://www.withfury.ai/fury.webp" 
                alt="FURY Logo" 
                className="h-20 w-auto"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              AI Vehicle Lifecycle Calendar for smarter fleet decisions. A live month-by-month plan 
              for every vehicle that times replace, repair, redeploy, or sell to cut cost and lift uptime.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-[#2c5aa0]" />
                <span>contact@withfury.ai</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Phone className="h-4 w-4 text-[#2c5aa0]" />
                <span>Talk to a Fleet Engineer</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-[#2c5aa0]" />
                <span>AI-Powered Fleet Intelligence</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Features</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm group">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                    <span>AI Calendar Brain</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-5 mt-1">Rolling 60-month plan per VIN</div>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm group">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                    <span>Vehicle Cost Stories</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-5 mt-1">Plain-language 12-month outlook</div>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm group">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                    <span>Instant Policy Builder</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-5 mt-1">Business rules & audit trail</div>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm group">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                    <span>AI Redlining</span>
                  </div>
                  <div className="text-xs text-gray-400 ml-5 mt-1">Smart PO analysis & validation</div>
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2 group">
                  <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                  <span>About FURY</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2 group">
                  <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                  <span>Our Customers</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2 group">
                  <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2 group">
                  <ArrowRight className="h-3 w-3 text-[#2c5aa0] group-hover:translate-x-1 transition-transform" />
                  <span>Careers</span>
                </a>
              </li>
            </ul>
            
            <h4 className="text-sm font-semibold text-white mt-8 mb-4">Trusted by Industry Leaders</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div>• ABM Industries - Fortune 500 fleet optimization</div>
              <div>• Aramark - Global facility management</div>
              <div>• Leading fleet operators nationwide</div>
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Get Started</h3>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                Ready to transform your vehicle lifecycle with AI? Join forward-thinking fleet managers 
                who use AI to make smarter decisions.
              </p>
              
              <div className="space-y-3">
                <Button 
                  className="w-full bg-[#2c5aa0] hover:bg-[#1e3f73] text-white font-semibold py-3"
                >
                  See the AI Calendar
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3"
                >
                  Talk to a Fleet Engineer
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-white">How It Works:</strong> Connect spreadsheet data → 
                  Auto-calendar 60 months → Export budgets & approvals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2025 FURY. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Cookie Policy</a>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>AI-Powered Fleet Intelligence</span>
              <span>•</span>
              <span>Built for Fleet Professionals</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;