import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Bot, User, AlertCircle, Phone, Dog, Cat, Send, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { mockConversations } from "@/data/mockData";

export default function Conversas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);

  const filteredConversations = mockConversations.filter((conv) =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ai":
        return <Bot className="w-4 h-4 text-ocean-blue animate-pulse" />;
      case "waiting":
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-bounce" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto paw-pattern">
      <PageHeader
        title="Central de Conversas"
        subtitle="Gerencie todas as conversas com clientes em tempo real"
        actions={
          <Button className="btn-gradient text-white shadow-lg hover:shadow-xl">
            <MessageSquare className="w-4 h-4" />
            Nova Conversa
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Filtros e Lista de Conversas */}
        <div className="col-span-3 space-y-4">
          <Card className="card-premium fade-in">
            <CardContent className="p-4">
              <SearchInput
                placeholder="Buscar conversas..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

              <div className="mt-6 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-ocean-blue/10 hover:text-ocean-blue font-medium">
                  <div className="w-2 h-2 rounded-full bg-ocean-blue mr-2 animate-pulse" />
                  Todas
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-ocean-blue/10">
                  <Bot className="w-4 h-4 mr-2 text-ocean-blue" />
                  IA Respondendo
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-yellow-500/10">
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                  Aguardando
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-green-500/10">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Resolvidas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium flex-1 slide-in">
            <CardContent className="p-3">
              <ScrollArea className="h-[calc(100vh-450px)]">
                <div className="space-y-3">
                  {filteredConversations.map((conv, idx) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                      className={`p-4 rounded-xl cursor-pointer smooth-transition hover-lift group ${
                        selectedConversation.id === conv.id
                          ? "bg-gradient-to-br from-ocean-blue/20 to-sky-blue/10 border-2 border-ocean-blue/40 shadow-lg"
                          : "hover:bg-muted/50 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center text-white font-semibold shadow-lg">
                            {conv.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm group-hover:text-ocean-blue transition-colors">
                              {conv.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {conv.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusIcon(conv.status)}
                          {conv.unread > 0 && (
                            <Badge className="bg-gradient-to-r from-ocean-blue to-sky-blue text-white shadow-lg animate-pulse">
                              {conv.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 ml-12">
                        {conv.lastMessage}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Ativo */}
        <Card className="col-span-6 card-premium fade-in">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Header do Chat */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center text-white font-bold text-lg shadow-xl">
                    {selectedConversation.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl font-display">{selectedConversation.customerName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3" />
                      {selectedConversation.phone}
                      {selectedConversation.status === "ai" && (
                        <Badge variant="secondary" className="ml-2 gap-1 bg-ocean-blue/10 text-ocean-blue border-ocean-blue/20">
                          <Sparkles className="w-3 h-3" />
                          IA Ativa
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <Button className="btn-gradient text-white shadow-lg">
                  Assumir Conversa
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-background to-muted/10">
              <div className="space-y-6">
                <div className="flex gap-4 slide-in">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl rounded-tl-none p-4 max-w-[70%] shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-sm leading-relaxed">{selectedConversation.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedConversation.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 justify-end slide-in" style={{ animationDelay: "0.1s" }}>
                  <div className="bg-gradient-to-br from-ocean-blue to-sky-blue rounded-2xl rounded-tr-none p-4 max-w-[70%] shadow-xl hover:shadow-2xl transition-shadow">
                    <p className="text-sm text-white leading-relaxed">
                      Oi! Aqui é a Maria! 😊 Que alegria falar com você!
                    </p>
                    <p className="text-xs text-white/80 mt-2 flex items-center gap-1 justify-end">
                      Agora
                      <CheckCircle2 className="w-3 h-3" />
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center flex-shrink-0 shadow-xl pulse-glow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex gap-4 justify-end slide-in" style={{ animationDelay: "0.2s" }}>
                  <div className="bg-gradient-to-br from-ocean-blue to-sky-blue rounded-2xl rounded-tr-none p-4 max-w-[70%] shadow-xl hover:shadow-2xl transition-shadow">
                    <p className="text-sm text-white leading-relaxed">
                      Sim! A gente faz banho com todo carinho! 🐶✨<br/><br/>
                      Como você se chama? E qual o nome do seu cachorrinho? 💕
                    </p>
                    <p className="text-xs text-white/80 mt-2 flex items-center gap-1 justify-end">
                      Agora
                      <CheckCircle2 className="w-3 h-3" />
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center flex-shrink-0 shadow-xl pulse-glow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-6 border-t border-border bg-gradient-to-r from-background to-muted/20">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-border bg-background/50 backdrop-blur-sm focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 transition-all outline-none"
                />
                <Button className="btn-gradient text-white shadow-lg px-6">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contexto da IA */}
        <Card className="col-span-3 card-premium slide-in" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-blue to-sky-blue flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-lg font-display">Contexto IA</h3>
            </div>

            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-ocean-blue animate-pulse" />
                    STATUS
                  </p>
                  <Badge className={`${
                    selectedConversation.status === "ai" 
                      ? "bg-gradient-to-r from-ocean-blue to-sky-blue text-white shadow-lg" 
                      : "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                  }`}>
                    {selectedConversation.status === "ai" ? "IA Respondendo" : "Aguardando"}
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    CLIENTE
                  </p>
                  <p className="font-semibold mb-2">{selectedConversation.customerName}</p>
                  <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
                    Novo Cliente
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                    🐾 PETS
                  </p>
                  {selectedConversation.petName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-blue/20 to-sky-blue/10 flex items-center justify-center">
                        {selectedConversation.petType === "dog" ? (
                          <Dog className="w-5 h-5 text-ocean-blue" />
                        ) : (
                          <Cat className="w-5 h-5 text-ocean-blue" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{selectedConversation.petName}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.petType === "dog" ? "Cachorro" : "Gato"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum ainda</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 hover-lift">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                    🎯 INTENÇÃO DETECTADA
                  </p>
                  <Badge variant="outline" className="border-ocean-blue/30 text-ocean-blue bg-ocean-blue/5">
                    {selectedConversation.intent}
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 hover-lift">
                  <p className="text-xs font-semibold text-green-600 mb-3 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AÇÕES EXECUTADAS
                  </p>
                  {selectedConversation.aiActions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedConversation.aiActions.map((action, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-2 text-xs text-green-600 p-2 rounded-lg bg-green-500/10 slide-in"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium">
                            {action.replace("create_", "Cadastrou ").replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma ação ainda</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
