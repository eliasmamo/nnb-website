import { Wifi, Briefcase, Zap, DollarSign, MapPin, Clock } from 'lucide-react';

const features = [
  {
    icon: Briefcase,
    title: 'Dedicated Workspace',
    description: 'Ergonomic desk and chair in every room, perfect for remote work',
  },
  {
    icon: Wifi,
    title: 'High-Speed Internet',
    description: 'Fiber-optic connection with 500+ Mbps for seamless video calls',
  },
  {
    icon: Zap,
    title: 'Smart Automation',
    description: 'Fully automated hotel with keyless entry and smart room controls',
  },
  {
    icon: DollarSign,
    title: 'Affordable Pricing',
    description: 'Competitive rates designed for long-term stays and digital nomads',
  },
  {
    icon: MapPin,
    title: 'City Center',
    description: 'Prime location with easy access to cafes, coworking spaces, and transport',
  },
  {
    icon: Clock,
    title: '24/7 Self Check-in',
    description: 'Arrive anytime with our automated check-in system',
  },
];

export default function Features() {
  return (
    <section id="facilities" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Why Digital Nomads Choose Us
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to work remotely and live comfortably
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}