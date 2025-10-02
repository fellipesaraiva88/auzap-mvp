import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, TrendingUp, Bot, Package } from "lucide-react";
import { mockSales } from "@/data/mockData";

export default function Vendas() {
  const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.total, 0);
  const aiSales = mockSales.filter((s) => s.soldBy === "ai").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Vendas"
        subtitle="Acompanhe suas vendas e produtos"
        actions={
          <Button>
            <ShoppingCart className="w-4 h-4" />
            Nova Venda
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          title="Receita Total"
          value={`R$ ${totalRevenue}`}
          subtitle="Últimas 24h"
          trend={{ value: "12%", positive: true }}
        />
        <StatCard
          icon={ShoppingCart}
          title="Total de Vendas"
          value={mockSales.length}
          subtitle="Últimas 24h"
        />
        <StatCard
          icon={Bot}
          title="Vendas pela IA"
          value={aiSales}
          subtitle="Automáticas"
        />
        <StatCard
          icon={TrendingUp}
          title="Ticket Médio"
          value={`R$ ${Math.round(totalRevenue / mockSales.length)}`}
          subtitle="Por venda"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Vendas Recentes */}
        <Card className="col-span-8 glass-card">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 rounded-lg border border-border hover:border-ocean-blue/50 smooth-transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{sale.customerName}</h4>
                        {sale.soldBy === "ai" && (
                          <Badge variant="secondary" className="gap-1">
                            <Bot className="w-3 h-3" />
                            IA
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 mb-2">
                        {sale.products.map((product, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {product.quantity}x {product.name} - R$ {product.price}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sale.date} às {sale.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        R$ {sale.total}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className="col-span-4 glass-card">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-ocean-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Ração Premium 15kg</p>
                  <p className="text-xs text-muted-foreground">8 vendas</p>
                </div>
                <p className="font-semibold text-ocean-blue">R$ 180</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-ocean-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Shampoo Pet</p>
                  <p className="text-xs text-muted-foreground">5 vendas</p>
                </div>
                <p className="font-semibold text-ocean-blue">R$ 35</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              Ver Todos os Produtos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
