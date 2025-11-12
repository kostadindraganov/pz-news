export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          PZ-News - Новини от Пазарджик
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          Регионална новинарска платформа
        </p>
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            🚀 Next.js 16 | TypeScript | Supabase | Cloudflare R2
          </p>
        </div>
      </div>
    </main>
  )
}
