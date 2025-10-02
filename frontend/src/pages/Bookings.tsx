export default function Bookings() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <p className="text-gray-600 mt-1">Gerencie agendamentos e horários</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Agendamentos carregando...</p>
      </div>
    </div>
  );
}
