import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-neutral-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-10 h-10">
                <Image
                  src="/graphics/nnb-logo.jpeg"
                  alt="N&B Hotel"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold">N&B Hotel</h3>
                <p className="text-xs text-neutral-400">Smart Living</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400">
              Modern accommodation designed for digital nomads and remote workers!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="text-neutral-400 hover:text-white transition-colors">
                  Main
                </a>
              </li>
              <li>
                <a href="#rooms" className="text-neutral-400 hover:text-white transition-colors">
                  Rooms
                </a>
              </li>
              <li>
                <a href="#facilities" className="text-neutral-400 hover:text-white transition-colors">
                  Facilities
                </a>
              </li>
              <li>
                <a href="#about" className="text-neutral-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>Online Booking</li>
              <li>Self Check-in</li>
              <li>24/7 Support</li>
              <li>Coworking Space</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-neutral-400">
                  123 City Center Street<br />
                  Downtown, City 12345
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <a href="tel:+1234567890" className="text-neutral-400 hover:text-white transition-colors">
                  +123 456 7890
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <a href="mailto:info@nnb.hotel" className="text-neutral-400 hover:text-white transition-colors">
                  info@nnb.hotel
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
          <p>&copy; {new Date().getFullYear()} N&B Hotel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}