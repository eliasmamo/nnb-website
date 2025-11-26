import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-50">
      <div className="flex flex-col items-center justify-center space-y-8 px-4">
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <Image
            src="/graphics/nnb-logo.jpeg"
            alt="N&B Hotel Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight">
            Launching Very Soon
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md">
            A modern hotel management experience is on its way
          </p>
        </div>
      </div>
    </main>
  )
}
