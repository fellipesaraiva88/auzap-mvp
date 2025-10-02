import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Bot, User, AlertCircle, Phone, Dog, Cat } from "lucide-react";
import { mockConversations } from "@/data/mockData";

export default function Conversas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);

  const filteredConversations = mockConversations.filter((conv) =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <PageHeader
        title="Central de Conversas"
        subtitle="Gerencie todas as conversas com clientes"
        actions={
          <Button>
            <MessageSquare className="w-4 h-4" />
            Nova Conversa
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Filtros e Lista de Conversas */}
        <Card className="col-span-3 glass-card">
          <CardContent className="p-4">
            <SearchInput
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="mt-4 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Todas
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                🤖 IA Respondendo
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                🙋 Respondidas por Humano
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                ⏳ Aguardando
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-400px)] mt-4">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer smooth-transition ${
                      selectedConversation.id === conv.id
                        ? "bg-ocean-blue/10 border border-ocean-blue/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm">{conv.customerName}</p>
                      {conv.status === "ai" && <Bot className="w-4 h-4 text-ocean-blue" />}
                      {conv.status === "waiting" && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{conv.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">{conv.timestamp}</p>
                    {conv.unread > 0 && (
                      <Badge className="mt-2" variant="default">
                        {conv.unread} nova{conv.unread > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Ativo */}
        <Card className="col-span-6 glass-card">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Header do Chat */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedConversation.customerName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedConversation.phone}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Assumir Conversa
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-ocean-blue/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-ocean-blue" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm">{selectedConversation.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedConversation.timestamp}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-ocean-blue/10 rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm">Oi! Aqui é a Maria! 😊 Que alegria falar com você!</p>
                    <p className="text-xs text-muted-foreground mt-1">Agora</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-ocean-blue flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
                />
                <Button>Enviar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contexto da IA */}
        <Card className="col-span-3 glass-card">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Contexto IA</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">📊 Status</p>
                <Badge variant="outline">{selectedConversation.status === "ai" ? "IA Respondendo" : "Aguardando"}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">👤 Cliente</p>
                <p className="text-sm">{selectedConversation.customerName}</p>
                <Badge className="mt-1" variant="secondary">Novo</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">🐾 Pets</p>
                <div className="flex items-center gap-2">
                  {selectedConversation.petType === "dog" ? (
                    <Dog className="w-4 h-4 text-ocean-blue" />
                  ) : (
                    <Cat className="w-4 h-4 text-ocean-blue" />
                  )}
                  <p className="text-sm">{selectedConversation.petName || "Nenhum ainda"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">🎯 Intenção</p>
                <Badge variant="outline">{selectedConversation.intent}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">🤖 Ações IA</p>
                {selectedConversation.aiActions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedConversation.aiActions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-green-600">
                        ✅ {action.replace("create_", "Cadastrou ").replace("_", " ")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma ação ainda</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
