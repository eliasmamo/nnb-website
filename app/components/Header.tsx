'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Hotel Name */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src="/graphics/nnb-logo.jpeg"
                alt="N&B Hotel"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">N&B Hotel</h1>
              <p className="text-xs text-muted-foreground">Smart Living for Digital Nomads</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              Main
            </a>
            <a href="#rooms" className="text-foreground hover:text-primary transition-colors">
              Rooms
            </a>
            <a href="#facilities" className="text-foreground hover:text-primary transition-colors">
              Facilities
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Quick Contact */}
          <div className="hidden lg:flex items-center space-x-4">
            <a href="tel:+1234567890" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4 mr-2" />
              +123 456 7890
            </a>
            <a href="mailto:info@nnb.hotel" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4 mr-2" />
              info@nnb.hotel
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}