package Objects;

import java.util.*;
//Tive que criar esta classe para testar cenas 
//se for necessario alterar cenas, podem
public class Grafo {
    private final Map<Town, List<LinhaFerrea>> listaAdjacencia;
    private final List<Town> vertices;
    private final List<LinhaFerrea> todasArestas;
    private float[][] matrizAdjacencia;

    public Grafo(List<Town> vertices) {
        this.vertices = vertices;
        this.listaAdjacencia = new HashMap<>();
        this.todasArestas = new ArrayList<>();

        for (Town t : vertices) {
            listaAdjacencia.put(t, new ArrayList<>());
        }

        this.matrizAdjacencia = new float[vertices.size()][vertices.size()];
        for (float[] linha : matrizAdjacencia) {
            Arrays.fill(linha, 0);
        }
    }

    public void adicionarAresta(String nome, float custo, Town origem, Town destino) {
        LinhaFerrea linha = new LinhaFerrea(nome, custo, origem, destino);

        // Lista de Adjacencia (Nao direcionado)
        listaAdjacencia.get(origem).add(linha);
        listaAdjacencia.get(destino).add(new LinhaFerrea(nome, custo, destino, origem));

        // Matriz de Adjacencia
        int i = vertices.indexOf(origem);
        int j = vertices.indexOf(destino);
        matrizAdjacencia[i][j] = custo;
        matrizAdjacencia[j][i] = custo;

        // Lista global de arestas (para Kruskal) tava testar algo
        todasArestas.add(linha);
    }

//adiantei esta parte para poder analisar a outra alinea
    // e) Algoritmo de Kruskal (Árvore Geradora Mínima)
    public void kruskal() {
        System.out.println("\n--- e) Algoritmo de Kruskal (MST) ---");
        List<LinhaFerrea> arestasOrdenadas = new ArrayList<>(todasArestas);
        //Collections.sort(arestasOrdenadas);

        Map<Town, Town> pai = new HashMap<>();
        for (Town t : vertices) pai.put(t, t);

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

    private Town encontrar(Map<Town, Town> pai, Town t) {
        if (!pai.get(t).equals(t)) {
            pai.put(t, encontrar(pai, pai.get(t)));
        }
        return pai.get(t);
    }

    // f) Algoritmo de Prim (Árvore Geradora Mínima)
    public void prim(Town inicio) {
        System.out.println("\n--- f) Algoritmo de Prim (MST) a partir de " + inicio.getName() + " ---");
        Set<Town> naMST = new HashSet<>();
        PriorityQueue<LinhaFerrea> pq = new PriorityQueue<>(Comparator.comparingDouble(LinhaFerrea::getCusto));
        float custoTotal = 0;

        naMST.add(inicio);
        pq.addAll(listaAdjacencia.get(inicio));

        while (!pq.isEmpty() && naMST.size() < vertices.size()) {
            LinhaFerrea lf = pq.poll();
            if (naMST.contains(lf.getDestino())) continue;

            naMST.add(lf.getDestino());
            custoTotal += lf.getCusto();
            System.out.println(lf);

            for (LinhaFerrea prox : listaAdjacencia.get(lf.getDestino())) {
                if (!naMST.contains(prox.getDestino())) {
                    pq.add(prox);
                }
            }
        }
        System.out.println("Custo Total da MST (Prim): " + custoTotal);
    }


    // g) Algoritmo de Dijkstra (Caminho Mínimo)
    public void dijkstra(Town origem, Town destino) {
        System.out.println("\n--- g) Algoritmo de Dijkstra: " + origem.getName() + " ate " + destino.getName() + " ---");
        Map<Town, Float> distancias = new HashMap<>();
        Map<Town, Town> anteriores = new HashMap<>();
        PriorityQueue<LinhaFerrea> pq = new PriorityQueue<>(Comparator.comparingDouble(LinhaFerrea::getCusto));

        for (Town t : vertices) distancias.put(t, Float.MAX_VALUE);
        distancias.put(origem, 0f);
        pq.add(new LinhaFerrea("", 0, origem, origem));

        while (!pq.isEmpty()) {
            LinhaFerrea atual = pq.poll();
            Town u = atual.getDestino();

            if (atual.getCusto() > distancias.get(u)) continue;
            if (u.equals(destino)) break;

            for (LinhaFerrea vizinho : listaAdjacencia.get(u)) {
                float novaDist = distancias.get(u) + vizinho.getCusto();
                if (novaDist < distancias.get(vizinho.getDestino())) {
                    distancias.put(vizinho.getDestino(), novaDist);
                    anteriores.put(vizinho.getDestino(), u);
                    pq.add(new LinhaFerrea("", novaDist, u, vizinho.getDestino()));
                }
            }
        }

        if (distancias.get(destino) == Float.MAX_VALUE) {
            System.out.println("Nao ha caminho entre " + origem.getName() + " e " + destino.getName());
            return;
        }

        System.out.println("Custo minimo: " + distancias.get(destino));
        List<String> caminho = new ArrayList<>();
        for (Town at = destino; at != null; at = anteriores.get(at)) {
            caminho.add(at.getName());
        }
        Collections.reverse(caminho);
        System.out.println("Caminho: " + String.join(" -> ", caminho));
    }

    // i) Heurística para o Problema do Caixeiro Viajante (Vizinho Mais Próximo)
    public void rotaMenorPerimetro(Town inicio) {
        System.out.println("\n--- i) Rota de Menor Perímetro (Heuristica Vizinho Mais Próximo) ---");
        List<Town> rota = new ArrayList<>();
        Set<Town> visitados = new HashSet<>();
        Town atual = inicio;
        rota.add(atual);
        visitados.add(atual);
        float custoTotal = 0;

        while (visitados.size() < vertices.size()) {
            LinhaFerrea melhorAresta = null;
            float menorCusto = Float.MAX_VALUE;

            for (LinhaFerrea lf : listaAdjacencia.get(atual)) {
                if (!visitados.contains(lf.getDestino()) && lf.getCusto() < menorCusto) {
                    menorCusto = lf.getCusto();
                    melhorAresta = lf;
                }
            }

            if (melhorAresta == null) {
                System.out.println("Grafo desconexo! Nao é possível visitar todos os nós.");
                return;
            }

            rota.add(melhorAresta.getDestino());
            visitados.add(melhorAresta.getDestino());
            custoTotal += melhorAresta.getCusto();
            atual = melhorAresta.getDestino();
        }

        for (LinhaFerrea lf : listaAdjacencia.get(atual)) {
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

    public Map<Town, List<LinhaFerrea>> getListaAdjacencia() {
        return listaAdjacencia;
    }
}