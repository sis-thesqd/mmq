export default function Custom404() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          404 - Page Not Found
        </h2>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    </div>
  )
}

