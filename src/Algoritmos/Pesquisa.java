package Algoritmos;

// se necessario podem alterar
import Objects.Grafo;
import Objects.LinhaFerrea;
import Objects.Town;
import java.util.*;

public class Pesquisa {

    // DFS - Busca em Profundidade
    public static void dfs(Grafo grafo, Town inicio) {
        System.out.println("\n--- DFS a partir de " + inicio.getName() + " ---");
        Set<Town> visitados = new HashSet<>();
        dfsRecursivo(grafo, inicio, visitados);
        System.out.println();
    }

    private static void dfsRecursivo(Grafo grafo, Town atual, Set<Town> visitados) {
        visitados.add(atual);
        System.out.print(atual.getName() + " ");
        for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
            if (!visitados.contains(lf.getDestino())) {
                dfsRecursivo(grafo, lf.getDestino(), visitados);
            }
        }
    }

    // BFS - Busca em Largura
    public static void bfs(Grafo grafo, Town inicio) {
        System.out.println("\n--- BFS a partir de " + inicio.getName() + " ---");
        Set<Town> visitados = new HashSet<>();
        Queue<Town> fila = new LinkedList<>();

        visitados.add(inicio);
        fila.add(inicio);

        while (!fila.isEmpty()) {
            Town atual = fila.poll();
            System.out.print(atual.getName() + " ");

            for (LinhaFerrea lf : grafo.getListaAdjacencia().get(atual)) {
                if (!visitados.contains(lf.getDestino())) {
                    visitados.add(lf.getDestino());
                    fila.add(lf.getDestino());
                }
            }
        }
        System.out.println();
    }
}
