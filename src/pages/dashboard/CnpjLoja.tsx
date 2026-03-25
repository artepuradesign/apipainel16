import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import { Store, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cnpjProdutosService, type CnpjProduto } from '@/services/cnpjProdutosService';
import { normalizeProductPhotos, splitStoreSections, STORE_HIGHLIGHT_LABELS, getHighlightFromTags } from '@/components/cnpj-loja/storefrontUtils';

const formatPrice = (value: number) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const CnpjLoja = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [produtos, setProdutos] = useState<CnpjProduto[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const result = await cnpjProdutosService.list({
        limit: 200,
        offset: 0,
        cnpj: user?.cnpj || undefined,
        status: 'ativo',
      });

      if (!result.success || !result.data) {
        setProdutos([]);
        setError(result.error || 'Não foi possível carregar sua loja.');
        setLoading(false);
        return;
      }

      setProdutos(result.data.data || []);
      setLoading(false);
    };

    load();
  }, [user?.cnpj]);

  const sections = useMemo(() => splitStoreSections(produtos), [produtos]);

  const renderSection = (title: string, items: CnpjProduto[]) => {
    if (items.length === 0) return null;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/cnpj-produtos')}>
            Gerenciar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((produto) => {
            const image = normalizeProductPhotos(produto)[0] || '';
            const highlight = getHighlightFromTags(produto.tags);

            return (
              <Card key={produto.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/cnpj-produto?id=${produto.id}`)}
                    className="w-full text-left"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`Imagem do produto ${produto.nome_produto}`}
                        loading="lazy"
                        className="h-40 w-full rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-md border bg-muted/40 text-xs text-muted-foreground">
                        Sem imagem
                      </div>
                    )}
                  </button>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{produto.categoria || 'Sem categoria'}</Badge>
                      {highlight ? <Badge variant="outline">{STORE_HIGHLIGHT_LABELS[highlight]}</Badge> : null}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{produto.nome_produto}</h3>
                    <p className="text-lg font-bold">{formatPrice(produto.preco)}</p>
                    <Button className="w-full" onClick={() => navigate(`/dashboard/cnpj-produto?id=${produto.id}`)}>
                      Ver produto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <SimpleTitleBar
        title="Loja Virtual CNPJ"
        subtitle="Vitrine da sua empresa com produtos para venda"
        icon={<Store className="h-4 w-4 sm:h-5 sm:w-5" />}
        onBack={() => navigate('/dashboard')}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Modelo da loja</p>
            <h1 className="text-xl font-semibold tracking-tight">Sua loja online pronta para vender</h1>
            <p className="text-sm text-muted-foreground">Destaque lançamentos, produtos mais vendidos e ofertas com atualização automática.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/cnpj-produtos')}>Gerenciar produtos</Button>
            <Button onClick={() => navigate('/dashboard/cnpj-produto')}>
              <ShoppingBag className="h-4 w-4" />
              Visualizar produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[280px] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      ) : sections.todos.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Nenhum produto ativo encontrado para a loja.</CardContent>
        </Card>
      ) : (
        <>
          {renderSection('Lançamentos', sections.lancamentos)}
          {renderSection('Mais vendidos', sections.maisVendidos)}
          {renderSection('Ofertas', sections.ofertas)}
        </>
      )}
    </div>
  );
};

export default CnpjLoja;
