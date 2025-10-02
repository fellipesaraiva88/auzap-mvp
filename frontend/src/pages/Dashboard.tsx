import { useState } from 'react';
import { useAuthStore } from '@/store/auth';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');

  return (
    <div className="p-8">
        {/* Aurora Chat */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🤝</div>
            <div>
              <h2 className="text-xl font-semibold">Aurora - Sua Parceira de Negócios</h2>
              <p className="text-sm text-gray-500">Olá {user?.full_name}! 👋 Como posso ajudar hoje?</p>
            </div>
          </div>

          {/* Chat messages area */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] mb-4">
            <div className="space-y-4">
              <div className="bg-blue-100 rounded-lg p-3 max-w-md">
                <p className="text-sm">💡 Oportunidade Identificada</p>
                <p className="text-sm mt-2">18 clientes não aparecem há mais de 60 dias</p>
                <p className="text-sm font-semibold mt-1">💰 Receita potencial: R$ 3.240</p>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem para Aurora..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Enviar
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
              Quantos banhos essa semana?
            </button>
            <button className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
              Clientes inativos
            </button>
            <button className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">
              Preencher agenda
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Receita Hoje</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">R$ 2.340</div>
            <div className="text-xs text-green-600 mt-1">+15% vs ontem</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Agendamentos</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">12</div>
            <div className="text-xs text-gray-600 mt-1">serviços hoje</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Clientes</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">8</div>
            <div className="text-xs text-gray-600 mt-1">atendidos hoje</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-500">Tempo Livre</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">4h</div>
            <div className="text-xs text-gray-600 mt-1">com Aurora</div>
          </div>
        </div>
      </div>
  );
}
