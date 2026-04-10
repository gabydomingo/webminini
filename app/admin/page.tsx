// src/app/admin/page.tsx
'use client'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Hola! Bienvenido al panel</h1>
      <p className="text-gray-600 mb-8">Desde aquí podrás gestionar los complementos de la página web.</p>

      {/* Grilla de métricas rápidas (Para darle ese look de dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-900">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Propiedades Activas</h3>
          <p className="text-3xl font-bold text-gray-900">306</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-900">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Videos Vinculados</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-900">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Última Sincronización</h3>
          <p className="text-xl font-bold text-gray-900 mt-2">Hoy, 10:00 AM</p>
        </div>
      </div>

      {/* Un espacio para futuros avisos o instrucciones */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">¿Qué podés hacer aquí?</h2>
        <ul className="space-y-3 text-gray-600">
          <li>👉 <strong>Redes Sociales:</strong> Pegar los links de TikTok o Instagram para que aparezcan en el celular de la pantalla principal.</li>
          <li>👉 <strong>Sincronizar Adinco:</strong> Forzar una actualización manual para traer las últimas casas cargadas en el sistema.</li>
        </ul>
      </div>
    </div>
  )
}