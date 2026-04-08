export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <div className="mb-4">
          <img 
            src="/images/logo.jpg" 
            alt="Rafaela Hoy" 
            className="w-32 h-32 mx-auto object-contain animate-pulse"
          />
        </div>
        <div className="text-white text-lg font-medium">Cargando...</div>
        <div className="mt-2">
          <div className="w-16 h-1 bg-primary/30 rounded-full mx-auto overflow-hidden">
            <div className="w-8 h-full bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
