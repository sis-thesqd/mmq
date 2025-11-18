export default function Custom500() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          500 - Server Error
        </h2>
        <p className="text-muted-foreground">
          Something went wrong. Please try again later.
        </p>
      </div>
    </div>
  )
}

