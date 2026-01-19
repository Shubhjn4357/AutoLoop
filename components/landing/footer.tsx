export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © 2026 OutreachAI. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made by</span>
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shubh Jain
            </span>
            <span>♥️</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
