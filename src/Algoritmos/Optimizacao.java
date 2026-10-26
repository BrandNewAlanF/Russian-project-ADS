package Algoritmos;

//nao sei se entendi mal mas se for necessario alrerar fiquem a vontade, tenho meus backups
import Busisnes_Logic.RedeFerroviaria;
import Objects.Grafo;
import Objects.LinhaFerrea;
import Objects.Town;
import java.util.*;

public class Optimizacao {

    public static void prim(String inicio) {
        prim(RedeFerroviaria.carregarGrafo(), inicio);
    }

    public static void prim(String caminhoArquivo, String inicio) {
        prim(RedeFerroviaria.carregarGrafo(caminhoArquivo), inicio);
    }

    private static void prim(Grafo grafo, String nomeInicio) {
        if (grafo == null) {
            return;
        }
        Town inicio = null;
        for (Town cidade : grafo.getVertices()) {
            if (cidade.getName().equalsIgnoreCase(nomeInicio)) {
                inicio = cidade;
                break;
            }
        }
        if (inicio == null) {
            System.err.println("Erro ao executar Prim: a cidade inicial não existe na matriz: " + nomeInicio);
            return;
        }
        prim(grafo, inicio);
    }

    // Algoritmo de Prim
    public static void prim(Grafo grafo, Town inicio) {
        if (grafo == null || inicio == null || !grafo.getListaAdjacencia().containsKey(inicio)) {
            System.err.println("Erro ao executar Prim: grafo ou cidade inicial inválidos.");
            return;
        }
        System.out.println("\n--- Prim (MST) a partir de " + inicio.getName() + " ---");
        Set<Town> naMST = new HashSet<>();
        PriorityQueue<LinhaFerrea> pq = new PriorityQueue<>(Comparator.comparingDouble(LinhaFerrea::getCusto));
        float custoTotal = 0;

        naMST.add(inicio);
        pq.addAll(grafo.getListaAdjacencia().get(inicio));

        while (!pq.isEmpty() && naMST.size() < grafo.getVertices().size()) {
            LinhaFerrea lf = pq.poll();
            if (naMST.contains(lf.getDestino())) continue;

            naMST.add(lf.getDestino());
            custoTotal += lf.getCusto();
            System.out.println(lf);

            for (LinhaFerrea prox : grafo.getListaAdjacencia().get(lf.getDestino())) {
                if (!naMST.contains(prox.getDestino())) {
                    pq.add(prox);
                }
            }
        }
        if (naMST.size() != grafo.getVertices().size()) {
            System.out.println("Grafo desconexo: a árvore geradora mínima cobre apenas "
                    + naMST.size() + " de " + grafo.getVertices().size() + " cidades.");
        }
        System.out.println("Custo Total da MST (Prim): " + custoTotal);
    }

    // Algoritmo de Kruskal
    public static void kruskal(Grafo grafo) {
        System.out.println("\n--- Kruskal (MST) ---");
        List<LinhaFerrea> arestasOrdenadas = new ArrayList<>(grafo.getTodasArestas());
        // Como LinhaFerrea não implementa Comparable na tua versão, ordenamos com Comparator
        arestasOrdenadas.sort(Comparator.comparingDouble(LinhaFerrea::getCusto));

        Map<Town, Town> pai = new HashMap<>();
        for (Town t : grafo.getVertices()) pai.put(t, t);

        List<LinhaFerrea> mst = new ArrayList<>();
        float custoTotal = 0;

        for (LinhaFerrea lf : arestasOrdenadas) {
            Town raizOrigem = encontrar(pai, lf.getOrigem());
            Town raizDestino = encontrar(pai, lf.getDestino());

            if (!raizOrigem.equals(raizDestino)) {
                mst.add(lf);
                custoTotal += lf.getCusto();
                pai.put(raizOrigem, raizDestino);
            }
        }

        for (LinhaFerrea lf : mst) System.out.println(lf);
        System.out.println("Custo Total da MST (Kruskal): " + custoTotal);
    }

    private static Town encontrar(Map<Town, Town> pai, Town t) {
        if (!pai.get(t).equals(t)) {
            pai.put(t, encontrar(pai, pai.get(t)));
        }
        return pai.get(t);
    }

    // Heurística do Caixeiro Viajante (Vizinho Mais Proximo)
    public static void rotaMenorPerimetro(Grafo grafo, Town inicio) {
        System.out.println("\n--- Rota de Menor Perímetro (TSP Heurístico) ---");
        List<Town> rota = new ArrayList<>();
        Set<Town> visitados = new HashSet<>();
        Town atual = inicio;
        rota.add(atual);
        visitados.add(atual);
        float custoTotal = 0;

        while (visitados.size() < grafo.getVertices().size()) {
            LinhaFerrea melhorAresta = null;
            float menorCusto = Float.MAX_VALUE;

            for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
                if (!visitados.contains(lf.getDestino()) && lf.getCusto() < menorCusto) {
                    menorCusto = lf.getCusto();
                    melhorAresta = lf;
                }
            }

            if (melhorAresta == null) {
                System.out.println("Grafo desconexo! Não é possível visitar todos os nós.");
                return;
            }

            rota.add(melhorAresta.getDestino());
            visitados.add(melhorAresta.getDestino());
            custoTotal += melhorAresta.getCusto();
            atual = melhorAresta.getDestino();
        }

        // Tentar voltar ao inicio
        for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
            if (lf.getDestino().equals(inicio)) {
                custoTotal += lf.getCusto();
                rota.add(inicio);
                break;
            }
        }

        System.out.print("Rota encontrada: ");
        for (int i = 0; i < rota.size(); i++) {
            System.out.print(rota.get(i).getName() + (i < rota.size() - 1 ? " -> " : ""));
        }
        System.out.println("\nCusto Total do Perímetro: " + custoTotal);
    }
}
