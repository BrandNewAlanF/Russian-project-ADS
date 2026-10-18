package Algoritmos;

import Objects.Grafo;
import Objects.LinhaFerrea;
import Objects.Town;

import java.util.*;

public class CaminhoMinimo {

    // Algoritmo de Dijkstra
    public static void dijkstra(Grafo grafo, Town origem, Town destino) {
        System.out.println("\n--- Dijkstra: " + origem.getName() + " até " + destino.getName() + " ---");
        Map<Town, Float> distancias = new HashMap<>();
        Map<Town, Town> anteriores = new HashMap<>();
        PriorityQueue<LinhaFerrea> pq = new PriorityQueue<>(Comparator.comparingDouble(LinhaFerrea::getCusto));

        for (Town t : grafo.getVertices()) distancias.put(t, Float.MAX_VALUE);
        distancias.put(origem, 0f);
        pq.add(new LinhaFerrea("", 0, origem, origem));

        while (!pq.isEmpty()) {
            LinhaFerrea atual = pq.poll();
            Town u = atual.getDestino();

            if (atual.getCusto() > distancias.get(u)) continue;
            if (u.equals(destino)) break;

            for (LinhaFerrea vizinho : grafo.getListaAdjacencia().get(u)) {
                float novaDist = distancias.get(u) + vizinho.getCusto();
                if (novaDist < distancias.get(vizinho.getDestino())) {
                    distancias.put(vizinho.getDestino(), novaDist);
                    anteriores.put(vizinho.getDestino(), u);
                    pq.add(new LinhaFerrea("", novaDist, u, vizinho.getDestino()));
                }
            }
        }

        if (distancias.get(destino) == Float.MAX_VALUE) {
            System.out.println("Não há caminho entre " + origem.getName() + " e " + destino.getName());
            return;
        }

        System.out.println("Custo mínimo: " + distancias.get(destino));
        List<String> caminho = new ArrayList<>();
        for (Town at = destino; at != null; at = anteriores.get(at)) {
            caminho.add(at.getName());
        }
        Collections.reverse(caminho);
        System.out.println("Caminho: " + String.join(" -> ", caminho));
    }
}


